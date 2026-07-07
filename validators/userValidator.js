const { body } = require("express-validator");
const {
  emailRule,
  nameRule,
  passwordRule,
  phoneRule,
  rejectUnknownFields,
  requireBodyFields,
  roleRule,
  validateRequest,
} = require("./commonValidator");

const userFields = ["name", "email", "password", "phone", "role"];
const rejectUnknownUserFields = rejectUnknownFields(userFields);

const updateProfileValidator = [
  rejectUnknownUserFields,
  requireBodyFields(),
  nameRule(false),
  phoneRule(false),
  body("email").not().exists().withMessage("Email cannot be updated here"),
  body("password").not().exists().withMessage("Password cannot be updated here"),
  body("role").not().exists().withMessage("Role cannot be updated here"),
  validateRequest,
];

const createUserValidator = [
  rejectUnknownUserFields,
  nameRule(true),
  emailRule(true),
  passwordRule(true),
  phoneRule(true),
  roleRule(),
  validateRequest,
];

const adminUpdateUserValidator = [
  rejectUnknownUserFields,
  requireBodyFields(),
  nameRule(false),
  emailRule(false),
  phoneRule(false),
  body("password").not().exists().withMessage("Password cannot be updated here"),
  roleRule(),
  validateRequest,
];

module.exports = {
  createUserValidator,
  updateProfileValidator,
  adminUpdateUserValidator,
};
