const asyncHandler = require("../../utils/asyncHandler");
const { success, paginated } = require("../../utils/response");
const favoriteService = require("./favorite.service");

const addFavorite = asyncHandler(async (req, res) => {
  const result = await favoriteService.addFavorite(
    req.user.userId,
    req.validated.params.id
  );

  return success(res, result, "Add favorite successfully");
});

const removeFavorite = asyncHandler(async (req, res) => {
  const result = await favoriteService.removeFavorite(
    req.user.userId,
    req.validated.params.id
  );

  return success(res, result, "Remove favorite successfully");
});

const getFavorites = asyncHandler(async (req, res) => {
  const { papers, pagination } = await favoriteService.getFavorites(
    req.user.userId,
    req.validated.query
  );

  return paginated(res, papers, pagination, "Get favorites successfully");
});

module.exports = {
  addFavorite,
  removeFavorite,
  getFavorites,
};
