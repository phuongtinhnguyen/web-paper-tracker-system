const asyncHandler = require("../../utils/asyncHandler");
const { success } = require("../../utils/response");
const statsService = require("./stats.service");

const getTopicTrends = asyncHandler(async (req, res) => {
  const topics = await statsService.getTopicTrends(req.validated.query);

  return success(res, topics, "Get topic trends successfully");
});

module.exports = {
  getTopicTrends,
};
