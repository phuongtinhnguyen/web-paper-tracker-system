const express = require("express");
const jwt = require("jsonwebtoken");

const authMiddleware = require("../../middlewares/auth.middleware");
const env = require("../../config/env");
const AppError = require("../../utils/appError");
const validate = require("../../middlewares/validate.middleware");
const notificationController = require("./notification.controller");
const {
  getNotificationsSchema,
  notificationIdSchema,
} = require("./notification.validation");

const router = express.Router();

function sseAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : req.query.token;

  if (!token) {
    return next(new AppError("Unauthorized", 401));
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);

    req.user = {
      userId: payload.userId,
      email: payload.email,
    };

    return next();
  } catch (error) {
    return next(new AppError("Invalid or expired token", 401));
  }
}

router.get(
  "/stream",
  sseAuthMiddleware,
  notificationController.streamNotifications
);

router.use(authMiddleware);

router.get(
  "/",
  validate(getNotificationsSchema),
  notificationController.getNotifications
);

router.patch(
  "/read-all",
  notificationController.markAllNotificationsRead
);

router.patch(
  "/:id/read",
  validate(notificationIdSchema),
  notificationController.markNotificationRead
);

module.exports = router;
