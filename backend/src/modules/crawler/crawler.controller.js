const asyncHandler = require("../../utils/asyncHandler");
const { success } = require("../../utils/response");
const crawlerService = require("./crawler.service");

const runCrawler = asyncHandler(async (req, res) => {
  const result = await crawlerService.runManualCrawler(
    req.validated.body,
    req.user?.userId
  );

  return success(res, result, "Crawler job accepted", 202);
});

const getCrawlerStatus = asyncHandler(async (req, res) => {
  const result = crawlerService.getCrawlerStatus();

  return success(res, result, "Get crawler status successfully");
});

module.exports = {
  runCrawler,
  getCrawlerStatus,
};
