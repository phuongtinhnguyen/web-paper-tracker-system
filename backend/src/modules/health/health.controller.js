const { query } = require("../../config/db");
const { success } = require("../../utils/response");

async function healthCheck(req, res) {
  return success(res, {
    service: "backend",
    status: "OK",
  });
}

async function dbHealthCheck(req, res) {
  await query("SELECT 1 AS ok");

  return success(res, {
    database: "OK",
  });
}

module.exports = {
  healthCheck,
  dbHealthCheck,
};
