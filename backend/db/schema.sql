CREATE TABLE users ( -- one row per registered account
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL, -- UNIQUE on username and email stops duplicate accounts
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL, -- password_hash stores the output of bcrypt, never the plain password itself!
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE posts ( -- one row per post, linked to to whoever created it via user_id
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, -- ON DELETE CASCADE means if a user is ever deleted, their posts get deleted automatically rather than being left orphaned w/ a broken ref
  heading VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE reactions ( -- one row per like/dislike, linking a specific user to a specific post
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(10) NOT NULL CHECK (type IN ('like', 'dislike')),
  UNIQUE (post_id, user_id) -- constraint that makes the rule of "one reaction per user per post" an actual database rule, not just something the React code enforces
);

CREATE TABLE comments ( -- one row per comment, linked to both the post it's on and the user who wrote it
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);