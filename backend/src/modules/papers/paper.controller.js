const asyncHandler = require("../../utils/asyncHandler");
const { paginated } = require("../../utils/response");
const paperService = require("./paper.service");

const getPapers = asyncHandler(async (req, res) => {
  const { papers, pagination } = await paperService.getPapers(
    req.validated.query
  );

  return paginated(res, papers, pagination);
});

module.exports = {
  getPapers,
};
