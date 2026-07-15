const Order = require("../models/order");
const Product = require("../models/product");

const populateProduct = "name price";

const placeOrder = async (req, res) => {
  try {
    const { productId, quantity, paymentMethod } = req.body;

    const product = await Product.findOneAndUpdate(
      { _id: productId, stock: { $gte: quantity } },
      { $inc: { stock: -quantity } },
      { returnDocument: "after" }
    );

    if (!product) {
      const exists = await Product.findById(productId);
      if (!exists) {
        return res.status(404).json({ success: false, message: "Product not found" });
      }
      return res.status(400).json({ success: false, message: "Insufficient stock available" });
    }

    const order = await Order.create({
      user: req.user.id,
      product: productId,
      quantity,
      totalAmount: product.price * quantity,
      paymentMethod,
    });

    await order.populate("product", populateProduct);

    return res.status(201).json({ success: true, data: { order } });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate("product", populateProduct)
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ success: true, data: { orders } });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("product", populateProduct).lean();

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const isAdmin = req.user.role === "admin";
    const isOwner = order.user.toString() === req.user.id;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "Not authorized to view this order" });
    }

    return res.status(200).json({ success: true, data: { order } });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateOrder = async (req, res) => {
  try {
    const { quantity, paymentMethod, status } = req.body;

    if (status !== undefined) {
      return res.status(403).json({ success: false, message: "Not authorized to update order status. Status updates are admin-only." });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized to update this order" });
    }

    if (order.status !== "pending") {
      return res.status(400).json({ success: false, message: `Cannot update order because it is already ${order.status}` });
    }

    if (quantity !== undefined) {
      const stockDifference = quantity - order.quantity;

      if (stockDifference > 0) {
        const product = await Product.findOneAndUpdate(
          { _id: order.product, stock: { $gte: stockDifference } },
          { $inc: { stock: -stockDifference } },
          { returnDocument: "after" }
        );
        if (!product) {
          return res.status(400).json({ success: false, message: "Insufficient stock available for the updated quantity" });
        }
        order.quantity = quantity;
        order.totalAmount = product.price * quantity;
      } else if (stockDifference < 0) {
        const product = await Product.findByIdAndUpdate(
          order.product,
          { $inc: { stock: -stockDifference } },
          { returnDocument: "after" }
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

    return res.status(200).json({ success: true, data: { order } });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const isAdmin = req.user.role === "admin";
    const isOwner = order.user.toString() === req.user.id;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this order" });
    }

    if (!isAdmin && order.status !== "pending") {
      return res.status(400).json({ success: false, message: `Cannot cancel order because it is already ${order.status}` });
    }

    await Product.findByIdAndUpdate(order.product, {
      $inc: { stock: order.quantity },
    });

    await order.deleteOne();

    return res.status(200).json({ success: true, data: { message: "Order cancelled and deleted successfully" } });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getAllOrdersAdmin = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .populate("product", populateProduct)
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ success: true, data: { orders } });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateOrderAdmin = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (status !== undefined) {
      order.status = status;
    }

    await order.save();
    await order.populate("product", populateProduct);

    return res.status(200).json({ success: true, data: { order } });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  placeOrder,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  getAllOrdersAdmin,
  updateOrderAdmin,
};
