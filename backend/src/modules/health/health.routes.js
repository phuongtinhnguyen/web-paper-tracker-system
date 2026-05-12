const express = require("express");
const asyncHandler = require("../../utils/asyncHandler");
const {
  healthCheck,
  dbHealthCheck,
} = require("./health.controller");

const router = express.Router();

router.get("/", asyncHandler(healthCheck));
router.get("/db", asyncHandler(dbHealthCheck));

module.exports = router;
