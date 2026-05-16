const app = require("./app");
const env = require("./config/env");

const server = app.listen(env.port, () => {
  console.log(`Backend server is running on port ${env.port}`);
  console.log(`Health check: http://localhost:${env.port}/api/v1/health`);
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled Rejection:", error);
  server.close(() => {
    process.exit(1);
  });
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});
