const request = require('supertest');
const app = require('../app');
const { pool, resetDatabase, createUser, tokenFor, createPost, createComment } = require('./helpers');

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await pool.end();
});

// GET /api/posts/:id/comments --------------------------------------------------------------------------------------------------------
// public - anyone can read the comments on a post, oldest first so a conversation reads top to bottom
describe('GET /api/posts/:id/comments', () => {
  test('returns an empty array when a post has no comments', async () => {
    const author = await createUser('author');
    const post = await createPost(author, { heading: 'Quiet post' });

    const res = await request(app).get(`/api/posts/${post.id}/comments`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('returns comments with the commenter\'s username, oldest first', async () => {
    const author = await createUser('author');
    const first = await createUser('first_commenter');
    const second = await createUser('second_commenter');
    const post = await createPost(author, { heading: 'Chatty post' });
    await createComment(second, post, 'I replied later', '2026-06-01T12:00:00Z');
    await createComment(first, post, 'I was here first', '2026-06-01T10:00:00Z');

    const res = await request(app).get(`/api/posts/${post.id}/comments`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0]).toMatchObject({ postedBy: 'first_commenter', content: 'I was here first' }); // the same postedBy name the posts use
    expect(res.body[1]).toMatchObject({ postedBy: 'second_commenter', content: 'I replied later' });
    expect(res.body[0].id).toEqual(expect.any(Number));
    expect(res.body[0].createdAt).toEqual(expect.any(String)); // dates travel as text in JSON
  });

  test('only returns comments that belong to the requested post', async () => {
    const author = await createUser('author');
    const commenter = await createUser('commenter');
    const post = await createPost(author, { heading: 'This post' });
    const otherPost = await createPost(author, { heading: 'Another post' });
    await createComment(commenter, post, 'On this post');
    await createComment(commenter, otherPost, 'On the other post');

    const res = await request(app).get(`/api/posts/${post.id}/comments`);

    expect(res.body.map((comment) => comment.content)).toEqual(['On this post']);
  });

  test('returns 404 for a post that doesn\'t exist', async () => {
    const res = await request(app).get('/api/posts/999999/comments');

    expect(res.status).toBe(404);
  });
});

// POST /api/posts/:id/comments -------------------------------------------------------------------------------------------------------
// protected - only logged in users can comment, and the commenter always comes from the token
describe('POST /api/posts/:id/comments', () => {
  let author;
  let commenter;
  let post;
  beforeEach(async () => {
    author = await createUser('author');
    commenter = await createUser('commenter');
    post = await createPost(author, { heading: 'Comment on me' });
  });

  const sendComment = (body, asUser = commenter, postId = post.id) =>
    request(app)
      .post(`/api/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${tokenFor(asUser)}`)
      .send(body);

  test('rejects a request with no token (401)', async () => {
    const res = await request(app).post(`/api/posts/${post.id}/comments`).send({ content: 'Hello' });

    expect(res.status).toBe(401);
  });

  test('creates the comment for the logged in user and returns it (201)', async () => {
    const res = await sendComment({ content: 'Great post!' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ postedBy: 'commenter', content: 'Great post!' });
    expect(res.body.id).toEqual(expect.any(Number));

    // and it's really saved - it shows up when the comments are fetched
    const comments = await request(app).get(`/api/posts/${post.id}/comments`);
    expect(comments.body.map((comment) => comment.content)).toEqual(['Great post!']);
  });

  test('ignores a postedBy in the request body and uses the token\'s user instead', async () => {
    const res = await sendComment({ content: 'Sneaky', postedBy: 'author' });

    expect(res.body.postedBy).toBe('commenter');
  });

  test('trims spaces from the start and end of the comment', async () => {
    const res = await sendComment({ content: '   Nice one   ' });

    expect(res.body.content).toBe('Nice one');
  });

  test('rejects an empty comment (400)', async () => {
    const res = await sendComment({ content: '' });

    expect(res.status).toBe(400);
    expect(res.body.error).toEqual(expect.any(String));
  });

  test('rejects a comment that is only spaces (400)', async () => {
    const res = await sendComment({ content: '     ' });

    expect(res.status).toBe(400);
  });

  test('rejects a missing content field (400)', async () => {
    const res = await sendComment({});

    expect(res.status).toBe(400);
  });

  test('returns 404 for a post that doesn\'t exist', async () => {
    const res = await sendComment({ content: 'Hello?' }, commenter, 999999);

    expect(res.status).toBe(404);
  });
});
