const mongoIdParam = (field = "id") => {
  return (req, res, next) => {
    const id = req.params[field];
    const mongoIdRegex = /^[0-9a-fA-F]{24}$/;
    if (!id || !mongoIdRegex.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: [
          {
            field,
            message: `Invalid ${field}`,
          },
        ],
      });
    }
    next();
  };
};

module.exports = {
  mongoIdParam,
};
