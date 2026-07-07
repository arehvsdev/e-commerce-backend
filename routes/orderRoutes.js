const router = require("express").Router();
const authMiddleware = require("../middleware/authMiddleware");
const { placeOrder, getOrders, updateOrder, deleteOrder } = require("../controllers/orderController");

router.post("/", authMiddleware, placeOrder);
router.get("/", authMiddleware, getOrders);
router.put("/:id", authMiddleware, updateOrder);
router.delete("/:id", authMiddleware, deleteOrder);

module.exports = router;
