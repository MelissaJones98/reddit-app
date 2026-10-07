const express = require('express');
const cors = require('cors'); // the middleware that controls which websites are allowed to make request to this server from a browser
require('./loadEnv'); // loads .env (or .env.test when running tests)

const authRoutes = require('./routes/auth'); // loads the auth.js file (gives whatever that file exports) and stores it in a variable
const postsRoutes = require('./routes/posts');
const commentsRoutes = require('./routes/comments');

const app = express(); // calling express creates the application object
app.use(cors()); // "app" is what routes and middleware are attached to and is listening for requests - everything builds on top of "app"
app.use(express.json()); // enables JSON body parsing - when the React app sends a post request w/ a JSON body ( { "username": "testuser", "password": "....." }) for a login attempt
// this middleware automatically parses that incoming JSON and makes it available as req.body inside the route handlers

app.use('/api', authRoutes); // connects the routes to the server
app.use('/api/posts', postsRoutes); // every route in posts.js starts with /api/posts - so router.get('/') in that file is GET /api/posts
app.use('/api/posts/:id/comments', commentsRoutes); // comments belong to a post, so they live under its path - :id is read in comments.js thanks to mergeParams

// defined route
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

module.exports = app; // exported WITHOUT calling app.listen - the tests hand app straight to Supertest, which sends requests to it without needing a real port
