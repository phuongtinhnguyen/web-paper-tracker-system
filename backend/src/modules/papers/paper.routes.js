const express = require("express");

const validate = require("../../middlewares/validate.middleware");
const paperController = require("./paper.controller");
const {
  getPapersSchema,
  getPaperByIdSchema,
  getRelatedPapersSchema,
  getMatchingPapersSchema,
  submitPaperRatingSchema,
  getMyPaperRatingSchema,
  searchPapersSchema,
} = require("./paper.validation");

const authMiddleware = require("../../middlewares/auth.middleware");
const optionalAuthMiddleware = require("../../middlewares/optionalAuth.middleware");
const favoriteController = require("../favorites/favorite.controller");
const { favoritePaperSchema } = require("../favorites/favorite.validation");


const router = express.Router();

router.get(
  "/",
  optionalAuthMiddleware,
  validate(getPapersSchema),
  paperController.getPapers
);
router.get(
  "/search",
  optionalAuthMiddleware,
  validate(searchPapersSchema),
  paperController.searchPapers
);
router.post(
  "/favorite/:id",
  authMiddleware,
  validate(favoritePaperSchema),
  favoriteController.addFavorite
);

router.delete(
  "/favorite/:id",
  authMiddleware,
  validate(favoritePaperSchema),
  favoriteController.removeFavorite
);
router.get(
  "/:id/related",
  validate(getRelatedPapersSchema),
  paperController.getRelatedPapers
);
router.get(
  "/:id/matches",
  validate(getMatchingPapersSchema),
  paperController.getMatchingPapers
);
router.post(
  "/:id/rating",
  authMiddleware,
  validate(submitPaperRatingSchema),
  paperController.submitPaperRating
);
router.get(
  "/:id/rating/me",
  authMiddleware,
  validate(getMyPaperRatingSchema),
  paperController.getMyPaperRating
);
router.get(
  "/:id",
  optionalAuthMiddleware,
  validate(getPaperByIdSchema),
  paperController.getPaperById
);

router.post(
  "/:id/summarize",
  authMiddleware,
  validate(getPaperByIdSchema),
  paperController.summarizePaper
);

module.exports = router;
