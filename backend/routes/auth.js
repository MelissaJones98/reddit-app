const express = require('express');
const bcrypt = require('bcrypt'); // handles password hashing and comparing
const jwt = require('jsonwebtoken'); // creates login tokens
const pool = require('../db/pool'); // the shared database connection from pool.js

const router = express.Router(); // creates a mini-map that holds just the auth routes

function createToken(user) { // token helper - sign up and login both require tokens using this function avoids duplicate code
  return jwt.sign(
    { id: user.id, username: user.username }, // the payload - encoded not encrypted so anyone holding the token can read it, that's why it DOESN'T contain the password or anything sensitive
    process.env.JWT_SECRET, // the secret - used to create a signature
    { expiresIn: '7d' } // expires in 7 days - makes the token trustworthy because if anyone tampers with the payload the signature no longer matches and the server rejects it
  );
}

// sign up route
router.post('/signup', async (req, res) => {
  const { username, email, password } = req.body; // pulls the listed fields from the JSON sent by the front end

  // basic validation - any missing/empty fields responds with a 400 status and error message
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email and password are required' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10); // turns the plain passowrd into a long scrambled string that can't be reversed - 10 is the cost factor (how many rounds of hashing to perforn) 

    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)  
       RETURNING id, username, email`,
      [username, email, passwordHash]
    );
    // $1, $2, $3 are placeholder filled in from the array in order so the values travel separately from the SQL text - safest way 

    // resonse
    const user = result.rows[0]; // an array of returned rows and since one row was inserted rows[0] is the new user
    res.status(201).json({ token: createToken(user), user }); // 201 means created
    // the response includes a fresh token that logs the user in automatically after signing up, plus the user object
  } catch (err) { // error handling 
    // 23505 = Postgres unique constraint violation (duplicate username or email)
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Username or email already in use' }); // triggered when an existing email or username is used because of the UNIQUE columns in the schema
    }
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' }); // any other errors are logged to the terminal for debugging
  }
}); 

// login route
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  // look up the user
  try {
    const result = await pool.query(
      'SELECT id, username, email, password_hash FROM users WHERE username = $1',
      [username] // SELECT by username - password_hash is included this time as it is needed for comparison
    ); // if no user has that username - rows is an empty array and user is undefined

    const user = result.rows[0];
    const passwordMatches = user && (await bcrypt.compare(password, user.password_hash)); 
    // bcrypt.compare hashes the submitted password using the salt stored inside the saved hash and checks whether the results match 

    if (!passwordMatches) {
      return res.status(401).json({ error: 'Incorrect username or password' });
    } // rejects bad logins - both failure cases (unknown username and wrong password) produce the smae message with status 401(Unauthorised) 
    // keeping the message the same means an attacker cant identify which usernames exist

    res.json({
      token: createToken(user),
      user: { id: user.id, username: user.username, email: user.email },
    }); // a correct login returns a new token plus the user's details explicitly (so password_hash is never sent back)
  } catch (err) { // error handling
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router; // makes the router accessible to server.js