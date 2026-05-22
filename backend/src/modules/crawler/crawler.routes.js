const express = require("express");

const authMiddleware = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate.middleware");
const crawlerController = require("./crawler.controller");
const { runCrawlerSchema } = require("./crawler.validation");

const router = express.Router();

router.get(
  "/status",
  authMiddleware,
  crawlerController.getCrawlerStatus
);

router.post(
  "/run",
  authMiddleware,
  validate(runCrawlerSchema),
  crawlerController.runCrawler
);

module.exports = router;
