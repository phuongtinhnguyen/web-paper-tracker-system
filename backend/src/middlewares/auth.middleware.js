const jwt = require("jsonwebtoken");

const env = require("../config/env");
const AppError = require("../utils/appError");

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError("Unauthorized", 401));
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, env.jwtSecret);

    req.user = {
      userId: payload.userId,
      email: payload.email,
    };

    return next();
  } catch (error) {
    return next(new AppError("Invalid or expired token", 401));
  }
}

module.exports = authMiddleware;
