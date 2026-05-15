const express = require("express");

const validate = require("../../middlewares/validate.middleware");
const paperController = require("./paper.controller");
const { getPapersSchema } = require("./paper.validation");

const router = express.Router();

router.get("/", validate(getPapersSchema), paperController.getPapers);

module.exports = router;
