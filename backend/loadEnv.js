const path = require('path');

// loads environment variables from the right file:
// - Jest automatically sets NODE_ENV to 'test', so tests read .env.test (the reddit_app_test database)
// - everything else (node server.js, the seed script) reads .env (the real reddit_app database)
// every file that needs process.env requires this one instead of calling dotenv directly - Node only runs a file once however many times it's required,
// so the variables are loaded once, from one place (dotenv never overwrites a variable that's already set, so two separate .config() calls could mix the two files up)
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';

require('dotenv').config({ path: path.join(__dirname, envFile), quiet: true }); // __dirname = this file's folder, so it works whichever folder the command is run from
