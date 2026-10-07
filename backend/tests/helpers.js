const jwt = require('jsonwebtoken');
const pool = require('../db/pool'); // during tests this is connected to reddit_app_test (see loadEnv.js)

// SAFETY CHECK: resetDatabase deletes every row - refuse to run at all unless we're connected to a database whose name ends in _test
// this protects the real reddit_app data if .env.test is missing or has the wrong DATABASE_URL pasted into it
const databaseName = (process.env.DATABASE_URL || '').split('/').pop();
if (!databaseName.endsWith('_test')) {
  throw new Error(`Tests must use a database ending in _test, but DATABASE_URL points at "${databaseName}". Check backend/.env.test`);
}

// empties every table so each test starts from a known, blank database
// DELETE rather than TRUNCATE because reddit_app_user is only granted SELECT/INSERT/UPDATE/DELETE - least privilege applies to tests too
// order matters: rows that reference other rows (comments, reactions -> posts -> users) are removed first
async function resetDatabase() {
  await pool.query('DELETE FROM comments');
  await pool.query('DELETE FROM reactions');
  await pool.query('DELETE FROM posts');
  await pool.query('DELETE FROM users');
}

// inserts a user directly - the password hash is a placeholder because these tests never log in, they make a token instead
async function createUser(username) {
  const result = await pool.query(
    `INSERT INTO users (username, email, password_hash)
     VALUES ($1, $2, 'not-a-real-hash')
     RETURNING id, username`,
    [username, `${username}@example.com`]
  );
  return result.rows[0];
}

// signs a real token for a user, exactly like createToken in routes/auth.js - so protected routes accept it
function tokenFor(user) {
  return jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// inserts a post directly (skipping the API) - createdAt is optional so tests can control the order posts were made in
async function createPost(user, { heading, content = 'Some content', category = 'Games', createdAt } = {}) {
  const result = await pool.query(
    `INSERT INTO posts (user_id, heading, content, category, created_at)
     VALUES ($1, $2, $3, $4, COALESCE($5, NOW()))
     RETURNING id`,
    [user.id, heading, content, category, createdAt || null]
  );
  return result.rows[0];
}

async function react(user, post, type) {
  await pool.query('INSERT INTO reactions (post_id, user_id, type) VALUES ($1, $2, $3)', [post.id, user.id, type]);
}

// inserts a comment directly - createdAt is optional so tests can control the order comments were written in
async function createComment(user, post, content, createdAt) {
  const result = await pool.query(
    `INSERT INTO comments (post_id, user_id, content, created_at)
     VALUES ($1, $2, $3, COALESCE($4, NOW()))
     RETURNING id`,
    [post.id, user.id, content, createdAt || null]
  );
  return result.rows[0];
}

module.exports = { pool, resetDatabase, createUser, tokenFor, createPost, react, createComment };
