const { sendError } = require("../utils/apiResponse");

const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

const normalizeErrors = (error) => {
  if (error.errors && Array.isArray(error.errors)) {
    return error.errors;
  }

  if (error.name === "ValidationError") {
    return Object.values(error.errors).map((validationError) => ({
      field: validationError.path,
      message: validationError.message,
    }));
  }

  if (error.name === "CastError") {
    return [{ field: error.path, message: "Invalid resource identifier" }];
  }

  if (error.code === 11000) {
    return Object.keys(error.keyValue || {}).map((field) => ({
      field,
      message: `${field} already exists`,
    }));
  }

  return [];
};

const getStatusCode = (error) => {
  if (error.statusCode) {
    return error.statusCode;
  }

  if (error.name === "ValidationError" || error.name === "CastError") {
    return 400;
  }

  if (error.code === 11000) {
    return 409;
  }

  return 500;
};

const getMessage = (error, statusCode) => {
  if (error.code === 11000) {
    return "Duplicate value already exists";
  }

  if (statusCode === 500) {
    return "Internal server error";
  }

  return error.message || "Something went wrong";
};

const errorHandler = (error, req, res, next) => {
  const statusCode = getStatusCode(error);
  const errors = normalizeErrors(error);
  const message = getMessage(error, statusCode);

  return sendError(res, statusCode, message, errors);
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
