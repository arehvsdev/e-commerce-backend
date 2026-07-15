const router = require("express").Router();
const authMiddleware = require("../middleware/authMiddleware");
const { mongoIdParam } = require("../validators/commonValidator");
const {
  getUserRecommendations,
  getProductRecommendations,
} = require("../controllers/recommendationController");

router.get("/analytics/recommendations/:productId", authMiddleware, mongoIdParam("productId"), getProductRecommendations);
router.get("/:userId", authMiddleware, mongoIdParam("userId"), getUserRecommendations);

module.exports = router;
