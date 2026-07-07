const { body } = require("express-validator");
const {
  emailRule,
  nameRule,
  passwordRule,
  phoneRule,
  rejectUnknownFields,
  validateRequest,
} = require("./commonValidator");

const registerValidator = [
  rejectUnknownFields(["name", "email", "password", "phone"]),
  nameRule(true),
  emailRule(true),
  passwordRule(true),
  phoneRule(true),
  body("role").not().exists().withMessage("Role cannot be set during registration"),
  validateRequest,
];

const loginValidator = [
  rejectUnknownFields(["email", "password"]),
  emailRule(true),
  body("password").notEmpty().withMessage("Password is required"),
  validateRequest,
];

module.exports = {
  registerValidator,
  loginValidator,
};
