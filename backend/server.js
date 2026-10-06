const app = require('./app'); // the Express app with all its routes and middleware - built in app.js

// this file's only job is to start listening on a port - kept separate from app.js so the tests can use the app without starting a real server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
