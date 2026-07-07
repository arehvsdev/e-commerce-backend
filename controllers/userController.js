const bcrypt = require("bcryptjs");
const User = require("../models/user");
const { sendSuccess } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/appError");

const allowedUserFields = ["name", "email", "phone", "role"];

const formatUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
});

const pickUserFields = (body) => {
  return allowedUserFields.reduce((updates, field) => {
    if (body[field] !== undefined) {
      updates[field] = body[field];
    }

    return updates;
  }, {});
};

const healthCheck = asyncHandler(async (req, res) => {
  return sendSuccess(res, 200, "Health check successful");
});

const createUser = asyncHandler(async (req, res) => {
  const existingUser = await User.findOne({ email: req.body.email });

  if (existingUser) {
    throw new AppError("User already exists", 409);
  }

  const hashedPassword = await bcrypt.hash(req.body.password, 12);
  const user = await User.create({
    ...pickUserFields(req.body),
    password: hashedPassword,
  });

  return sendSuccess(res, 201, "User created successfully", {
    user: formatUser(user),
  });
});

const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password");

  return sendSuccess(res, 200, "Users fetched successfully", { users });
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return sendSuccess(res, 200, "User fetched successfully", { user });
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  Object.assign(user, pickUserFields(req.body));
  await user.save();

  return sendSuccess(res, 200, "User updated successfully", {
    user: formatUser(user),
  });
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  await user.deleteOne();

  return sendSuccess(res, 200, "User deleted successfully");
});

const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return sendSuccess(res, 200, "Profile fetched successfully", { user });
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const updates = pickUserFields(req.body);
  delete updates.email;
  delete updates.role;

  Object.assign(user, updates);
  await user.save();

  return sendSuccess(res, 200, "Profile updated successfully", {
    user: formatUser(user),
  });
});

const deleteProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  await user.deleteOne();

  return sendSuccess(res, 200, "Profile deleted successfully");
});

module.exports = {
  healthCheck,
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getProfile,
  updateProfile,
  deleteProfile,
};
