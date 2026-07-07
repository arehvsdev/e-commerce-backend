const { body, query } = require("express-validator");
const {
  rejectUnknownFields,
  requireBodyFields,
  validateRequest,
} = require("./commonValidator");

const productFields = [
  "name",
  "description",
  "category",
  "price",
  "stock",
  "image",
  "rating",
];

const rejectUnknownProductFields = rejectUnknownFields(productFields);

const productRules = (isUpdate = false) => [
  body("name")
    .if(() => !isUpdate)
    .notEmpty()
    .withMessage("Name is required")
    .bail()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("name")
    .if(() => isUpdate)
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),

  body("description")
    .if(() => !isUpdate)
    .notEmpty()
    .withMessage("Description is required")
    .bail()
    .trim()
    .isLength({ min: 5, max: 1000 })
    .withMessage("Description must be between 5 and 1000 characters"),
  body("description")
    .if(() => isUpdate)
    .optional()
    .trim()
    .isLength({ min: 5, max: 1000 })
    .withMessage("Description must be between 5 and 1000 characters"),

  body("category")
    .if(() => !isUpdate)
    .notEmpty()
    .withMessage("Category is required")
    .bail()
    .trim()
    .isLength({ min: 2, max: 60 })
    .withMessage("Category must be between 2 and 60 characters"),
  body("category")
    .if(() => isUpdate)
    .optional()
    .trim()
    .isLength({ min: 2, max: 60 })
    .withMessage("Category must be between 2 and 60 characters"),

  body("price")
    .if(() => !isUpdate)
    .exists()
    .withMessage("Price is required")
    .bail()
    .isFloat({ gt: 0 })
    .withMessage("Price must be greater than 0")
    .toFloat(),
  body("price")
    .if(() => isUpdate)
    .optional()
    .isFloat({ gt: 0 })
    .withMessage("Price must be greater than 0")
    .toFloat(),

  body("stock")
    .if(() => !isUpdate)
    .exists()
    .withMessage("Stock is required")
    .bail()
    .isInt({ min: 0 })
    .withMessage("Stock must be 0 or greater")
    .toInt(),
  body("stock")
    .if(() => isUpdate)
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock must be 0 or greater")
    .toInt(),

  body("image")
    .if(() => !isUpdate)
    .notEmpty()
    .withMessage("Image is required")
    .bail()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Image must be 500 characters or fewer"),
  body("image")
    .if(() => isUpdate)
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Image must be 500 characters or fewer"),

  body("rating")
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage("Rating must be between 0 and 5")
    .toFloat(),
];

const createProductValidator = [
  rejectUnknownProductFields,
  ...productRules(false),
  validateRequest,
];

const updateProductValidator = [
  rejectUnknownProductFields,
  requireBodyFields(),
  ...productRules(true),
  validateRequest,
];

const productQueryValidator = [
  query("search")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Search must be between 1 and 100 characters"),
  query("category")
    .optional()
    .trim()
    .isLength({ min: 1, max: 60 })
    .withMessage("Category must be between 1 and 60 characters"),
  query("minPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("minPrice must be 0 or greater")
    .toFloat(),
  query("maxPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("maxPrice must be 0 or greater")
    .toFloat(),
  query("sort")
    .optional()
    .isIn(["price", "-price", "rating", "-rating", "createdAt", "-createdAt"])
    .withMessage("Sort must be one of price, -price, rating, -rating, createdAt, -createdAt"),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer")
    .toInt(),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100")
    .toInt(),
  validateRequest,
];

module.exports = {
  createProductValidator,
  updateProductValidator,
  productQueryValidator,
};
