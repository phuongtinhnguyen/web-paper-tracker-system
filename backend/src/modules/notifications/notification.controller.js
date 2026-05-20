const asyncHandler = require("../../utils/asyncHandler");
const { paginated, success } = require("../../utils/response");
const notificationService = require("./notification.service");

const getNotifications = asyncHandler(async (req, res) => {
  const { notifications, pagination } =
    await notificationService.getNotifications(
      req.user.userId,
      req.validated.query
    );

  return paginated(
    res,
    notifications,
    pagination,
    "Get notifications successfully"
  );
});

const markNotificationRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markNotificationRead(
    req.user.userId,
    req.validated.params.id
  );

  return success(res, result, "Mark notification read successfully");
});

const markAllNotificationsRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllNotificationsRead(
    req.user.userId
  );

  return success(res, result, "Mark all notifications read successfully");
});

const streamNotifications = (req, res) => {
  notificationService.streamNotifications(req.user.userId, req, res);
};

module.exports = {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  streamNotifications,
};
