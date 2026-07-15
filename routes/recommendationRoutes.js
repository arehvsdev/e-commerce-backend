const router = require("express").Router();
const authMiddleware = require("../middleware/authMiddleware");
const { mongoIdParam } = require("../validators/commonValidator");
const {
  getUserRecommendations,
  getProductRecommendations,
} = require("../controllers/recommendationController");

router.get("/product/:productId", authMiddleware, mongoIdParam("productId"), getProductRecommendations);
router.get("/user/:userId", authMiddleware, mongoIdParam("userId"), getUserRecommendations);

module.exports = router;
