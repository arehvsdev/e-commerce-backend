const productFields = [
  "name",
  "description",
  "category",
  "price",
  "stock",
  "image",
  "rating",
];

const checkBodyNotEmpty = (req) => {
  return req.body && Object.keys(req.body).length > 0;
};

const rejectUnknownBodyFields = (req, allowed, errors) => {
  for (const key of Object.keys(req.body || {})) {
    if (!allowed.includes(key)) {
      errors.push({ field: key, message: "Field is not allowed" });
    }
  }
};

const validateName = (name, required, errors) => {
  if (name === undefined || name === null) {
    if (required) errors.push({ field: "name", message: "Name is required" });
  } else if (typeof name !== "string" || name.trim() === "") {
    errors.push({ field: "name", message: "Name must be between 2 and 100 characters" });
  } else if (name.trim().length < 2 || name.trim().length > 100) {
    errors.push({ field: "name", message: "Name must be between 2 and 100 characters" });
  }
};

const validateDescription = (description, required, errors) => {
  if (description === undefined || description === null) {
    if (required) errors.push({ field: "description", message: "Description is required" });
  } else if (typeof description !== "string" || description.trim() === "") {
    errors.push({ field: "description", message: "Description must be between 5 and 1000 characters" });
  } else if (description.trim().length < 5 || description.trim().length > 1000) {
    errors.push({ field: "description", message: "Description must be between 5 and 1000 characters" });
  }
};

const validateCategory = (category, required, errors) => {
  if (category === undefined || category === null) {
    if (required) errors.push({ field: "category", message: "Category is required" });
  } else if (typeof category !== "string" || category.trim() === "") {
    errors.push({ field: "category", message: "Category must be between 2 and 60 characters" });
  } else if (category.trim().length < 2 || category.trim().length > 60) {
    errors.push({ field: "category", message: "Category must be between 2 and 60 characters" });
  }
};

const validatePrice = (price, required, errors) => {
  if (price === undefined || price === null) {
    if (required) errors.push({ field: "price", message: "Price is required" });
  } else {
    const p = parseFloat(price);
    if (isNaN(p) || p <= 0) {
      errors.push({ field: "price", message: "Price must be greater than 0" });
    }
  }
};

const validateStock = (stock, required, errors) => {
  if (stock === undefined || stock === null) {
    if (required) errors.push({ field: "stock", message: "Stock is required" });
  } else {
    const s = Number(stock);
    if (isNaN(s) || !Number.isInteger(s) || s < 0) {
      errors.push({ field: "stock", message: "Stock must be 0 or greater" });
    }
  }
};

const validateImage = (image, required, errors) => {
  if (image === undefined || image === null) {
    if (required) errors.push({ field: "image", message: "Image is required" });
  } else if (typeof image !== "string" || image.trim() === "") {
    errors.push({ field: "image", message: "Image must be 500 characters or fewer" });
  } else if (image.trim().length > 500) {
    errors.push({ field: "image", message: "Image must be 500 characters or fewer" });
  }
};

const validateRating = (rating, errors) => {
  if (rating !== undefined && rating !== null) {
    const r = parseFloat(rating);
    if (isNaN(r) || r < 0 || r > 5) {
      errors.push({ field: "rating", message: "Rating must be between 0 and 5" });
    }
  }
};

const createProductValidator = (req, res, next) => {
  const errors = [];
  rejectUnknownBodyFields(req, productFields, errors);

  const { name, description, category, price, stock, image, rating } = req.body || {};

  validateName(name, true, errors);
  validateDescription(description, true, errors);
  validateCategory(category, true, errors);
  validatePrice(price, true, errors);
  validateStock(stock, true, errors);
  validateImage(image, true, errors);
  validateRating(rating, errors);

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
    if (description) req.body.description = description.trim();
    if (category) req.body.category = category.trim();
    if (price !== undefined) req.body.price = parseFloat(price);
    if (stock !== undefined) req.body.stock = parseInt(stock, 10);
    if (image) req.body.image = image.trim();
    if (rating !== undefined && rating !== null) req.body.rating = parseFloat(rating);
  }

  next();
};

const putProductValidator = (req, res, next) => {
  if (!checkBodyNotEmpty(req)) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: [{ field: "body", message: "At least one field is required" }],
    });
  }

  const errors = [];
  rejectUnknownBodyFields(req, productFields, errors);

  const { name, description, category, price, stock, image, rating } = req.body;

  validateName(name, true, errors);
  validateDescription(description, true, errors);
  validateCategory(category, true, errors);
  validatePrice(price, true, errors);
  validateStock(stock, true, errors);
  validateImage(image, true, errors);
  validateRating(rating, errors);

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  // Sanitization
  if (name) req.body.name = name.trim();
  if (description) req.body.description = description.trim();
  if (category) req.body.category = category.trim();
  req.body.price = parseFloat(price);
  req.body.stock = parseInt(stock, 10);
  if (image) req.body.image = image.trim();
  if (rating !== undefined && rating !== null) req.body.rating = parseFloat(rating);

  next();
};

const patchProductValidator = (req, res, next) => {
  if (!checkBodyNotEmpty(req)) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: [{ field: "body", message: "At least one field is required" }],
    });
  }

  const errors = [];
  rejectUnknownBodyFields(req, productFields, errors);

  const { name, description, category, price, stock, image, rating } = req.body;

  if (name !== undefined) validateName(name, false, errors);
  if (description !== undefined) validateDescription(description, false, errors);
  if (category !== undefined) validateCategory(category, false, errors);
  if (price !== undefined) validatePrice(price, false, errors);
  if (stock !== undefined) validateStock(stock, false, errors);
  if (image !== undefined) validateImage(image, false, errors);
  if (rating !== undefined) validateRating(rating, errors);

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  // Sanitization
  if (name) req.body.name = name.trim();
  if (description) req.body.description = description.trim();
  if (category) req.body.category = category.trim();
  if (price !== undefined) req.body.price = parseFloat(price);
  if (stock !== undefined) req.body.stock = parseInt(stock, 10);
  if (image) req.body.image = image.trim();
  if (rating !== undefined && rating !== null) req.body.rating = parseFloat(rating);

  next();
};

const productQueryValidator = (req, res, next) => {
  const errors = [];
  const { search, category, minPrice, maxPrice, sort, page, limit } = req.query || {};

  if (search !== undefined) {
    if (typeof search !== "string" || search.trim().length < 1 || search.trim().length > 100) {
      errors.push({ field: "search", message: "Search must be between 1 and 100 characters" });
    }
  }

  if (category !== undefined) {
    if (typeof category !== "string" || category.trim().length < 1 || category.trim().length > 60) {
      errors.push({ field: "category", message: "Category must be between 1 and 60 characters" });
    }
  }

  if (minPrice !== undefined) {
    const p = parseFloat(minPrice);
    if (isNaN(p) || p < 0) {
      errors.push({ field: "minPrice", message: "minPrice must be 0 or greater" });
    }
  }

  if (maxPrice !== undefined) {
    const p = parseFloat(maxPrice);
    if (isNaN(p) || p < 0) {
      errors.push({ field: "maxPrice", message: "maxPrice must be 0 or greater" });
    }
  }

  if (sort !== undefined) {
    const allowedSort = ["price", "-price", "rating", "-rating", "createdAt", "-createdAt"];
    if (!allowedSort.includes(sort)) {
      errors.push({ field: "sort", message: "Sort must be one of price, -price, rating, -rating, createdAt, -createdAt" });
    }
  }

  if (page !== undefined) {
    const p = Number(page);
    if (isNaN(p) || !Number.isInteger(p) || p < 1) {
      errors.push({ field: "page", message: "Page must be a positive integer" });
    }
  }

  if (limit !== undefined) {
    const l = Number(limit);
    if (isNaN(l) || !Number.isInteger(l) || l < 1 || l > 100) {
      errors.push({ field: "limit", message: "Limit must be between 1 and 100" });
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  // Sanitization / Casting
  if (req.query) {
    if (search !== undefined) req.query.search = search.trim();
    if (category !== undefined) req.query.category = category.trim();
    if (minPrice !== undefined) req.query.minPrice = parseFloat(minPrice);
    if (maxPrice !== undefined) req.query.maxPrice = parseFloat(maxPrice);
    if (page !== undefined) req.query.page = parseInt(page, 10);
    if (limit !== undefined) req.query.limit = parseInt(limit, 10);
  }

  next();
};

module.exports = {
  createProductValidator: [createProductValidator],
  putProductValidator: [putProductValidator],
  patchProductValidator: [patchProductValidator],
  productQueryValidator: [productQueryValidator],
};
