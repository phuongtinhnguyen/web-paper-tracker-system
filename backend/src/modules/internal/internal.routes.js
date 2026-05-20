const express = require("express");

const validate = require("../../middlewares/validate.middleware");
const internalAuthMiddleware = require("./internal.middleware");
const internalController = require("./internal.controller");
const { pushNotificationsSchema } = require("./internal.validation");

const router = express.Router();

router.post(
  "/notifications/push",
  internalAuthMiddleware,
  validate(pushNotificationsSchema),
  internalController.pushNotifications
);

module.exports = router;
