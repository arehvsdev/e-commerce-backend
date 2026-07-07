const sendSuccess = (res, statusCode, message, data = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const sendError = (res, statusCode, message, errors = []) => {
  const response = {
    success: false,
    message,
  };
  if (errors && errors.length > 0) {
    response.errors = errors;
  }
  return res.status(statusCode).json(response);
};

module.exports = {
  sendSuccess,
  sendError,
};
