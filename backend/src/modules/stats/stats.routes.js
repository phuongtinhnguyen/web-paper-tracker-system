const express = require("express");

const validate = require("../../middlewares/validate.middleware");
const statsController = require("./stats.controller");
const { getTopicTrendsSchema } = require("./stats.validation");

const router = express.Router();

router.get(
  "/topics/trends",
  validate(getTopicTrendsSchema),
  statsController.getTopicTrends
);

module.exports = router;
