const request = require('supertest');
const app = require('../app');
const { pool, resetDatabase, createUser, tokenFor, createPost, react } = require('./helpers');

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await pool.end();
});

// POST /api/posts/:id/reactions ------------------------------------------------------------------------------------------------------
// the like/dislike rules that used to live in Post.js now live on the server, so they're the same for everyone and survive a refresh:
//   - no reaction yet + click   -> add it
//   - click the SAME again      -> remove it
//   - click the OTHER one       -> switch to it
// every response sends back the post's new totals plus the user's current reaction, so the frontend just displays what the server says
describe('POST /api/posts/:id/reactions', () => {
  // a fresh post and a logged in user for each test
  let author;
  let user;
  let post;
  beforeEach(async () => {
    author = await createUser('author');
    user = await createUser('reactor');
    post = await createPost(author, { heading: 'React to me' });
  });

  // sends a reaction as `user` - most tests below use this
  const sendReaction = (type, asUser = user, postId = post.id) =>
    request(app)
      .post(`/api/posts/${postId}/reactions`)
      .set('Authorization', `Bearer ${tokenFor(asUser)}`)
      .send({ type });

  test('rejects a request with no token (401)', async () => {
    const res = await request(app).post(`/api/posts/${post.id}/reactions`).send({ type: 'like' });

    expect(res.status).toBe(401);
  });

  test('rejects a type that isn\'t like or dislike (400)', async () => {
    const res = await sendReaction('love');

    expect(res.status).toBe(400);
    expect(res.body.error).toEqual(expect.any(String));
  });

  test('returns 404 for a post that doesn\'t exist', async () => {
    const res = await sendReaction('like', user, 999999);

    expect(res.status).toBe(404);
  });

  test('liking a post adds a like', async () => {
    const res = await sendReaction('like');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ likes: 1, dislikes: 0, userReaction: 'like' });
  });

  test('disliking a post adds a dislike', async () => {
    const res = await sendReaction('dislike');

    expect(res.body).toEqual({ likes: 0, dislikes: 1, userReaction: 'dislike' });
  });

  test('liking a second time removes the like', async () => {
    await sendReaction('like');
    const res = await sendReaction('like');

    expect(res.body).toEqual({ likes: 0, dislikes: 0, userReaction: null });
  });

  test('disliking a second time removes the dislike', async () => {
    await sendReaction('dislike');
    const res = await sendReaction('dislike');

    expect(res.body).toEqual({ likes: 0, dislikes: 0, userReaction: null });
  });

  test('disliking after liking switches the like to a dislike', async () => {
    await sendReaction('like');
    const res = await sendReaction('dislike');

    expect(res.body).toEqual({ likes: 0, dislikes: 1, userReaction: 'dislike' });
  });

  test('liking after disliking switches the dislike to a like', async () => {
    await sendReaction('dislike');
    const res = await sendReaction('like');

    expect(res.body).toEqual({ likes: 1, dislikes: 0, userReaction: 'like' });
  });

  // the totals include everyone's reactions, but userReaction is only ever the requesting user's own
  test('counts other users\' reactions too, and only reports your own reaction as yours', async () => {
    const fan = await createUser('fan');
    const critic = await createUser('critic');
    await react(fan, post, 'like');
    await react(critic, post, 'dislike');

    const res = await sendReaction('like');

    expect(res.body).toEqual({ likes: 2, dislikes: 1, userReaction: 'like' });
  });

  // a user can't have two reactions on one post - the UNIQUE(post_id, user_id) rule in schema.sql backs this up
  test('a user never ends up with more than one reaction on a post', async () => {
    await sendReaction('like');
    await sendReaction('dislike');
    await sendReaction('like');

    const rows = await pool.query('SELECT type FROM reactions WHERE post_id = $1 AND user_id = $2', [post.id, user.id]);
    expect(rows.rows).toEqual([{ type: 'like' }]);
  });
});

// GET /api/posts - userReaction ------------------------------------------------------------------------------------------------------
// the feed tells a logged in viewer which button they've already pressed, so the app can show it after a refresh
describe('GET /api/posts userReaction', () => {
  test('is the viewer\'s own reaction when they send a token', async () => {
    const author = await createUser('author');
    const viewer = await createUser('viewer');
    const post = await createPost(author, { heading: 'Liked post' });
    await react(viewer, post, 'like');

    const res = await request(app).get('/api/posts').set('Authorization', `Bearer ${tokenFor(viewer)}`);

    expect(res.body[0].userReaction).toBe('like');
  });

  test('is null when the viewer hasn\'t reacted, even if others have', async () => {
    const author = await createUser('author');
    const viewer = await createUser('viewer');
    const fan = await createUser('fan');
    const post = await createPost(author, { heading: 'Someone else liked this' });
    await react(fan, post, 'like');

    const res = await request(app).get('/api/posts').set('Authorization', `Bearer ${tokenFor(viewer)}`);

    expect(res.body[0]).toMatchObject({ likes: 1, userReaction: null });
  });

  test('is null for logged out viewers, and the feed still loads', async () => {
    const author = await createUser('author');
    const fan = await createUser('fan');
    const post = await createPost(author, { heading: 'Public post' });
    await react(fan, post, 'like');

    const res = await request(app).get('/api/posts'); // no token at all

    expect(res.status).toBe(200);
    expect(res.body[0]).toMatchObject({ likes: 1, userReaction: null });
  });

  test('an invalid token doesn\'t stop the feed loading - it\'s treated as logged out', async () => {
    const author = await createUser('author');
    await createPost(author, { heading: 'Public post' });

    const res = await request(app).get('/api/posts').set('Authorization', 'Bearer not-a-real-token');

    expect(res.status).toBe(200);
    expect(res.body[0].userReaction).toBeNull();
  });
});
