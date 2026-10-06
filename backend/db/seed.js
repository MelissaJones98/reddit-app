// fills the real reddit_app database with sample users, posts and reactions so the feed has something to show
// run it from the backend folder with:  npm run seed
// safe to run more than once - it removes the previous sample data first, so posts are never duplicated
const bcrypt = require('bcrypt');
const pool = require('./pool'); // loadEnv (via pool.js) reads backend/.env, so this seeds the real reddit_app database
const CATEGORIES = require('../constants/categories');

// sample accounts - all share one DEMO password so you can log in as any of them to try things out (never do this with real accounts)
const DEMO_PASSWORD = 'password123';
const SEED_USERS = ['gamer_gemma', 'tech_tom', 'foodie_fran'];

// each post: who wrote it, its text, its category, and how many days ago it was posted (so the feed has a believable order)
const SEED_POSTS = [
  { author: 'gamer_gemma', heading: 'What game are you playing this weekend?', content: 'I finally started the remaster everyone keeps talking about. No spoilers please!', category: 'Games', daysAgo: 0 },
  { author: 'tech_tom', heading: 'Is it worth learning TypeScript before React?', content: 'I know plain JavaScript fairly well. Should I learn TypeScript first or pick it up as I go?', category: 'Technology', daysAgo: 1 },
  { author: 'foodie_fran', heading: 'The best homemade pizza dough recipe', content: 'Flour, water, salt, yeast and 48 hours in the fridge. The long rest makes all the difference.', category: 'Food & Drink', daysAgo: 1 },
  { author: 'tech_tom', heading: 'Raspberry Pi weather station build', content: 'Wired up a temperature and humidity sensor and it posts readings every 10 minutes. Parts list in the comments.', category: 'Science', daysAgo: 2 },
  { author: 'gamer_gemma', heading: 'Underrated anime from the last decade?', content: 'Looking for something with a great soundtrack. What would you recommend?', category: 'Anime & Cosplay', daysAgo: 3 },
  { author: 'foodie_fran', heading: 'Weekend trip to the Lake District', content: 'Three days, two hikes and far too many scones. Any walks we should not miss next time?', category: 'Places & Travel', daysAgo: 4 },
  { author: 'tech_tom', heading: 'Interest rates explained simply', content: 'A beginner friendly breakdown of why rates go up and down and what it means for savings.', category: 'Business & Finance', daysAgo: 5 },
  { author: 'gamer_gemma', heading: 'Starting a vinyl collection on a budget', content: 'Charity shops have been a goldmine. What was the best record you found secondhand?', category: 'Music', daysAgo: 6 },
  { author: 'foodie_fran', heading: 'Easy houseplants that are hard to kill', content: 'Snake plants and pothos have survived my forgetfulness for two years now.', category: 'Home & Garden', daysAgo: 7 },
  { author: 'tech_tom', heading: 'First marathon training plan', content: 'Sixteen weeks to go. Building up slowly and trying not to get injured.', category: 'Sports', daysAgo: 8 },
  { author: 'gamer_gemma', heading: 'Books that changed how you think', content: 'Mine was a short book on habits. Small changes really do add up.', category: 'Reading & Writing', daysAgo: 9 },
  { author: 'foodie_fran', heading: 'Spotted a kingfisher on my morning walk', content: 'First time I have ever seen one. That flash of blue was unreal.', category: 'Nature & Outdoors', daysAgo: 10 },
];

// reactions to add: which user reacted to which post (by heading) and how - users never react to their own posts, and only once per post (the UNIQUE rule in schema.sql)
const SEED_REACTIONS = [
  { user: 'tech_tom', heading: 'What game are you playing this weekend?', type: 'like' },
  { user: 'foodie_fran', heading: 'What game are you playing this weekend?', type: 'like' },
  { user: 'gamer_gemma', heading: 'Is it worth learning TypeScript before React?', type: 'like' },
  { user: 'foodie_fran', heading: 'Is it worth learning TypeScript before React?', type: 'dislike' },
  { user: 'gamer_gemma', heading: 'The best homemade pizza dough recipe', type: 'like' },
  { user: 'tech_tom', heading: 'The best homemade pizza dough recipe', type: 'like' },
  { user: 'foodie_fran', heading: 'Raspberry Pi weather station build', type: 'like' },
  { user: 'tech_tom', heading: 'Underrated anime from the last decade?', type: 'dislike' },
  { user: 'gamer_gemma', heading: 'Spotted a kingfisher on my morning walk', type: 'like' },
];

async function seed() {
  // catch typos before touching the database - a post with a category no button matches could never be filtered to
  const badPost = SEED_POSTS.find((post) => !CATEGORIES.includes(post.category));
  if (badPost) {
    throw new Error(`"${badPost.heading}" has category "${badPost.category}", which isn't in constants/categories.js`);
  }

  // a transaction needs every query on the SAME connection, so take one client from the pool rather than using pool.query
  const client = await pool.connect();

  try {
    await client.query('BEGIN'); // from here on nothing is saved until COMMIT - if anything fails, ROLLBACK undoes the lot

    // remove the previous sample data - ON DELETE CASCADE in schema.sql also removes their posts, and every reaction and comment on those posts
    await client.query('DELETE FROM users WHERE username = ANY($1)', [SEED_USERS]);

    // users - hash the demo password once and reuse it, bcrypt is deliberately slow
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
    const userIds = {}; // username -> id, so posts and reactions can look up who's who
    for (const username of SEED_USERS) {
      const result = await client.query(
        'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
        [username, `${username}@example.com`, passwordHash]
      );
      userIds[username] = result.rows[0].id;
    }

    // posts - created_at is set in the past using Postgres interval maths, e.g. NOW() - 3 days
    const postIds = {}; // heading -> id, for the reactions
    for (const post of SEED_POSTS) {
      const result = await client.query(
        `INSERT INTO posts (user_id, heading, content, category, created_at)
         VALUES ($1, $2, $3, $4, NOW() - make_interval(days => $5))
         RETURNING id`,
        [userIds[post.author], post.heading, post.content, post.category, post.daysAgo]
      );
      postIds[post.heading] = result.rows[0].id;
    }

    // reactions
    for (const reaction of SEED_REACTIONS) {
      await client.query(
        'INSERT INTO reactions (post_id, user_id, type) VALUES ($1, $2, $3)',
        [postIds[reaction.heading], userIds[reaction.user], reaction.type]
      );
    }

    await client.query('COMMIT'); // everything succeeded - save it all at once
    console.log(`Seeded ${SEED_USERS.length} users, ${SEED_POSTS.length} posts and ${SEED_REACTIONS.length} reactions.`);
    console.log(`Log in as any of ${SEED_USERS.join(', ')} with the password "${DEMO_PASSWORD}".`);
  } catch (err) {
    await client.query('ROLLBACK'); // something failed part way - undo everything so the database isn't left half seeded
    throw err;
  } finally {
    client.release(); // give the connection back to the pool whether it worked or not
  }
}

seed()
  .catch((err) => {
    console.error('Seeding failed:', err.message);
    process.exitCode = 1; // tells PowerShell the script failed
  })
  .finally(() => pool.end()); // close the pool so the script exits instead of waiting on open connections
