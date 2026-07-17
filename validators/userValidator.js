const mongoose = require('mongoose');

const userFields = ["firstName", "lastName", "email", "password", "phone", "role"];
const adminUpdateFields = ["firstName", "lastName", "email", "phone"];
const profileAllowedFields = [
  "firstName",
  "lastName",
  "phone",
  "bio"
];

const rejectUnknownBodyFields = (req, allowed, errors) => {
  for (const key of Object.keys(req.body || {})) {
    if (!allowed.includes(key)) {
      errors.push({ field: key, message: "Field is not allowed" });
    }
  }
};

const checkBodyNotEmpty = (req) => {
  return req.body && Object.keys(req.body).length > 0;
};

const validateName = (name, fieldName, errors) => {
  if (name === undefined || name === null || name.trim() === "") {
    errors.push({ field: fieldName, message: `${fieldName === "firstName" ? "First" : "Last"} name is required` });
  } else if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 60) {
    errors.push({ field: fieldName, message: `${fieldName === "firstName" ? "First" : "Last"} name must be between 2 and 60 characters` });
  }
};

const validatePhone = (phone, required, errors) => {
  if (phone === undefined || phone === null) {
    if (required) errors.push({ field: "phone", message: "Phone is required" });
  } else if (typeof phone !== "string" || phone.trim() === "") {
    errors.push({ field: "phone", message: "Phone is required" });
  } else {
    const pTrim = phone.trim();
    if (pTrim.length < 7 || pTrim.length > 20) {
      errors.push({ field: "phone", message: "Phone must be between 7 and 20 characters" });
    } else if (!/^[+0-9\s()-]+$/.test(pTrim)) {
      errors.push({ field: "phone", message: "Phone number contains invalid characters" });
    }
  }
};

const validateEmail = (email, required, errors) => {
  if (!email) {
    if (required) errors.push({ field: "email", message: "Valid email is required" });
  } else {
    if (typeof email !== "string" || email.length < 5 || email.length > 100) {
      errors.push({ field: "email", message: "Email must be between 5 and 100 characters" });
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.push({ field: "email", message: "Valid email is required" });
      }
    }
  }
};

const validatePassword = (password, required, errors) => {
  if (!password) {
    if (required) errors.push({ field: "password", message: "Password is required" });
  } else {
    if (typeof password !== "string" || password.length < 8 || password.length > 100) {
      errors.push({ field: "password", message: "Password must be between 8 and 100 characters long" });
    } else {
      if (!/[A-Z]/.test(password)) {
        errors.push({ field: "password", message: "Password must contain at least one uppercase letter" });
      }
      if (!/[a-z]/.test(password)) {
        errors.push({ field: "password", message: "Password must contain at least one lowercase letter" });
      }
      if (!/\d/.test(password)) {
        errors.push({ field: "password", message: "Password must contain at least one number" });
      }
      if (!/[@$!%*?&#^()_\-+={[\]}|\\:;"'<,>.?/]/.test(password)) {
        errors.push({ field: "password", message: "Password must contain at least one special character" });
      }
    }
  }
};

const validateRole = (role, errors) => {
  if (role !== undefined) {
    if (!["admin", "user"].includes(role)) {
      errors.push({ field: "role", message: "Role must be admin or user" });
    }
  }
};

const validateProfileFields = (req, isPut, errors) => {
  const { firstName, lastName, phone, bio } = req.body || {};

  // firstName
  if (isPut || firstName !== undefined) {
    validateName(firstName, "firstName", errors);
  }

  // lastName
  if (isPut || lastName !== undefined) {
    validateName(lastName, "lastName", errors);
  }

  // phone
  if (isPut || phone !== undefined) {
    validatePhone(phone, true, errors);
  }

  // bio
  if (bio !== undefined && bio !== null && bio !== "") {
    if (typeof bio !== "string" || bio.trim().length < 2 || bio.trim().length > 200) {
      errors.push({ field: "bio", message: "Bio must be between 2 and 200 characters" });
    }
  }
};

const createUserValidator = (req, res, next) => {
  const errors = [];
  rejectUnknownBodyFields(req, userFields, errors);

  const { firstName, lastName, email, password, phone, role } = req.body || {};

  validateName(firstName, "firstName", errors);
  validateName(lastName, "lastName", errors);
  validateEmail(email, true, errors);
  validatePassword(password, true, errors);
  validatePhone(phone, true, errors);
  validateRole(role, errors);

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  // Sanitization
  if (req.body) {
    if (firstName) req.body.firstName = firstName.trim();
    if (lastName) req.body.lastName = lastName.trim();
    if (email) req.body.email = email.toLowerCase().trim();
    if (phone) req.body.phone = phone.trim();
  }

  next();
};

const putProfileValidator = (req, res, next) => {
  if (!checkBodyNotEmpty(req)) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: [{ field: "body", message: "At least one field is required" }],
    });
  }

  const errors = [];
  rejectUnknownBodyFields(req, profileAllowedFields, errors);
  validateProfileFields(req, false, errors);

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  // Sanitization
  if (req.body) {
    const { firstName, lastName, phone, bio } = req.body;
    if (firstName) req.body.firstName = firstName.trim();
    if (lastName) req.body.lastName = lastName.trim();
    if (phone) req.body.phone = phone.trim();
    if (bio) req.body.bio = bio.trim();
  }

  next();
};

const updateProfileValidator = putProfileValidator;

const patchProfileValidator = (req, res, next) => {
  if (!checkBodyNotEmpty(req)) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: [{ field: "body", message: "At least one field is required" }],
    });
  }

  const errors = [];
  rejectUnknownBodyFields(req, profileAllowedFields, errors);
  validateProfileFields(req, false, errors);

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  // Sanitization
  if (req.body) {
    const { firstName, lastName, phone, bio } = req.body;
    if (firstName) req.body.firstName = firstName.trim();
    if (lastName) req.body.lastName = lastName.trim();
    if (phone) req.body.phone = phone.trim();
    if (bio) req.body.bio = bio.trim();
  }

  next();
};

const adminUpdateUserValidator = (req, res, next) => {
  if (!checkBodyNotEmpty(req)) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: [{ field: "body", message: "At least one field is required" }],
    });
  }

  const errors = [];
  rejectUnknownBodyFields(req, adminUpdateFields, errors);

  const { firstName, lastName, email, phone } = req.body;

  if (firstName !== undefined) validateName(firstName, "firstName", errors);
  if (lastName !== undefined) validateName(lastName, "lastName", errors);
  if (email !== undefined) validateEmail(email, false, errors);
  if (phone !== undefined) validatePhone(phone, false, errors);

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  // Sanitization
  if (req.body) {
    if (firstName) req.body.firstName = firstName.trim();
    if (lastName) req.body.lastName = lastName.trim();
    if (email) req.body.email = email.toLowerCase().trim();
    if (phone) req.body.phone = phone.trim();
  }

  next();
};

const changePasswordValidator = (req, res, next) => {
  const errors = [];
  rejectUnknownBodyFields(req, ["oldPassword", "newPassword"], errors);

  const { oldPassword, newPassword } = req.body || {};

  if (!oldPassword || oldPassword.trim() === "") {
    errors.push({ field: "oldPassword", message: "Old password is required" });
  }
  validatePassword(newPassword, true, errors);

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};

const addressValidator = (req, res, next) => {
  const errors = [];
  rejectUnknownBodyFields(req, ["country", "cityState", "postalCode"], errors);

  const { country, cityState, postalCode } = req.body || {};

  // country (reference validation)
  if (country === undefined || country === null || country.toString().trim() === "") {
    errors.push({ field: "country", message: "Country is required" });
  } else if (!mongoose.Types.ObjectId.isValid(country)) {
    errors.push({ field: "country", message: "Invalid country selection" });
  }

  // cityState
  if (cityState === undefined || cityState === null || cityState.trim() === "") {
    errors.push({ field: "cityState", message: "City/State is required" });
  } else if (typeof cityState !== "string" || cityState.trim().length < 2 || cityState.trim().length > 100) {
    errors.push({ field: "cityState", message: "City/State must be between 2 and 100 characters" });
  }

  // postalCode
  if (postalCode === undefined || postalCode === null || postalCode.toString().trim() === "") {
    errors.push({ field: "postalCode", message: "Postal code is required" });
  } else {
    const pc = postalCode.toString().trim();
    if (!/^\d{6}$/.test(pc)) {
      errors.push({ field: "postalCode", message: "Postal code must be exactly 6 digits" });
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  if (req.body) {
    if (country) req.body.country = country.toString().trim();
    if (cityState) req.body.cityState = cityState.trim();
    if (postalCode) req.body.postalCode = postalCode.toString().trim();
  }

  next();
};

module.exports = {
  createUserValidator: [createUserValidator],
  updateProfileValidator: [updateProfileValidator],
  putProfileValidator: [putProfileValidator],
  patchProfileValidator: [patchProfileValidator],
  adminUpdateUserValidator: [adminUpdateUserValidator],
  changePasswordValidator: [changePasswordValidator],
  addressValidator: [addressValidator],
};
