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
    // Nếu token sai, hết hạn hoặc không verify được thì không báo lỗi. Vì đây là optional auth nên API vẫn tiếp tục chạy như user chưa đăng nhập.
  }

  return next();
}

module.exports = optionalAuthMiddleware;
