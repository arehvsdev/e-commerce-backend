const Product = require("../models/product");
const { getRecommendations } = require("../services/huggingfaceService");

const getUserRecommendations = async (req, res) => {
  try {
    const { userId } = req.params;
    const isOwnRequest = req.user.id === userId;
    const isAdmin = req.user.role === "admin";

    if (!isOwnRequest && !isAdmin) {
      return res.status(403).json({ success: false, message: "Not authorized to view these recommendations" });
    }

    const recommendationsResult = await getRecommendations(userId);

    return res.status(200).json({
      success: true,
      data: recommendationsResult,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getProductRecommendations = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const recommendedProducts = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
    })
      .limit(4)
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        recommendedProducts,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  getUserRecommendations,
  getProductRecommendations,
};
