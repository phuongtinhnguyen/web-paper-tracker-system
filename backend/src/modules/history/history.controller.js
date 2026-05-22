const asyncHandler = require("../../utils/asyncHandler");
const { paginated, success } = require("../../utils/response");
const historyService = require("./history.service");

const getHistory = asyncHandler(async (req, res) => {
  const { papers, pagination } = await historyService.getHistory(
    req.user.userId,
    req.validated.query
  );

  return paginated(res, papers, pagination, "Get reading history successfully");
});

const removeHistoryItem = asyncHandler(async (req, res) => {
  const result = await historyService.removeHistoryItem(
    req.user.userId,
    req.validated.params.paperId
  );

  return success(res, result, "Remove reading history item successfully");
});

const clearHistory = asyncHandler(async (req, res) => {
  const result = await historyService.clearHistory(req.user.userId);

  return success(res, result, "Clear reading history successfully");
});

module.exports = {
  getHistory,
  removeHistoryItem,
  clearHistory,
};
