const express = require("express");

const validate = require("../../middlewares/validate.middleware");
const paperController = require("./paper.controller");
const {
  getPapersSchema,
  getPaperByIdSchema,
  searchPapersSchema,
} = require("./paper.validation");

const authMiddleware = require("../../middlewares/auth.middleware");
const favoriteController = require("../favorites/favorite.controller");
const { favoritePaperSchema } = require("../favorites/favorite.validation");


const router = express.Router();

router.get("/", validate(getPapersSchema), paperController.getPapers);
router.get("/search", validate(searchPapersSchema), paperController.searchPapers);
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
router.get("/:id", validate(getPaperByIdSchema), paperController.getPaperById);


module.exports = router;
