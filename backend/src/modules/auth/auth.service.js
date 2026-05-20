const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const env = require("../../config/env");
const AppError = require("../../utils/appError");
const authRepository = require("./auth.repository");

function signToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
    },
    env.jwtSecret,
    {
      expiresIn: env.jwtExpiresIn,
    }
  );
}

async function register({ username, email, password }) {
  const existingUser = await authRepository.findUserByEmail(email);

  if (existingUser) {
    throw new AppError("Email already exists", 409);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await authRepository.createUser({
    email,
    hashedPassword,
    username,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      username: user.full_name,
      created_at: user.created_at,
    },
  };
}

async function login({ email, password }) {
  const user = await authRepository.findUserByEmail(email);

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.hashed_password);

  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401);
  }

  const accessToken = signToken(user);

  return {
    access_token: accessToken,
    username: user.full_name || user.email,
    user: {
      id: user.id,
      email: user.email,
      username: user.full_name,
    },
  };
}

async function getMe(userId) {
  const user = await authRepository.findUserById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      username: user.full_name,
      created_at: user.created_at,
    },
  };
}

async function updateProfile(userId, { username }) {
  const user = await authRepository.findUserById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const updatedUser = await authRepository.updateUser(userId, {
    username,
    email: user.email,
  });

  return {
    user: {
      id: updatedUser.id,
      email: updatedUser.email,
      username: updatedUser.full_name,
      created_at: updatedUser.created_at,
    },
  };
}

async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await authRepository.findUserById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Need hashed_password from DB — fetch with it
  const userWithPassword = await authRepository.findUserByEmail(user.email);

  const isPasswordValid = await bcrypt.compare(currentPassword, userWithPassword.hashed_password);
  if (!isPasswordValid) {
    throw new AppError("Current password is incorrect", 401);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await authRepository.updatePassword(userId, hashedPassword);

  return { message: "Password changed successfully" };
}

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
};
