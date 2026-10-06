const request = require('supertest'); // sends real HTTP requests to the Express app without starting a server on a port
const app = require('../app');
const { pool, resetDatabase, createUser, tokenFor, createPost, react } = require('./helpers');

beforeEach(async () => {
  await resetDatabase(); // every test starts with empty tables so tests can't affect each other
});

afterAll(async () => {
  await pool.end(); // closes the database connections - without this Jest waits forever for them to close
});

// GET /api/posts ---------------------------------------------------------------------------------------------------------------------
describe('GET /api/posts', () => {
  test('returns an empty array when there are no posts', async () => {
    const res = await request(app).get('/api/posts');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  // the response uses the same field names as the frontend Post component, so PostFeed can use it without converting anything
  test('returns posts in the shape the frontend expects, with the author\'s username', async () => {
    const author = await createUser('author');
    await createPost(author, { heading: 'Hello world', content: 'First post!', category: 'Games' });

    const res = await request(app).get('/api/posts');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({
      postedBy: 'author', // the username, not the user_id number
      postHeading: 'Hello world', // the column is called heading - the API renames it
      content: 'First post!',
      category: 'Games',
      likes: 0,
      dislikes: 0,
    });
    expect(res.body[0].id).toEqual(expect.any(Number));
  });

  // likes and dislikes aren't stored on the post - they're counted from the reactions table
  test('counts each post\'s likes and dislikes from the reactions table', async () => {
    const author = await createUser('author');
    const fan1 = await createUser('fan1');
    const fan2 = await createUser('fan2');
    const critic = await createUser('critic');
    const post = await createPost(author, { heading: 'Popular post' });
    await react(fan1, post, 'like');
    await react(fan2, post, 'like');
    await react(critic, post, 'dislike');

    const res = await request(app).get('/api/posts');

    expect(res.body[0]).toMatchObject({ likes: 2, dislikes: 1 }); // numbers, not strings like '2' (Postgres COUNT returns a bigint, which pg hands back as a string unless converted)
  });

  test('returns the newest posts first', async () => {
    const author = await createUser('author');
    await createPost(author, { heading: 'Older post', createdAt: '2026-01-01T10:00:00Z' });
    await createPost(author, { heading: 'Newer post', createdAt: '2026-06-01T10:00:00Z' });

    const res = await request(app).get('/api/posts');

    expect(res.body.map((post) => post.postHeading)).toEqual(['Newer post', 'Older post']);
  });
});

// POST /api/posts --------------------------------------------------------------------------------------------------------------------
describe('POST /api/posts', () => {
  const validPost = { postHeading: 'My new post', content: 'Some interesting content', category: 'Technology' };

  // protected route - only logged in users can post, and the token is how the server knows who they are
  test('rejects a request with no token (401)', async () => {
    const res = await request(app).post('/api/posts').send(validPost);

    expect(res.status).toBe(401);
    expect(res.body.error).toEqual(expect.any(String));
  });

  test('rejects a token that wasn\'t signed with the server\'s secret (401)', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', 'Bearer not-a-real-token')
      .send(validPost);

    expect(res.status).toBe(401);
  });

  test('creates the post for the logged in user and returns it (201)', async () => {
    const user = await createUser('poster');

    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${tokenFor(user)}`) // the standard way to send a JWT: an Authorization header starting "Bearer "
      .send(validPost);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      postedBy: 'poster', // taken from the token, NOT from the request body - users can't post as someone else
      postHeading: 'My new post',
      content: 'Some interesting content',
      category: 'Technology',
      likes: 0,
      dislikes: 0,
    });

    // and it's really in the database - it shows up in the feed
    const feed = await request(app).get('/api/posts');
    expect(feed.body.map((post) => post.postHeading)).toEqual(['My new post']);
  });

  test('ignores a postedBy in the request body and uses the token\'s user instead', async () => {
    const user = await createUser('realuser');
    await createUser('someoneelse');

    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${tokenFor(user)}`)
      .send({ ...validPost, postedBy: 'someoneelse' });

    expect(res.status).toBe(201);
    expect(res.body.postedBy).toBe('realuser');
  });

  test('rejects a post with missing fields (400)', async () => {
    const user = await createUser('poster');

    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${tokenFor(user)}`)
      .send({ postHeading: 'No content or category' });

    expect(res.status).toBe(400);
    expect(res.body.error).toEqual(expect.any(String));
  });

  // a post's category has to exactly match one of the frontend's category buttons, otherwise it could never be filtered to
  test('rejects a category that isn\'t in the list (400)', async () => {
    const user = await createUser('poster');

    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${tokenFor(user)}`)
      .send({ ...validPost, category: 'Cooking' }); // close to "Food & Drink" but not an exact match

    expect(res.status).toBe(400);
  });
});
