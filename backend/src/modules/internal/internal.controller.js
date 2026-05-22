const asyncHandler = require("../../utils/asyncHandler");
const { success } = require("../../utils/response");
const notificationService = require("../notifications/notification.service");

const pushNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.pushNotificationsToOnlineUsers(
    req.validated.body.notification_ids
  );

  return success(res, result, "Push notifications successfully");
});

module.exports = {
  pushNotifications,
};
