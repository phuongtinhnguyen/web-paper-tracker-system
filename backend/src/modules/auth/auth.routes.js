const express = require("express");

const validate = require("../../middlewares/validate.middleware");
const authMiddleware = require("../../middlewares/auth.middleware");
const authController = require("./auth.controller");
const {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
} = require("./auth.validation");

const router = express.Router();

router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);
router.get("/me", authMiddleware, authController.getMe);
router.put(
  "/profile",
  authMiddleware,
  validate(updateProfileSchema),
  authController.updateProfile
);

router.put(
  "/change-password",
  authMiddleware,
  validate(changePasswordSchema),
  authController.changePassword
);

module.exports = router;
