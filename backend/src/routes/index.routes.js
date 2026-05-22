const express = require("express");
const healthRoutes = require("../modules/health/health.routes");
const authRoutes = require("../modules/auth/auth.routes");
const topicRoutes = require("../modules/topics/topic.routes");
const userTopicRoutes = require("../modules/topics/userTopic.routes");
const paperRoutes = require("../modules/papers/paper.routes");
const favoriteRoutes = require("../modules/favorites/favorite.routes");
const historyRoutes = require("../modules/history/history.routes");
const notificationRoutes = require("../modules/notifications/notification.routes");
const internalRoutes = require("../modules/internal/internal.routes");
const statsRoutes = require("../modules/stats/stats.routes");
const crawlerRoutes = require("../modules/crawler/crawler.routes");

const router = express.Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/topics", topicRoutes);
router.use("/user-topics", userTopicRoutes);
router.use("/papers", paperRoutes);
router.use("/favorites", favoriteRoutes);
router.use("/history", historyRoutes);
router.use("/notifications", notificationRoutes);
router.use("/internal", internalRoutes);
router.use("/stats", statsRoutes);
router.use("/crawler", crawlerRoutes);

module.exports = router;


