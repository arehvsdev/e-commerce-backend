const { getRecommendations } = require("../services/huggingfaceService");
const { sendSuccess } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/appError");

const getUserRecommendations = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const isOwnRequest = req.user.id === userId;
  const isAdmin = req.user.role === "admin";

  if (!isOwnRequest && !isAdmin) {
    throw new AppError("Not authorized to view these recommendations", 403);
  }

  const recommendations = await getRecommendations(userId);

  return sendSuccess(res, 200, "Recommendations fetched successfully", {
    recommendedProducts: recommendations.recommendedProducts,
    source: recommendations.source,
    reason: recommendations.reason,
  });
});

module.exports = {
  getUserRecommendations,
};
