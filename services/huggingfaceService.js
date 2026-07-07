const { HfInference } = require("@huggingface/inference");
const Order = require("../models/order");
const Product = require("../models/product");
const config = require("../config/index");

const DEFAULT_CONFIDENCE = 0.65;
const FALLBACK_CONFIDENCE = 0.5;

const normalizeProduct = (product) => ({
  id: product._id.toString(),
  name: product.name,
  category: product.category,
  price: product.price,
  rating: product.rating || 0,
});

const buildRecommendationPrompt = (purchasedProducts, availableProducts) => {
  return [
    "You are an ecommerce recommendation engine.",
    "Recommend products from the available products only.",
    "Return strict JSON with this shape:",
    '{"recommendations":[{"productId":"...","reason":"...","confidence":0.85}]}',
    "",
    `Purchased products: ${JSON.stringify(purchasedProducts)}`,
    `Available products: ${JSON.stringify(availableProducts)}`,
  ].join("\n");
};

const parseHuggingFaceResponse = (response, availableProducts) => {
  const generatedText =
    response.generated_text ||
    response[0]?.generated_text ||
    response.choices?.[0]?.message?.content ||
    "";

  const jsonMatch = generatedText.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    return [];
  }

  const parsed = JSON.parse(jsonMatch[0]);
  const availableById = new Map(
    availableProducts.map((product) => [product.id, product])
  );

  const seenIds = new Set();
  const seenNames = new Set();

  return (parsed.recommendations || [])
    .map((recommendation) => {
      const product = availableById.get(String(recommendation.productId));

      if (!product) {
        return null;
      }

      const normalizedName = product.name.trim().toLowerCase();
      if (seenIds.has(product.id) || seenNames.has(normalizedName)) {
        return null;
      }

      seenIds.add(product.id);
      seenNames.add(normalizedName);

      return {
        product,
        reason: recommendation.reason || "Recommended based on your purchase history.",
        confidence:
          typeof recommendation.confidence === "number"
            ? recommendation.confidence
            : DEFAULT_CONFIDENCE,
      };
    })
    .filter(Boolean);
};

const getFallbackRecommendations = (purchasedProducts, availableProducts) => {
  const purchasedCategories = new Set(
    purchasedProducts.map((product) => product.category).filter(Boolean)
  );
  const purchasedIds = new Set(purchasedProducts.map((product) => product.id));
  const purchasedNames = new Set(
    purchasedProducts.map((product) => product.name.trim().toLowerCase())
  );

  const candidateProducts = availableProducts.filter(
    (product) =>
      !purchasedIds.has(product.id) && !purchasedNames.has(product.name.trim().toLowerCase())
  );

  const categoryMatches = candidateProducts.filter(
    (product) => purchasedCategories.has(product.category)
  );

  const sourceProducts = categoryMatches.length > 0 ? categoryMatches : candidateProducts;

  // Sort candidates so we keep the highest-rated & lowest-priced versions during de-duplication
  const sortedProducts = [...sourceProducts].sort(
    (a, b) => b.rating - a.rating || a.price - b.price
  );

  const uniqueProducts = [];
  const seenNames = new Set();

  for (const product of sortedProducts) {
    const normalizedName = product.name.trim().toLowerCase();
    if (!seenNames.has(normalizedName)) {
      seenNames.add(normalizedName);
      uniqueProducts.push(product);
    }
  }

  const fallbackProducts = uniqueProducts.slice(0, 5);

  return fallbackProducts.map((product) => ({
    product,
    reason: purchasedCategories.has(product.category)
      ? `Recommended because you purchased products in ${product.category}.`
      : "Recommended as a highly rated available product.",
    confidence: FALLBACK_CONFIDENCE,
  }));
};

const getRecommendations = async (userId) => {
  const [orders, products] = await Promise.all([
    Order.find({ user: userId })
      .populate("product", "name category price rating")
      .lean(),
    Product.find({ stock: { $gt: 0 } })
      .select("name category price rating")
      .sort({ rating: -1, createdAt: -1 })
      .limit(100)
      .lean(),
  ]);

  const purchasedProducts = orders
    .map((order) => order.product)
    .filter(Boolean)
    .map(normalizeProduct);
  const purchasedIds = new Set(purchasedProducts.map((product) => product.id));
  const availableProducts = products
    .map(normalizeProduct)
    .filter((product) => !purchasedIds.has(product.id));

  if (availableProducts.length === 0) {
    return {
      recommendedProducts: [],
      source: "fallback",
      reason: "No available products found.",
    };
  }

  const fallbackRecommendations = getFallbackRecommendations(
    purchasedProducts,
    availableProducts
  );

  if (!config.HUGGINGFACE_API_KEY) {
    return {
      recommendedProducts: fallbackRecommendations,
      source: "fallback",
      reason: "Hugging Face API key is not configured.",
    };
  }

  try {
    const hf = new HfInference(config.HUGGINGFACE_API_KEY);
    const prompt = buildRecommendationPrompt(purchasedProducts, availableProducts);
    const response = await hf.textGeneration({
      model: config.HUGGINGFACE_MODEL,
      inputs: prompt,
      parameters: {
        max_new_tokens: 300,
        temperature: 0.3,
        return_full_text: false,
      },
    });
    const aiRecommendations = parseHuggingFaceResponse(
      response,
      availableProducts
    );

    if (aiRecommendations.length === 0) {
      return {
        recommendedProducts: fallbackRecommendations,
        source: "fallback",
        reason: "Hugging Face returned no usable recommendations.",
      };
    }

    return {
      recommendedProducts: aiRecommendations,
      source: "huggingface",
      reason: "Recommendations generated by Hugging Face.",
    };
  } catch (error) {
    return {
      recommendedProducts: fallbackRecommendations,
      source: "fallback",
      reason: "Hugging Face request failed. Returned category-based recommendations.",
    };
  }
};

module.exports = {
  getRecommendations,
};
