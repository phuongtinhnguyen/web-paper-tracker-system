const { query, transaction } = require("../../config/db");

async function getAllTopics() {
  const result = await query(
    `SELECT id, name
     FROM topics
     ORDER BY id ASC`
  );

  return result.rows;
}

async function findTopicById(topicId) {
  const result = await query(
    `SELECT id, name
     FROM topics
     WHERE id = $1
     LIMIT 1`,
    [topicId]
  );

  return result.rows[0] || null;
}

async function findUserTopic(userId, topicId) {
  const result = await query(
    `SELECT t.id, t.name
     FROM user_topics ut
     JOIN topics t ON t.id = ut.topic_id
     WHERE ut.user_id = $1 AND ut.topic_id = $2
     LIMIT 1`,
    [userId, topicId]
  );

  return result.rows[0] || null;
}

async function getUserTopics(userId) {
  const result = await query(
    `SELECT t.id, t.name
     FROM user_topics ut
     JOIN topics t ON t.id = ut.topic_id
     WHERE ut.user_id = $1
     ORDER BY t.id ASC`,
    [userId]
  );

  return result.rows;
}

async function followTopic(userId, topicId) {
  const result = await query(
    `INSERT INTO user_topics (user_id, topic_id)
     VALUES ($1, $2)
     RETURNING user_id, topic_id`,
    [userId, topicId]
  );

  return result.rows[0];
}

async function unfollowTopic(userId, topicId) {
  const result = await query(
    `DELETE FROM user_topics
     WHERE user_id = $1 AND topic_id = $2
     RETURNING user_id, topic_id`,
    [userId, topicId]
  );

  return result.rows[0] || null;
}

async function replaceUserTopic(userId, oldTopicId, newTopicId) {
  return transaction(async (client) => {
    await client.query(
      `DELETE FROM user_topics
       WHERE user_id = $1 AND topic_id = $2`,
      [userId, oldTopicId]
    );

    const result = await client.query(
      `INSERT INTO user_topics (user_id, topic_id)
       VALUES ($1, $2)
       RETURNING user_id, topic_id`,
      [userId, newTopicId]
    );

    return result.rows[0];
  });
}

module.exports = {
  getAllTopics,
  findTopicById,
  findUserTopic,
  getUserTopics,
  followTopic,
  unfollowTopic,
  replaceUserTopic,
};
