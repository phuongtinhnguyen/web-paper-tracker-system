// 1. Nhận dữ liệu đã được controller đưa xuống
// 2. Xử lý logic nghiệp vụ
// 3. Gọi repository để lấy/lưu dữ liệu
// 4. Kiểm tra điều kiện nghiệp vụ
// 5. Format hoặc chuẩn hóa dữ liệu trước khi trả về controller
// 6. Không trực tiếp xử lý req/res HTTP

const AppError = require("../../utils/appError");
const topicRepository = require("./topic.repository");

async function getAllTopics() {
  const topics = await topicRepository.getAllTopics();

  return { topics };
}

async function getMyTopics(userId) {
  const topics = await topicRepository.getUserTopics(userId);

  return { topics };
}

async function followMyTopic(userId, { topic_id: topicId }) {
  const topic = await topicRepository.findTopicById(topicId);

  if (!topic) {
    throw new AppError("Topic not found", 404);
  }

  const existingFollow = await topicRepository.findUserTopic(userId, topic.id);

  if (existingFollow) {
    throw new AppError("Topic already followed", 409);
  }

  await topicRepository.followTopic(userId, topic.id);

  return { topic };
}

async function updateMyTopic(userId, currentTopicId, { topic_id: newTopicId }) {
  const currentTopic = await topicRepository.findUserTopic(
    userId,
    currentTopicId
  );

  if (!currentTopic) {
    throw new AppError("Topic not found", 404);
  }

  const newTopic = await topicRepository.findTopicById(newTopicId);

  if (!newTopic) {
    throw new AppError("Topic not found", 404);
  }

  if (newTopic.id === currentTopicId) {
    return { topic: newTopic };
  }

  const alreadyFollowed = await topicRepository.findUserTopic(
    userId,
    newTopic.id
  );

  if (alreadyFollowed) {
    throw new AppError("Topic already followed", 409);
  }

  await topicRepository.replaceUserTopic(userId, currentTopicId, newTopic.id);

  return { topic: newTopic };
}

async function deleteMyTopic(userId, topicId) {
  const deleted = await topicRepository.unfollowTopic(userId, topicId);

  if (!deleted) {
    throw new AppError("Topic not found", 404);
  }

  return { topic_id: topicId };
}

module.exports = {
  getAllTopics,
  getMyTopics,
  followMyTopic,
  updateMyTopic,
  deleteMyTopic,
};
