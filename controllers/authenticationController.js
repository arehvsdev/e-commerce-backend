const User = require('../models/user');
const bcrypt = require('bcryptjs');
const config = require('../config/index');
const generateToken = require('../utils/generateToken');

const formatAuthUser = (user) => ({
  id: user._id,
  name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  phone: user.phone,
  role: user.role,
});

const healthCheck = async (req, res) => {
  res.status(200).json({ success: true, data: { message: 'Health check successful' } });
};

const registerUser = async (req, res) => {
  try {
    const { email, password, phone, firstName, lastName } = req.body;

    const userExist = await User.findOne({ email });
    if (userExist) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const resolvedName = `${firstName || ''} ${lastName || ''}`.trim();

    const user = await User.create({
      name: resolvedName,
      firstName: firstName || '',
      lastName: lastName || '',
      email,
      password, // raw password, hashed in model pre-save hook
      phone,
      role: 'user',
    });

    return res.status(201).json({
      success: true,
      data: { user: formatAuthUser(user) },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken({ id: user._id, email: user.email, role: user.role });

    return res.status(200).json({
      success: true,
      data: {
        token,
        tokenType: 'Bearer',
        expiresIn: config.JWT_EXPIRES_IN,
        user: formatAuthUser(user),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const checkEmail = async (req, res) => {
  try {
    console.log("Check email call")
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found with this email' });
    }

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const resetPassword = async (req, res) => {
  try {
    console.log("Reset password call");
    console.log(req.body);
    const { email, newPassword } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found with this email' });
    }

    user.password = newPassword; // Raw password, hashed in model pre-save hook
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;

    await user.save({ validateBeforeSave: false });

    return res.status(200).json({ success: true, message: 'Password has been reset successfully' });
  } catch (error) {
    console.log('Error in reset password');
    console.log(error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  healthCheck,
  registerUser,
  loginUser,
  checkEmail,
  resetPassword,
};
