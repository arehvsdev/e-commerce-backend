const router = require("express").Router();
const authMiddleware = require("../middleware/authMiddleware");
const { mongoIdParam } = require("../validators/commonValidator");
const {
  getUserRecommendations,
} = require("../controllers/recommendationController");

router.get("/:userId", authMiddleware, mongoIdParam("userId"), getUserRecommendations);

module.exports = router;
