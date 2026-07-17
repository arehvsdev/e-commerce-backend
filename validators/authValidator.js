const rejectUnknownBodyFields = (req, allowed, errors) => {
  for (const key of Object.keys(req.body || {})) {
    if (!allowed.includes(key)) {
      errors.push({ field: key, message: "Field is not allowed" });
    }
  }
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

const registerValidator = (req, res, next) => {
  const errors = [];
  const allowed = ["email", "password", "phone", "firstName", "lastName"];
  
  rejectUnknownBodyFields(req, allowed, errors);

  const { firstName, lastName, email, password, phone, role } = req.body || {};

  validateName(firstName, "firstName", errors);
  validateName(lastName, "lastName", errors);
  validateEmail(email, true, errors);
  validatePassword(password, true, errors);
  validatePhone(phone, true, errors);

  if (role !== undefined) {
    errors.push({ field: "role", message: "Role cannot be set during registration" });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  // Trim and normalize values
  if (req.body) {
    if (firstName) req.body.firstName = firstName.trim();
    if (lastName) req.body.lastName = lastName.trim();
    if (email) req.body.email = email.toLowerCase().trim();
    if (phone) req.body.phone = phone.trim();
  }

  next();
};

const loginValidator = (req, res, next) => {
  const errors = [];
  const allowed = ["email", "password"];
  
  rejectUnknownBodyFields(req, allowed, errors);

  const { email, password } = req.body || {};

  validateEmail(email, true, errors);

  if (password === undefined || password === null || password === "") {
    errors.push({ field: "password", message: "Password is required" });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  if (req.body) {
    if (email) req.body.email = email.toLowerCase().trim();
  }

  next();
};

const checkEmailValidator = (req, res, next) => {
  const errors = [];
  rejectUnknownBodyFields(req, ["email"], errors);

  const { email } = req.body || {};

  validateEmail(email, true, errors);

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  if (req.body && email) {
    req.body.email = email.toLowerCase().trim();
  }

  next();
};

const resetPasswordValidator = (req, res, next) => {
  const errors = [];
  rejectUnknownBodyFields(req, ["email", "newPassword"], errors);

  const { email, newPassword } = req.body || {};

  validateEmail(email, true, errors);
  validatePassword(newPassword, true, errors);

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  if (req.body) {
    if (email) req.body.email = email.toLowerCase().trim();
  }

  next();
};

module.exports = {
  registerValidator: [registerValidator],
  loginValidator: [loginValidator],
  checkEmailValidator: [checkEmailValidator],
  resetPasswordValidator: [resetPasswordValidator],
};
