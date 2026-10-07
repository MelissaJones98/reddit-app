const express = require('express');
const pool = require('../db/pool');
const requireAuth = require('../middleware/requireAuth');
const optionalAuth = require('../middleware/optionalAuth');
const CATEGORIES = require('../constants/categories');

const router = express.Router();

// the SELECT shared by both routes, so a post always comes back in exactly the same shape:
// - JOIN users swaps the user_id number for the author's username
// - AS "postedBy" / "postHeading" rename the columns to the names the frontend Post component uses (double quotes keep the capital letters - Postgres lowercases unquoted names)
// - LEFT JOIN reactions brings in every like/dislike for the post - LEFT so posts with no reactions still appear (a plain JOIN would drop them)
// - COUNT(...) FILTER (WHERE ...) counts only the matching reactions, and ::int converts the count to a normal number (Postgres COUNT returns a bigint, which pg sends back as a string)
// - "userReaction" picks out the VIEWER's own reaction ('like', 'dislike' or null) - $1 is always the viewer's user id, or null for a logged out visitor
//   (MAX is needed because it's inside a GROUP BY - there's at most one matching row per post thanks to UNIQUE(post_id, user_id), so MAX just returns it)
const SELECT_POSTS = `
  SELECT p.id,
         u.username AS "postedBy",
         p.heading AS "postHeading",
         p.content,
         p.category,
         COUNT(r.id) FILTER (WHERE r.type = 'like')::int AS likes,
         COUNT(r.id) FILTER (WHERE r.type = 'dislike')::int AS dislikes,
         MAX(r.type) FILTER (WHERE r.user_id = $1) AS "userReaction",
         p.created_at AS "createdAt"
  FROM posts p
  JOIN users u ON u.id = p.user_id
  LEFT JOIN reactions r ON r.post_id = p.id`;
// GROUP BY (added in each query below) squashes the one-row-per-reaction results from the LEFT JOIN back into one row per post, which is what lets COUNT work

// get every post - public, no login needed to read the feed
// optionalAuth sets req.user if a valid token was sent, so logged in viewers also get their own userReaction on each post
router.get('/', optionalAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `${SELECT_POSTS}
       GROUP BY p.id, u.username
       ORDER BY p.created_at DESC, p.id DESC`, // newest first - p.id breaks ties between posts made in the same instant
      [req.user ? req.user.id : null] // $1 - the viewer, or null when logged out (nothing equals null in SQL, so userReaction comes back null)
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// get one post - public, used when someone opens a shared link like /post/12
// optionalAuth again, so a logged in viewer still sees which reaction they've chosen
router.get('/:id', optionalAuth, async (req, res) => {
  const postId = Number(req.params.id);
  if (!Number.isInteger(postId)) {
    return res.status(404).json({ error: 'Post not found' }); // e.g. /api/posts/abc - checked here because Postgres would throw a 500 if 'abc' reached the integer id column
  }

  try {
    const result = await pool.query(
      `${SELECT_POSTS}
       WHERE p.id = $2
       GROUP BY p.id, u.username`,
      [req.user ? req.user.id : null, postId] // $1 = the viewer (or null), $2 = the post - the same order as the create route
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' }); // a valid number, but no post has it (e.g. it was deleted)
    }

    res.json(result.rows[0]); // one object, not an array
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// create a post - requireAuth runs first, so this handler only runs for logged in users and req.user holds who they are
router.post('/', requireAuth, async (req, res) => {
  const { postHeading, content, category } = req.body; // postedBy is deliberately NOT read from the body - the author always comes from the verified token

  if (!postHeading || !content || !category) {
    return res.status(400).json({ error: 'Heading, content and category are required' });
  }

  if (!CATEGORIES.includes(category)) {
    return res.status(400).json({ error: 'Please choose a category from the list' });
  }

  try {
    const inserted = await pool.query(
      'INSERT INTO posts (user_id, heading, content, category) VALUES ($1, $2, $3, $4) RETURNING id',
      [req.user.id, postHeading, content, category]
    );

    // read the new post back through the same SELECT so the response has the exact shape GET returns (postedBy, likes: 0 etc)
    const result = await pool.query(
      `${SELECT_POSTS}
       WHERE p.id = $2
       GROUP BY p.id, u.username`,
      [req.user.id, inserted.rows[0].id] // $1 = the viewer (the author themselves), $2 = the new post
    );

    res.status(201).json(result.rows[0]); // 201 = created
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// like or dislike a post - the toggle rules live here on the server, so they're the same for everyone and can't be skipped by the browser
router.post('/:id/reactions', requireAuth, async (req, res) => {
  const postId = Number(req.params.id); // :id in the path arrives as text e.g. '12'
  const { type } = req.body;

  if (!Number.isInteger(postId)) {
    return res.status(404).json({ error: 'Post not found' }); // e.g. /api/posts/abc/reactions
  }

  if (type !== 'like' && type !== 'dislike') {
    return res.status(400).json({ error: 'Reaction must be like or dislike' });
  }

  try {
    const post = await pool.query('SELECT id FROM posts WHERE id = $1', [postId]);
    if (post.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // the user's current reaction on this post: 'like', 'dislike', or null if they haven't reacted
    const existing = await pool.query(
      'SELECT type FROM reactions WHERE post_id = $1 AND user_id = $2',
      [postId, req.user.id]
    );
    const currentReaction = existing.rows.length > 0 ? existing.rows[0].type : null;

    if (currentReaction === null) {
      await pool.query(
        'INSERT INTO reactions (post_id, user_id, type) VALUES ($1, $2, $3)',
        [postId, req.user.id, type]     // $1, $2, $3 in order
      );
    } else if (currentReaction === type) {
      await pool.query(
        'DELETE FROM reactions WHERE post_id = $1 AND user_id = $2',
        [postId, req.user.id]     // $1, $2 in order
      );
    } else {
      await pool.query(
        'UPDATE reactions SET type = $3 WHERE post_id = $1 AND user_id = $2',
        [postId, req.user.id, type]     // $1, $2, $3 in order
      );
    };

    // read back the post's new totals and this user's reaction, so the frontend can show exactly what's stored
    const result = await pool.query(
      `SELECT COUNT(*) FILTER (WHERE type = 'like')::int AS likes,
              COUNT(*) FILTER (WHERE type = 'dislike')::int AS dislikes,
              MAX(type) FILTER (WHERE user_id = $2) AS "userReaction"
       FROM reactions
       WHERE post_id = $1`,
      [postId, req.user.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;
