const express = require('express');
const cors = require('cors'); // the middleware that controls which websites are allowed to make request to this server from a browser
require('dotenv').config(); // loads .env file 

const authRoutes = require('./routes/auth'); // loads the auth.js file (gives whatever that file exports) and stores it in a variable

const app = express(); // calling express creates the application object 
app.use(cors()); // "app" is what routes and middleware are attached to and is listening for requests - everything builds on top of "app"
app.use(express.json()); // enables JSON body parsing - when the React app sends a post request w/ a JSON body ( { "username": "testuser", "password": "....." }) for a login attempt
// this middleware automatically parses that incoming JSON and makes it available as req.body inside the route handlers

app.use('/api', authRoutes); // connects the routes to the server

// defined route
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// determined which port to listen on
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});