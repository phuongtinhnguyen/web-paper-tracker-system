const asyncHandler = require("../../utils/asyncHandler");
const { success } = require("../../utils/response");
const authService = require("./auth.service");

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.validated.body);

  return success(res, result, "Register successfully", 201);
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.validated.body);

  return success(res, result, "Login successfully");
});

const getMe = asyncHandler(async (req, res) => {
  const result = await authService.getMe(req.user.userId);

  return success(res, result);
});

module.exports = {
  register,
  login,
  getMe,
};
