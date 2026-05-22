const jwt = require("jsonwebtoken");

const env = require("../config/env");

function optionalAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, env.jwtSecret);

    req.user = {
      userId: payload.userId,
      email: payload.email,
    };
  } catch {
    // Public routes should still work when an optional token is missing/invalid.
  }

  return next();
}

module.exports = optionalAuthMiddleware;
