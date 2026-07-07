const { body, param, validationResult } = require("express-validator");
const AppError = require("../utils/appError");

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(
      new AppError(
        "Validation failed",
        400,
        errors.array().map((error) => ({
          field: error.path,
          message: error.msg,
        }))
      )
    );
  }

  next();
};

const mongoIdParam = (field = "id") => [
  param(field).isMongoId().withMessage(`Invalid ${field}`),
  validateRequest,
];

const rejectUnknownFields = (allowedFields) => {
  return (req, res, next) => {
    const unknownFields = Object.keys(req.body || {}).filter(
      (field) => !allowedFields.includes(field)
    );

    if (unknownFields.length > 0) {
      return next(
        new AppError(
          "Validation failed",
          400,
          unknownFields.map((field) => ({
            field,
            message: "Field is not allowed",
          }))
        )
      );
    }

    next();
  };
};

const requireBodyFields = () => {
  return (req, res, next) => {
    if (Object.keys(req.body || {}).length === 0) {
      return next(
        new AppError("Validation failed", 400, [
          { field: "body", message: "At least one field is required" },
        ])
      );
    }

    next();
  };
};

const nameRule = (required = true) => {
  const rule = body("name").trim();

  if (!required) {
    return rule
      .optional()
      .isLength({ min: 2, max: 60 })
      .withMessage("Name must be between 2 and 60 characters");
  }

  return rule
    .notEmpty()
    .withMessage("Name is required")
    .bail()
    .isLength({ min: 2, max: 60 })
    .withMessage("Name must be between 2 and 60 characters");
};

const emailRule = (required = true) => {
  const rule = body("email").trim();

  if (!required) {
    return rule
      .optional()
      .isEmail()
      .withMessage("Valid email is required")
      .normalizeEmail();
  }

  return rule
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail();
};

const passwordRule = (required = true) => {
  const rule = body("password");

  if (!required) {
    return rule.optional();
  }

  return rule
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/[A-Za-z]/)
    .withMessage("Password must contain at least one letter")
    .matches(/\d/)
    .withMessage("Password must contain at least one number");
};

const phoneRule = (required = true) => {
  const rule = body("phone").trim();

  if (!required) {
    return rule
      .optional()
      .isLength({ min: 7, max: 20 })
      .withMessage("Phone must be between 7 and 20 characters");
  }

  return rule
    .notEmpty()
    .withMessage("Phone is required")
    .bail()
    .isLength({ min: 7, max: 20 })
    .withMessage("Phone must be between 7 and 20 characters");
};

const roleRule = () => {
  return body("role")
    .optional()
    .isIn(["admin", "user"])
    .withMessage("Role must be admin or user");
};

module.exports = {
  validateRequest,
  mongoIdParam,
  rejectUnknownFields,
  requireBodyFields,
  nameRule,
  emailRule,
  passwordRule,
  phoneRule,
  roleRule,
};
