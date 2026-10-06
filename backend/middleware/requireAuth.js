const jwt = require('jsonwebtoken');

// middleware = a function Express runs BEFORE the route handler. It either:
//   - stops the request by sending a response (e.g. 401), or
//   - calls next() to let the request carry on to the route handler
// putting requireAuth in front of a route makes that route "protected": only requests with a valid token get through
function requireAuth(req, res, next) {
  // the frontend sends the token in a header that looks like:  Authorization: Bearer eyJhbGciOi...
  const header = req.headers.authorization || ''; // '' if the header is missing, so .split below doesn't crash
  const [scheme, token] = header.split(' '); // 'Bearer eyJ...' -> ['Bearer', 'eyJ...']

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'You must be logged in to do that' }); 
  }

  try {
    const isReal = jwt.verify(token, process.env.JWT_SECRET); // verify, and keep the payload
    req.user = isReal;                                        // store it where posts.js can read it
    next();                                                   // carry on to the route handler
  } catch (error) {
    return res.status(401).json({ error: 'Your session has expired, please log in again' });
  };
}

module.exports = requireAuth;
