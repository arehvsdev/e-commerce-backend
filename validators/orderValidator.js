const orderFields = ["productId", "quantity", "paymentMethod", "status", "shippingAddress"];
const paymentMethods = ["credit_card", "paypal", "cash_on_delivery"];
const orderStatuses = ["pending", "shipped", "delivered"];

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

const createOrderValidator = (req, res, next) => {
  const errors = [];
  rejectUnknownBodyFields(req, ["productId", "quantity", "paymentMethod", "status", "shippingAddress"], errors);

  const { productId, quantity, paymentMethod, status, shippingAddress } = req.body || {};

  if (status !== undefined) {
    errors.push({ field: "status", message: "Status cannot be set when placing an order" });
  }

  if (!productId) {
    errors.push({ field: "productId", message: "Valid productId is required" });
  } else {
    const mongoIdRegex = /^[0-9a-fA-F]{24}$/;
    if (!mongoIdRegex.test(productId)) {
      errors.push({ field: "productId", message: "Valid productId is required" });
    }
  }

  if (quantity === undefined || quantity === null) {
    errors.push({ field: "quantity", message: "Quantity must be a positive integer" });
  } else {
    const q = Number(quantity);
    if (isNaN(q) || !Number.isInteger(q) || q < 1) {
      errors.push({ field: "quantity", message: "Quantity must be a positive integer" });
    }
  }

  if (!paymentMethod) {
    errors.push({ field: "paymentMethod", message: "Invalid payment method" });
  } else if (!paymentMethods.includes(paymentMethod)) {
    errors.push({ field: "paymentMethod", message: "Invalid payment method" });
  }

  if (shippingAddress === undefined || shippingAddress === null || shippingAddress.trim() === "") {
    errors.push({ field: "shippingAddress", message: "Shipping address is required" });
  } else if (typeof shippingAddress !== "string" || shippingAddress.trim().length < 10 || shippingAddress.trim().length > 300) {
    errors.push({ field: "shippingAddress", message: "Shipping address must be between 10 and 300 characters" });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  // Sanitization
  if (req.body) {
    if (quantity !== undefined) req.body.quantity = parseInt(quantity, 10);
    if (shippingAddress) req.body.shippingAddress = shippingAddress.trim();
  }

  next();
};

const updateOrderValidator = (req, res, next) => {
  if (!checkBodyNotEmpty(req)) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: [{ field: "body", message: "At least one field is required" }],
    });
  }

  const errors = [];
  rejectUnknownBodyFields(req, orderFields, errors);

  const { productId, quantity, paymentMethod, status, shippingAddress } = req.body;

  if (productId !== undefined) {
    errors.push({ field: "productId", message: "Product cannot be changed" });
  }

  if (quantity !== undefined) {
    const q = Number(quantity);
    if (isNaN(q) || !Number.isInteger(q) || q < 1) {
      errors.push({ field: "quantity", message: "Quantity must be a positive integer" });
    }
  }

  if (paymentMethod !== undefined) {
    if (!paymentMethods.includes(paymentMethod)) {
      errors.push({ field: "paymentMethod", message: "Invalid payment method" });
    }
  }

  if (status !== undefined) {
    if (!orderStatuses.includes(status)) {
      errors.push({ field: "status", message: "Invalid status" });
    }
  }

  if (shippingAddress !== undefined) {
    if (typeof shippingAddress !== "string" || shippingAddress.trim().length < 10 || shippingAddress.trim().length > 300) {
      errors.push({ field: "shippingAddress", message: "Shipping address must be between 10 and 300 characters" });
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  // Sanitization
  if (req.body) {
    if (quantity !== undefined) req.body.quantity = parseInt(quantity, 10);
    if (shippingAddress) req.body.shippingAddress = shippingAddress.trim();
  }

  next();
};

module.exports = {
  createOrderValidator: [createOrderValidator],
  updateOrderValidator: [updateOrderValidator],
};
