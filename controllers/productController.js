const Product = require("../models/product");

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
  const updates = {};

  allowedProductFields.forEach((field) => {
    if (body[field] !== undefined) {
      updates[field] = body[field];
    }
  });

  return updates;
};

const createProduct = async (req, res) => {
  try {
    const product = await Product.create({
      ...pickProductFields(req.body),
      createdBy: req.user.id,
    });

    return res.status(201).json({
      success: true,
      data: { product },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getAllProducts = async (req, res) => {
  try {
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
      return res.status(400).json({ success: false, message: "minPrice cannot be greater than maxPrice" });
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

    const totalPages = Math.ceil(totalProducts / pageSize) || 1;

    return res.status(200).json({
      success: true,
      data: {
        currentPage,
        totalPages,
        totalProducts,
        products,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    return res.status(200).json({ success: true, data: { product } });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    Object.assign(product, pickProductFields(req.body));
    await product.save();

    return res.status(200).json({ success: true, data: { product } });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    await product.deleteOne();

    return res.status(200).json({ success: true, data: { message: "Product deleted successfully" } });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const patchProduct = updateProduct;

module.exports = {
  createProduct,
  updateProduct,
  deleteProduct,
  patchProduct,
  getAllProducts,
  getProductById,
};
