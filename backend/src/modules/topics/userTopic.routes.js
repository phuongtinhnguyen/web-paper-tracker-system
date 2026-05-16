const express = require("express");

const authMiddleware = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate.middleware");
const topicController = require("./topic.controller");
const {
  followTopicBodySchema,
  topicParamsSchema,
  updateUserTopicSchema,
} = require("./topic.validation");

const router = express.Router();

router.use(authMiddleware);

router.get("/", topicController.getMyTopics);
router.post("/", validate(followTopicBodySchema), topicController.followMyTopic);
router.put(
  "/:id",
  validate(updateUserTopicSchema),
  topicController.updateMyTopic
);
router.delete("/:id", validate(topicParamsSchema), topicController.deleteMyTopic);

module.exports = router;
