const express = require("express");
const healthRoutes = require("../modules/health/health.routes");
const authRoutes = require("../modules/auth/auth.routes");
const topicRoutes = require("../modules/topics/topic.routes");
const userTopicRoutes = require("../modules/topics/userTopic.routes");

const router = express.Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/topics", topicRoutes);
router.use("/user-topics", userTopicRoutes);

module.exports = router;
