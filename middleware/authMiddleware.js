const jwt = require('jsonwebtoken');
const config = require('../config/index');
const AppError = require('../utils/appError');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Access denied. No token provided.', 401));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return next(new AppError('Invalid or expired token.', 401));
  }
};

module.exports = authMiddleware;
