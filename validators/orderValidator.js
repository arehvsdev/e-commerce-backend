const { body } = require("express-validator");
const {
  rejectUnknownFields,
  requireBodyFields,
  validateRequest,
} = require("./commonValidator");

const paymentMethods = ["credit_card", "paypal", "cash_on_delivery"];
const orderStatuses = ["pending", "shipped", "delivered"];
const orderFields = ["productId", "quantity", "paymentMethod", "status"];
const rejectUnknownOrderFields = rejectUnknownFields(orderFields);

const createOrderValidator = [
  rejectUnknownOrderFields,
  body("productId").isMongoId().withMessage("Valid productId is required"),
  body("quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be a positive integer")
    .toInt(),
  body("paymentMethod")
    .isIn(paymentMethods)
    .withMessage("Invalid payment method"),
  body("status").not().exists().withMessage("Status cannot be set when placing an order"),
  validateRequest,
];

const updateOrderValidator = [
  rejectUnknownOrderFields,
  requireBodyFields(),
  body("productId").not().exists().withMessage("Product cannot be changed"),
  body("quantity")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Quantity must be a positive integer")
    .toInt(),
  body("paymentMethod")
    .optional()
    .isIn(paymentMethods)
    .withMessage("Invalid payment method"),
  body("status")
    .optional()
    .isIn(orderStatuses)
    .withMessage("Invalid status"),
  validateRequest,
];

module.exports = {
  createOrderValidator,
  updateOrderValidator,
};
