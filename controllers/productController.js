const Product = require("../models/product");
const { sendSuccess } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/appError");

const allowedProductFields = [
  "name",
  "description",
  "category",
  "price",
  "stock",
  "image",
  "rating",
];
const allowedSortFields = ["price", "rating", "createdAt"];

const pickProductFields = (body) => {
  return allowedProductFields.reduce((updates, field) => {
    if (body[field] !== undefined) {
      updates[field] = body[field];
    }

    return updates;
  }, {});
};

const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create({
    ...pickProductFields(req.body),
    createdBy: req.user.id,
  });

  return sendSuccess(res, 201, "Product created successfully", { product });
});

const getAllProducts = asyncHandler(async (req, res) => {
  const {
    search,
    category,
    minPrice,
    maxPrice,
    sort = "-createdAt",
    page = 1,
    limit = 10,
  } = req.query;
  const filter = {};
  const currentPage = Number(page);
  const pageSize = Number(limit);
  const skip = (currentPage - 1) * pageSize;

  if (search) {
    const escapedSearch = search.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    filter.$or = [
      { name: { $regex: escapedSearch, $options: "i" } },
      { description: { $regex: escapedSearch, $options: "i" } },
    ];
  }

  if (category) {
    filter.category = category.trim();
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};

    if (minPrice !== undefined) {
      filter.price.$gte = Number(minPrice);
    }

    if (maxPrice !== undefined) {
      filter.price.$lte = Number(maxPrice);
    }
  }

  if (
    filter.price &&
    filter.price.$gte !== undefined &&
    filter.price.$lte !== undefined &&
    filter.price.$gte > filter.price.$lte
  ) {
    throw new AppError("minPrice cannot be greater than maxPrice", 400);
  }

  const sortDirection = sort.startsWith("-") ? -1 : 1;
  const sortField = sort.replace("-", "");
  const sortOption = allowedSortFields.includes(sortField)
    ? { [sortField]: sortDirection }
    : { createdAt: -1 };

  const [products, totalProducts] = await Promise.all([
    Product.find(filter)
      .select("name description category price stock image rating createdBy createdAt")
      .sort(sortOption)
      .skip(skip)
      .limit(pageSize)
      .lean(),
    Product.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalProducts / pageSize);

  return sendSuccess(res, 200, "Products fetched successfully", {
    currentPage,
    totalPages,
    totalProducts,
    products,
  });
});

const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).lean();

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  return sendSuccess(res, 200, "Product fetched successfully", { product });
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  Object.assign(product, pickProductFields(req.body));
  await product.save();

  return sendSuccess(res, 200, "Product updated successfully", { product });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  await product.deleteOne();

  return sendSuccess(res, 200, "Product deleted successfully");
});

const patchProduct = updateProduct;

module.exports = {
  createProduct,
  updateProduct,
  deleteProduct,
  patchProduct,
  getAllProducts,
  getProductById,
};
