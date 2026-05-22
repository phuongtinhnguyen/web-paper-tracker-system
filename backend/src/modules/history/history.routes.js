const express = require("express");

const authMiddleware = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate.middleware");
const historyController = require("./history.controller");
const {
  getHistorySchema,
  deleteHistoryItemSchema,
  clearHistorySchema,
} = require("./history.validation");

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  validate(getHistorySchema),
  historyController.getHistory
);

router.delete(
  "/",
  authMiddleware,
  validate(clearHistorySchema),
  historyController.clearHistory
);

router.delete(
  "/:paperId",
  authMiddleware,
  validate(deleteHistoryItemSchema),
  historyController.removeHistoryItem
);

module.exports = router;
