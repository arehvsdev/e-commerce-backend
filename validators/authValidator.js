const registerValidator = (req, res, next) => {
  const errors = [];
  const allowed = ["name", "email", "password", "phone", "firstName", "lastName"];
  
  // Reject unknown fields
  for (const key of Object.keys(req.body || {})) {
    if (!allowed.includes(key)) {
      errors.push({ field: key, message: "Field is not allowed" });
    }
  }

  const { name, email, password, phone, role, firstName, lastName } = req.body || {};

  // Validate firstName and lastName if present, otherwise fallback to validating name
  if (firstName || lastName) {
    if (firstName === undefined || firstName === null || firstName.trim() === "") {
      errors.push({ field: "firstName", message: "First name is required" });
    }
    if (lastName === undefined || lastName === null || lastName.trim() === "") {
      errors.push({ field: "lastName", message: "Last name is required" });
    }
  } else {
    // name
    if (name === undefined || name === null || name === "") {
      errors.push({ field: "name", message: "Name is required" });
    } else if (name.trim().length < 2 || name.trim().length > 60) {
      errors.push({ field: "name", message: "Name must be between 2 and 60 characters" });
    }
  }

  // email
  if (!email) {
    errors.push({ field: "email", message: "Valid email is required" });
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push({ field: "email", message: "Valid email is required" });
    }
  }

  // password
  if (!password) {
    errors.push({ field: "password", message: "Password must be at least 8 characters long" });
  } else {
    if (password.length < 8) {
      errors.push({ field: "password", message: "Password must be at least 8 characters long" });
    } else if (!/[A-Za-z]/.test(password)) {
      errors.push({ field: "password", message: "Password must contain at least one letter" });
    } else if (!/\d/.test(password)) {
      errors.push({ field: "password", message: "Password must contain at least one number" });
    }
  }

  // phone
  if (phone === undefined || phone === null || phone === "") {
    errors.push({ field: "phone", message: "Phone is required" });
  } else if (phone.trim().length < 7 || phone.trim().length > 20) {
    errors.push({ field: "phone", message: "Phone must be between 7 and 20 characters" });
  }

  // role
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
    if (name) req.body.name = name.trim();
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
  
  for (const key of Object.keys(req.body || {})) {
    if (!allowed.includes(key)) {
      errors.push({ field: key, message: "Field is not allowed" });
    }
  }

  const { email, password } = req.body || {};

  // email
  if (!email) {
    errors.push({ field: "email", message: "Valid email is required" });
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push({ field: "email", message: "Valid email is required" });
    }
  }

  // password
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

module.exports = {
  registerValidator: [registerValidator],
  loginValidator: [loginValidator],
};
