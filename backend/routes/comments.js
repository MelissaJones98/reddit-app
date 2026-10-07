const express = require('express');
const pool = require('../db/pool');
const requireAuth = require('../middleware/requireAuth');

// mergeParams: true lets these routes read :id from the path this router is mounted on in app.js (/api/posts/:id/comments)
// without it, req.params would only contain parameters written in THIS file, and req.params.id would be undefined
const router = express.Router({ mergeParams: true });

// shared SELECT so a comment always comes back in the same shape - postedBy is the commenter's username, matching how posts name their author
const SELECT_COMMENTS = `
  SELECT c.id,
         u.username AS "postedBy",
         c.content,
         c.created_at AS "createdAt"
  FROM comments c
  JOIN users u ON u.id = c.user_id`;

// both routes need the post to exist - this checks the :id is a whole number AND that a post with that id is in the database
async function postExists(id) {
  const postId = Number(id);
  if (!Number.isInteger(postId)) return false;
  const result = await pool.query('SELECT id FROM posts WHERE id = $1', [postId]);
  return result.rows.length > 0;
}

// get a post's comments - public, oldest first so a conversation reads top to bottom
router.get('/', async (req, res) => {
  try {
    if (!(await postExists(req.params.id))) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const result = await pool.query(
      `${SELECT_COMMENTS}
       WHERE c.post_id = $1
       ORDER BY c.created_at ASC, c.id ASC`, // ASC = oldest first (the opposite of the feed) - c.id breaks ties
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// add a comment - requireAuth means only logged in users get here, and req.user is who they are
router.post('/', requireAuth, async (req, res) => {
  // typeof check first so a missing field or a non-text value (e.g. a number) can't crash .trim()
  const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';

  if (!content) {
    return res.status(400).json({ error: 'Comment cannot be empty' }); // covers '', missing, and only spaces (trimmed to '')
  }

  try {
    if (!(await postExists(req.params.id))) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const inserted = await pool.query(
      'INSERT INTO comments (post_id, user_id, content) VALUES ($1, $2, $3) RETURNING id',
      [req.params.id, req.user.id, content] // the commenter comes from the verified token, never from the request body
    );

    // read it back through the shared SELECT so the response matches what GET returns
    const result = await pool.query(`${SELECT_COMMENTS} WHERE c.id = $1`, [inserted.rows[0].id]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;
