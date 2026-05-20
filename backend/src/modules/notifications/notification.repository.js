const { query } = require("../../config/db");

function buildNotificationFilters({ userId, unreadOnly }) {
  const params = [userId];
  const whereClauses = ["un.user_id = $1"];

  if (unreadOnly) {
    whereClauses.push("un.is_read = false");
  }

  return {
    params,
    whereSql: `WHERE ${whereClauses.join(" AND ")}`,
  };
}

async function getNotifications({ userId, page, limit, unreadOnly }) {
  const offset = (page - 1) * limit;
  const { params, whereSql } = buildNotificationFilters({ userId, unreadOnly });
  const listParams = [...params, limit, offset];
  const limitParamIndex = params.length + 1;
  const offsetParamIndex = params.length + 2;

  const result = await query(
    `SELECT
       n.notification_id,
       n.type,
       n.title,
       n.message,
       n.paper_id,
       n.created_at,
       un.is_read,
       un.read_at,
       p.title AS paper_title,
       p.pdf_url AS paper_pdf_url,
       p.topic_id AS topic_id,
       t.name AS topic_name
     FROM user_notifications un
     JOIN notifications n ON n.notification_id = un.notification_id
     LEFT JOIN papers p ON p.id = n.paper_id
     LEFT JOIN topics t ON t.id = p.topic_id
     ${whereSql}
     ORDER BY n.created_at DESC, n.notification_id DESC
     LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}`,
    listParams
  );

  const countResult = await query(
    `SELECT COUNT(*)::int AS total
     FROM user_notifications un
     JOIN notifications n ON n.notification_id = un.notification_id
     ${whereSql}`,
    params
  );

  return {
    notifications: result.rows,
    total: countResult.rows[0]?.total || 0,
  };
}

async function getUserNotificationsByIds(notificationIds) {
  if (!notificationIds.length) {
    return [];
  }

  const result = await query(
    `SELECT
       n.notification_id,
       n.type,
       n.title,
       n.message,
       n.paper_id,
       n.created_at,
       un.user_id,
       un.is_read,
       un.read_at,
       p.title AS paper_title,
       p.pdf_url AS paper_pdf_url,
       p.topic_id AS topic_id,
       t.name AS topic_name
     FROM user_notifications un
     JOIN notifications n ON n.notification_id = un.notification_id
     LEFT JOIN papers p ON p.id = n.paper_id
     LEFT JOIN topics t ON t.id = p.topic_id
     WHERE n.notification_id = ANY($1::int[])
     ORDER BY n.created_at DESC, n.notification_id DESC`,
    [notificationIds]
  );

  return result.rows;
}

async function markNotificationRead(userId, notificationId) {
  const result = await query(
    `UPDATE user_notifications
     SET is_read = true,
         read_at = COALESCE(read_at, NOW())
     WHERE user_id = $1 AND notification_id = $2
     RETURNING notification_id, is_read, read_at`,
    [userId, notificationId]
  );

  return result.rows[0] || null;
}

async function markAllNotificationsRead(userId) {
  const result = await query(
    `UPDATE user_notifications
     SET is_read = true,
         read_at = COALESCE(read_at, NOW())
     WHERE user_id = $1 AND is_read = false`,
    [userId]
  );

  return result.rowCount;
}

module.exports = {
  getNotifications,
  getUserNotificationsByIds,
  markNotificationRead,
  markAllNotificationsRead,
};
