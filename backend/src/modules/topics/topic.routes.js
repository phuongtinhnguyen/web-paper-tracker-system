const express = require("express");

const authMiddleware = require("../../middlewares/auth.middleware");
const topicController = require("./topic.controller");

const router = express.Router();

router.use(authMiddleware);

router.get("/", topicController.getAllTopics);

module.exports = router;
