const asyncHandler = require("../../utils/asyncHandler");
const paperService = require("./paper.service");
const { paginated, success } = require("../../utils/response");

const getPapers = asyncHandler(async (req, res) => {
  const { papers, pagination } = await paperService.getPapers(
    req.validated.query,
    req.user?.userId
  );

  return paginated(res, papers, pagination);
});

const getPaperById = asyncHandler(async (req, res) => {
  const paper = await paperService.getPaperById(
    req.validated.params.id,
    req.user?.userId
  );

  return success(res, paper, "Get paper detail successfully");
});

const searchPapers = asyncHandler(async (req, res) => {
  const { papers, pagination } = await paperService.searchPapers(
    req.validated.query,
    req.user?.userId
  );

  return paginated(res, papers, pagination, "Search papers successfully");
});

const getRelatedPapers = asyncHandler(async (req, res) => {
  const result = await paperService.getRelatedPapers(
    req.validated.params.id,
    req.validated.query
  );

  return success(res, result, "Get related papers successfully");
});

const getMatchingPapers = asyncHandler(async (req, res) => {
  const result = await paperService.getMatchingPapers(
    req.validated.params.id,
    req.validated.query
  );

  return success(res, result, "Get matching papers successfully");
});

const summarizePaper = asyncHandler(async (req, res) => {
  const result = await paperService.summarizePaper(req.validated.params.id);

  return success(res, result, "Summarize paper successfully");
});

const submitPaperRating = asyncHandler(async (req, res) => {
  const result = await paperService.submitPaperRating(
    req.user.userId,
    req.validated.params.id,
    req.validated.body.rating
  );

  return success(res, result, "Submit paper rating successfully");
});

const getMyPaperRating = asyncHandler(async (req, res) => {
  const result = await paperService.getMyPaperRating(
    req.user.userId,
    req.validated.params.id
  );

  return success(res, result, "Get my paper rating successfully");
});


module.exports = {
  getPapers,
  getPaperById,
  searchPapers,
  getRelatedPapers,
  getMatchingPapers,
  summarizePaper,
  submitPaperRating,
  getMyPaperRating,
};


