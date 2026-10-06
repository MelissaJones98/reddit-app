const express = require('express');
const pool = require('../db/pool');
const requireAuth = require('../middleware/requireAuth');
const CATEGORIES = require('../constants/categories');

const router = express.Router();

// the SELECT shared by both routes, so a post always comes back in exactly the same shape:
// - JOIN users swaps the user_id number for the author's username
// - AS "postedBy" / "postHeading" rename the columns to the names the frontend Post component uses (double quotes keep the capital letters - Postgres lowercases unquoted names)
// - LEFT JOIN reactions brings in every like/dislike for the post - LEFT so posts with no reactions still appear (a plain JOIN would drop them)
// - COUNT(...) FILTER (WHERE ...) counts only the matching reactions, and ::int converts the count to a normal number (Postgres COUNT returns a bigint, which pg sends back as a string)
const SELECT_POSTS = `
  SELECT p.id,
         u.username AS "postedBy",
         p.heading AS "postHeading",
         p.content,
         p.category,
         COUNT(r.id) FILTER (WHERE r.type = 'like')::int AS likes,
         COUNT(r.id) FILTER (WHERE r.type = 'dislike')::int AS dislikes,
         p.created_at AS "createdAt"
  FROM posts p
  JOIN users u ON u.id = p.user_id
  LEFT JOIN reactions r ON r.post_id = p.id`;
// GROUP BY (added in each query below) squashes the one-row-per-reaction results from the LEFT JOIN back into one row per post, which is what lets COUNT work

// get every post - public, no login needed to read the feed
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `${SELECT_POSTS}
       GROUP BY p.id, u.username
       ORDER BY p.created_at DESC, p.id DESC` // newest first - p.id breaks ties between posts made in the same instant
    );
    res.json(result.rows);
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
       WHERE p.id = $1
       GROUP BY p.id, u.username`,
      [inserted.rows[0].id]
    );

    res.status(201).json(result.rows[0]); // 201 = created
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;
