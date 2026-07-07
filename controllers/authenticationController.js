const User = require('../models/user');
const bcrypt = require('bcryptjs');
const config = require('../config/index');
const generateToken = require('../utils/generateToken');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError');
const { sendSuccess } = require('../utils/apiResponse');

const formatAuthUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
});

const healthCheck = asyncHandler(async (req, res) => {
  return sendSuccess(res, 200, 'Health check successful');
});

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  const userExist = await User.findOne({ email });
  if (userExist) {
    throw new AppError('User already exists', 409);
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = new User({
    name,
    email,
    password: hashedPassword,
    phone,
  });

  await user.save();

  return sendSuccess(res, 201, 'User registered successfully', {
    user: formatAuthUser(user),
  });
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = generateToken({ id: user._id, email: user.email, role: user.role });

  return sendSuccess(res, 200, 'Login successful', {
    token,
    tokenType: 'Bearer',
    expiresIn: config.JWT_EXPIRES_IN,
    user: formatAuthUser(user),
  });
});

module.exports = {
  healthCheck,
  registerUser,
  loginUser,
};
