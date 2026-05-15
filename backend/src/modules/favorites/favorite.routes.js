const express = require("express");

const authMiddleware = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate.middleware");
const favoriteController = require("./favorite.controller");
const { getFavoritesSchema } = require("./favorite.validation");

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  validate(getFavoritesSchema),
  favoriteController.getFavorites
);

module.exports = router;
