const asyncHandler = require("../../utils/asyncHandler");
const { success } = require("../../utils/response");
const topicService = require("./topic.service");

const getMyTopics = asyncHandler(async (req, res) => {
  const result = await topicService.getMyTopics(req.user.userId);

  return success(res, result);
});

const createMyTopic = asyncHandler(async (req, res) => {
  const result = await topicService.createMyTopic(
    req.user.userId,
    req.validated.body
  );

  return success(res, result, "Create topic successfully", 201);
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
  getMyTopics,
  createMyTopic,
  updateMyTopic,
  deleteMyTopic,
};
