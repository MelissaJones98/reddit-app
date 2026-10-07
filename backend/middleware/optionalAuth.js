const jwt = require('jsonwebtoken');

// like requireAuth, but it NEVER blocks the request:
//   - a valid token  -> req.user is set, so the route can personalise the response (e.g. which posts you've liked)
//   - no token, or an invalid/expired one -> the request carries on as a logged out visitor (req.user stays undefined)
// used on routes anyone can see, where being logged in only adds extra detail
function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme === 'Bearer' && token) {
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      // a bad token isn't an error here - just treat them as logged out
    }
  }

  next(); // always carry on - this is the difference from requireAuth
}

module.exports = optionalAuth;
