const asyncHandler = require("../../utils/asyncHandler");
const paperService = require("./paper.service");
const { paginated, success } = require("../../utils/response");

const getPapers = asyncHandler(async (req, res) => {
  const { papers, pagination } = await paperService.getPapers(
    req.validated.query
  );

  return paginated(res, papers, pagination);
});

const getPaperById = asyncHandler(async (req, res) => {
  const paper = await paperService.getPaperById(req.validated.params.id);

  return success(res, paper, "Get paper detail successfully");
});

const searchPapers = asyncHandler(async (req, res) => {
  const { papers, pagination } = await paperService.searchPapers(
    req.validated.query
  );

  return paginated(res, papers, pagination, "Search papers successfully");
});


module.exports = {
  getPapers,
  getPaperById,
  searchPapers,
};

