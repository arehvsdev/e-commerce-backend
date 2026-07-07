const mongoose = require("mongoose");
const Order = require("../models/order");
const Product = require("../models/product");

const placeOrder = async (req, res) => {
    try {
        const { productId, quantity, paymentMethod } = req.body;

        if (!productId || !quantity || !paymentMethod) {
            return res.status(400).json({ error: "productId, quantity, and paymentMethod are required." });
        }

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ error: "Invalid product ID." });
        }

        if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity <= 0) {
            return res.status(400).json({ error: "Quantity must be a positive integer." });
        }

        const validPaymentMethods = ["credit_card", "paypal", "cash_on_delivery"];
        if (!validPaymentMethods.includes(paymentMethod)) {
            return res.status(400).json({ error: "Invalid payment method." });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ error: "Product not found." });
        }

        if (product.stock < quantity) {
            return res.status(400).json({ error: "Insufficient stock available." });
        }

        product.stock -= quantity;
        await product.save();

        const totalAmount = product.price * quantity;
        const order = new Order({
            user: req.user.id,
            product: productId,
            quantity,
            totalAmount,
            paymentMethod,
        });

        await order.save();

        res.status(201).json({
            message: "Order placed successfully.",
            order,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal server error." });
    }
};

const getOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.id }).populate("product", "name price");
        res.status(200).json(orders);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal server error." });
    }
};

const updateOrder = async (req, res) => {
    try {
        const orderId = req.params.id;
        const { quantity, paymentMethod, status } = req.body;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ error: "Order not found." });
        }

        if (order.user.toString() !== req.user.id) {
            return res.status(403).json({ error: "Not authorized to update this order." });
        }

        const product = await Product.findById(order.product);
        if (!product) {
            return res.status(404).json({ error: "Associated product not found." });
        }

        if (quantity !== undefined) {
            if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity <= 0) {
                return res.status(400).json({ error: "Quantity must be a positive integer." });
            }

            const stockDifference = quantity - order.quantity;
            if (stockDifference > 0 && product.stock < stockDifference) {
                return res.status(400).json({ error: "Insufficient stock available." });
            }

            product.stock -= stockDifference;
            order.quantity = quantity;
            order.totalAmount = product.price * quantity;
        }

        if (paymentMethod !== undefined) {
            const validPaymentMethods = ["credit_card", "paypal", "cash_on_delivery"];
            if (!validPaymentMethods.includes(paymentMethod)) {
                return res.status(400).json({ error: "Invalid payment method." });
            }
            order.paymentMethod = paymentMethod;
        }

        if (status !== undefined) {
            const validStatuses = ["pending", "shipped", "delivered"];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({ error: "Invalid status." });
            }
            order.status = status;
        }

        await product.save();
        await order.save();

        res.status(200).json({
            message: "Order updated successfully.",
            order,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal server error." });
    }
};

const deleteOrder = async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ error: "Order not found." });
        }

        if (order.user.toString() !== req.user.id) {
            return res.status(403).json({ error: "Not authorized to delete this order." });
        }

        const product = await Product.findById(order.product);
        if (product) {
            product.stock += order.quantity;
            await product.save();
        }

        await order.deleteOne();

        res.status(200).json({ message: "Order deleted successfully." });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal server error." });
    }
};

module.exports = {
    placeOrder,
    getOrders,
    updateOrder,
    deleteOrder,
};
