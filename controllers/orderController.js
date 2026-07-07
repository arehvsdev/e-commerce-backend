const Order = require("../models/order");
const Product = require("../models/product");
const { sendSuccess } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/appError");

const populateProduct = "name price";

// User placing an order
const placeOrder = asyncHandler(async (req, res) => {
  const { productId, quantity, paymentMethod } = req.body;

  // Atomically check stock and decrement
  const product = await Product.findOneAndUpdate(
    { _id: productId, stock: { $gte: quantity } },
    { $inc: { stock: -quantity } },
    { returnDocument: 'after' }
  );

  if (!product) {
    // Check if product exists at all to return correct error status
    const exists = await Product.findById(productId);
    if (!exists) {
      throw new AppError("Product not found", 404);
    }
    throw new AppError("Insufficient stock available", 400);
  }

  const order = await Order.create({
    user: req.user.id,
    product: productId,
    quantity,
    totalAmount: product.price * quantity,
    paymentMethod,
  });

  await order.populate("product", populateProduct);

  return sendSuccess(res, 201, "Order placed successfully", { order });
});

// User listing their own orders
const getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user.id })
    .populate("product", populateProduct)
    .sort({ createdAt: -1 })
    .lean();

  return sendSuccess(res, 200, "Orders fetched successfully", { orders });
});

// Fetch a single order (User must own it, Admin can view any)
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("product", populateProduct)
    .lean();

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  const isAdmin = req.user.role === "admin";
  const isOwner = order.user.toString() === req.user.id;

  if (!isOwner && !isAdmin) {
    throw new AppError("Not authorized to view this order", 403);
  }

  return sendSuccess(res, 200, "Order fetched successfully", { order });
});

// User updating their own order (quantity or payment method only, while pending)
const updateOrder = asyncHandler(async (req, res) => {
  const { quantity, paymentMethod, status } = req.body;

  if (status !== undefined) {
    throw new AppError("Not authorized to update order status. Status updates are admin-only.", 403);
  }

  const order = await Order.findById(req.params.id);

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  if (order.user.toString() !== req.user.id) {
    throw new AppError("Not authorized to update this order", 403);
  }

  if (order.status !== "pending") {
    throw new AppError(`Cannot update order because it is already ${order.status}`, 400);
  }

  if (quantity !== undefined) {
    const stockDifference = quantity - order.quantity;

    if (stockDifference > 0) {
      // Need more stock. Deduct atomically.
      const product = await Product.findOneAndUpdate(
        { _id: order.product, stock: { $gte: stockDifference } },
        { $inc: { stock: -stockDifference } },
        { returnDocument: 'after' }
      );
      if (!product) {
        throw new AppError("Insufficient stock available for the updated quantity", 400);
      }
      order.quantity = quantity;
      order.totalAmount = product.price * quantity;
    } else if (stockDifference < 0) {
      // Returning stock. Increment atomically.
      const product = await Product.findByIdAndUpdate(
        order.product,
        { $inc: { stock: -stockDifference } }, // stockDifference is negative, so -stockDifference is positive
        { returnDocument: 'after' }
      );
      order.quantity = quantity;
      order.totalAmount = product.price * quantity;
    }
  }

  if (paymentMethod !== undefined) {
    order.paymentMethod = paymentMethod;
  }

  await order.save();
  await order.populate("product", populateProduct);

  return sendSuccess(res, 200, "Order updated successfully", { order });
});

// Delete/Cancel an order (User can cancel own pending orders; Admin can cancel any)
const deleteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  const isAdmin = req.user.role === "admin";
  const isOwner = order.user.toString() === req.user.id;

  if (!isOwner && !isAdmin) {
    throw new AppError("Not authorized to delete this order", 403);
  }

  if (!isAdmin && order.status !== "pending") {
    throw new AppError(`Cannot cancel order because it is already ${order.status}`, 400);
  }

  // Restore stock atomically
  await Product.findByIdAndUpdate(order.product, {
    $inc: { stock: order.quantity },
  });

  await order.deleteOne();

  return sendSuccess(res, 200, "Order cancelled and deleted successfully");
});

// Admin ONLY: Get all orders
const getAllOrdersAdmin = asyncHandler(async (req, res) => {
  const orders = await Order.find()
    .populate("user", "name email")
    .populate("product", populateProduct)
    .sort({ createdAt: -1 })
    .lean();

  return sendSuccess(res, 200, "All orders fetched successfully", { orders });
});

// Admin ONLY: Update order status
const updateOrderAdmin = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  if (status !== undefined) {
    order.status = status;
  }

  await order.save();
  await order.populate("product", populateProduct);

  return sendSuccess(res, 200, "Order status updated successfully by admin", { order });
});

module.exports = {
  placeOrder,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  getAllOrdersAdmin,
  updateOrderAdmin,
};
