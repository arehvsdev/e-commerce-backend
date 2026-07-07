const asyncHandler = (controller) => {
  return (req, res, next) => {
    return Promise.resolve(controller(req, res, next)).catch(next);
  };
};

module.exports = asyncHandler;
