const { Pool } = require('pg'); // loads the pg package - { pool } pulls out the Pool class which manages database connections 
require('dotenv').config(); // loads the dotenv package and immediately calls its .config() method which reads the backend/.env file and makes its contents available through process.env

const pool = new Pool({ // creates a new instance of the Pool class 
  connectionString: process.env.DATABASE_URL, // <- configured with this - pulling the full database URL inside .env
});

module.exports = pool; // makes pool accessible to other files

// NOTE TO SELF: what a pool actually is. 
// Instead of opening and closing a brand new connection for every query the app runs, a pool keeps a small set of connections open and ready,
// handing oen out whenever the code needs to run a query, then returning it to the pool when it is done rather than closing it. 
// It's much more efficient for a server that might need to handle multiple queries at once