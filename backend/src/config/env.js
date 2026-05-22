const path = require("path");
const dotenv = require("dotenv");

dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

function getRequiredEnv(key) {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 8000),

  databaseUrl: getRequiredEnv("DATABASE_URL"),

  jwtSecret: getRequiredEnv("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",

  aiServiceUrl: process.env.AI_SERVICE_URL || "http://localhost:8001",
  internalApiSecret: process.env.INTERNAL_API_SECRET || "",
};

module.exports = env;
