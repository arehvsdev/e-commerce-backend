const userFields = ["name", "email", "password", "phone", "role"];

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

const validateName = (name, required, errors) => {
  if (name === undefined || name === null) {
    if (required) errors.push({ field: "name", message: "Name is required" });
  } else if (typeof name !== "string" || name.trim() === "") {
    errors.push({ field: "name", message: "Name must be between 2 and 60 characters" });
  } else if (name.trim().length < 2 || name.trim().length > 60) {
    errors.push({ field: "name", message: "Name must be between 2 and 60 characters" });
  }
};

const validatePhone = (phone, required, errors) => {
  if (phone === undefined || phone === null) {
    if (required) errors.push({ field: "phone", message: "Phone is required" });
  } else if (typeof phone !== "string" || phone.trim() === "") {
    errors.push({ field: "phone", message: "Phone must be between 7 and 20 characters" });
  } else if (phone.trim().length < 7 || phone.trim().length > 20) {
    errors.push({ field: "phone", message: "Phone must be between 7 and 20 characters" });
  }
};

const validateEmail = (email, required, errors) => {
  if (!email) {
    if (required) errors.push({ field: "email", message: "Valid email is required" });
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push({ field: "email", message: "Valid email is required" });
    }
  }
};

const validatePassword = (password, required, errors) => {
  if (!password) {
    if (required) errors.push({ field: "password", message: "Password must be at least 8 characters long" });
  } else {
    if (password.length < 8) {
      errors.push({ field: "password", message: "Password must be at least 8 characters long" });
    } else if (!/[A-Za-z]/.test(password)) {
      errors.push({ field: "password", message: "Password must contain at least one letter" });
    } else if (!/\d/.test(password)) {
      errors.push({ field: "password", message: "Password must contain at least one number" });
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

const createUserValidator = (req, res, next) => {
  const errors = [];
  rejectUnknownBodyFields(req, userFields, errors);

  const { name, email, password, phone, role } = req.body || {};

  validateName(name, true, errors);
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
    if (name) req.body.name = name.trim();
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
  rejectUnknownBodyFields(req, ["name", "phone"], errors);

  const { name, phone, email, password, role } = req.body;

  if (email !== undefined) errors.push({ field: "email", message: "Email cannot be updated here" });
  if (password !== undefined) errors.push({ field: "password", message: "Password cannot be updated here" });
  if (role !== undefined) errors.push({ field: "role", message: "Role cannot be updated here" });

  validateName(name, true, errors);
  validatePhone(phone, true, errors);

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  // Sanitization
  if (name) req.body.name = name.trim();
  if (phone) req.body.phone = phone.trim();

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
  rejectUnknownBodyFields(req, ["name", "phone"], errors);

  const { name, phone, email, password, role } = req.body;

  if (email !== undefined) errors.push({ field: "email", message: "Email cannot be updated here" });
  if (password !== undefined) errors.push({ field: "password", message: "Password cannot be updated here" });
  if (role !== undefined) errors.push({ field: "role", message: "Role cannot be updated here" });

  if (name !== undefined) validateName(name, false, errors);
  if (phone !== undefined) validatePhone(phone, false, errors);

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  // Sanitization
  if (name) req.body.name = name.trim();
  if (phone) req.body.phone = phone.trim();

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
  rejectUnknownBodyFields(req, ["name", "email", "phone"], errors);

  const { name, email, phone, role, password } = req.body;

  if (password !== undefined) {
    errors.push({ field: "password", message: "Password cannot be updated here" });
  }

  if (role !== undefined) {
    errors.push({ field: "role", message: "Role cannot be updated here" });
  }

  if (name !== undefined) validateName(name, false, errors);
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
  if (name) req.body.name = name.trim();
  if (email) req.body.email = email.toLowerCase().trim();
  if (phone) req.body.phone = phone.trim();

  next();
};

module.exports = {
  createUserValidator: [createUserValidator],
  updateProfileValidator: [updateProfileValidator],
  putProfileValidator: [putProfileValidator],
  patchProfileValidator: [patchProfileValidator],
  adminUpdateUserValidator: [adminUpdateUserValidator],
};
