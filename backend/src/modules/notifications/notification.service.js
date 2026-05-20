const AppError = require("../../utils/appError");
const notificationRepository = require("./notification.repository");
const notificationSse = require("./notification.sse");

function mapNotification(notification) {
  return {
    id: notification.notification_id,
    notification_id: notification.notification_id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    paper_id: notification.paper_id,
    topic_id: notification.topic_id,
    is_read: notification.is_read,
    read_at: notification.read_at,
    created_at: notification.created_at,
    paper: notification.paper_id
      ? {
          id: notification.paper_id,
          title: notification.paper_title,
          pdf_url: notification.paper_pdf_url,
          topic_id: notification.topic_id,
        }
      : null,
    topic: notification.topic_id
      ? {
          id: notification.topic_id,
          name: notification.topic_name,
        }
      : null,
  };
}

async function getNotifications(userId, query) {
  const { page, limit, unread_only: unreadOnly } = query;
  const { notifications, total } =
    await notificationRepository.getNotifications({
      userId,
      page,
      limit,
      unreadOnly,
    });

  return {
    notifications: notifications.map(mapNotification),
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  };
}

async function markNotificationRead(userId, notificationId) {
  const notification = await notificationRepository.markNotificationRead(
    userId,
    notificationId
  );

  if (!notification) {
    throw new AppError("Notification not found", 404);
  }

  return {
    notification_id: notification.notification_id,
    is_read: notification.is_read,
    read_at: notification.read_at,
  };
}

async function markAllNotificationsRead(userId) {
  const updated_count =
    await notificationRepository.markAllNotificationsRead(userId);

  return {
    updated_count,
  };
}

function streamNotifications(userId, req, res) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();

  notificationSse.addClient(userId, req, res);
}

async function pushNotificationsToOnlineUsers(notificationIds) {
  const uniqueIds = [...new Set(notificationIds)];
  const rows = await notificationRepository.getUserNotificationsByIds(uniqueIds);
  let sent_count = 0;

  for (const row of rows) {
    sent_count += notificationSse.sendToUser(row.user_id, "notification", {
      type: "NEW_NOTIFICATION",
      notification: mapNotification(row),
    });
  }

  return {
    notification_count: uniqueIds.length,
    delivery_count: rows.length,
    online_user_count: notificationSse.getOnlineUserIds().length,
    sent_count,
  };
}

module.exports = {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  streamNotifications,
  pushNotificationsToOnlineUsers,
};
