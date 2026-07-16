const router = require("express").Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  getUserRecommendations,
  getProductRecommendations,
} = require("../controllers/recommendationController");

router.get("/product/:productId", authMiddleware, getProductRecommendations);
router.get("/user/:userId", authMiddleware, getUserRecommendations);

module.exports = router;
