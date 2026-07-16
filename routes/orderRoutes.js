const router = require("express").Router();
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const {
  createOrderValidator,
  updateOrderValidator,
} = require("../validators/orderValidator");
const {
  placeOrder,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  getAllOrdersAdmin,
  updateOrderAdmin,
} = require("../controllers/orderController");

// User specific order placement and listing
router.post("/", authMiddleware, roleMiddleware("user"), createOrderValidator, placeOrder);
router.get("/", authMiddleware, roleMiddleware("user"), getOrders);

// Admin-only order management (MUST be placed before /:id)
router.get("/admin", authMiddleware, roleMiddleware("admin"), getAllOrdersAdmin);
router.put("/admin/:id", authMiddleware, roleMiddleware("admin"), updateOrderAdmin);

// Shared endpoints (User owns it or Admin is retrieving/cancelling)
router.get("/:id", authMiddleware, roleMiddleware("user", "admin"), getOrderById);
router.put("/:id", authMiddleware, roleMiddleware("user"), updateOrderValidator, updateOrder);
router.patch("/:id", authMiddleware, roleMiddleware("user"), updateOrderValidator, updateOrder);
router.delete("/:id", authMiddleware, roleMiddleware("user", "admin"), deleteOrder);

module.exports = router;
