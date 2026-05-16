const env = require("../config/env");

function errorMiddleware(error, req, res, next) {
  const statusCode = error.statusCode || 500;

  if (env.nodeEnv === "development") {
    console.error(error);
  }

  return res.status(statusCode).json({
    success: false,
    message: error.message || "Internal Server Error",
    statusCode,
  });
}

module.exports = errorMiddleware;
