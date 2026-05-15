const asyncHandler = require("../../utils/asyncHandler");
const { success } = require("../../utils/response");
const topicService = require("./topic.service");

const getAllTopics = asyncHandler(async (req, res) => {
  const result = await topicService.getAllTopics();

  return success(res, result);
});

const getMyTopics = asyncHandler(async (req, res) => {
  const result = await topicService.getMyTopics(req.user.userId);

  return success(res, result);
});

const followMyTopic = asyncHandler(async (req, res) => {
  const result = await topicService.followMyTopic(
    req.user.userId,
    req.validated.body
  );

  return success(res, result, "Follow topic successfully", 201);
});

const updateMyTopic = asyncHandler(async (req, res) => {
  const result = await topicService.updateMyTopic(
    req.user.userId,
    req.validated.params.id,
    req.validated.body
  );

  return success(res, result, "Update topic successfully");
});

const deleteMyTopic = asyncHandler(async (req, res) => {
  const result = await topicService.deleteMyTopic(
    req.user.userId,
    req.validated.params.id
  );

  return success(res, result, "Delete topic successfully");
});

module.exports = {
  getAllTopics,
  getMyTopics,
  followMyTopic,
  updateMyTopic,
  deleteMyTopic,
};
