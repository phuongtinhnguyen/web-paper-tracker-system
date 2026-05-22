const env = require("../../config/env");
const AppError = require("../../utils/appError");

function internalAuthMiddleware(req, res, next) {
  if (!env.internalApiSecret) {
    return next(new AppError("Internal API secret is not configured", 503));
  }

  const secret = req.headers["x-internal-api-secret"];

  if (secret !== env.internalApiSecret) {
    return next(new AppError("Forbidden internal request", 403));
  }

  return next();
}

module.exports = internalAuthMiddleware;
