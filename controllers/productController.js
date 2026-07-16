const mongoose = require("mongoose");
const Product = require("../models/product");
const Category = require("../models/category");

const allowedProductFields = [
  "name",
  "description",
  "category",
  "price",
  "stock",
  "image",
  "rating",
  "sku",
];
const allowedSortFields = ["price", "rating", "createdAt"];

const formatProductObj = (product) => {
  if (!product) return null;
  return {
    ...product,
    id: product._id,
    category: product.category && typeof product.category === 'object'
      ? product.category.name
      : product.category,
  };
};

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
    const fields = pickProductFields(req.body);
    if (fields.category) {
      const catDoc = await Category.findOne({ name: fields.category.trim() });
      if (catDoc) {
        fields.category = catDoc._id;
      } else {
        return res.status(400).json({ success: false, message: `Category "${fields.category}" does not exist. Please create it first.` });
      }
    }

    const product = await Product.create({
      ...fields,
      createdBy: req.user.id,
    });

    const populated = await Product.findById(product._id).populate("category").lean();
    return res.status(201).json({
      success: true,
      data: { product: formatProductObj(populated) },
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
      const catDoc = await Category.findOne({ name: category.trim() });
      if (catDoc) {
        filter.category = catDoc._id;
      } else {
        filter.category = new mongoose.Types.ObjectId();
      }
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
        .populate("category")
        .sort(sortOption)
        .skip(skip)
        .limit(pageSize)
        .lean(),
      Product.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalProducts / pageSize) || 1;
    const formattedProducts = products.map(formatProductObj);

    return res.status(200).json({
      success: true,
      data: {
        currentPage,
        totalPages,
        totalProducts,
        products: formattedProducts,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("category").lean();

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    return res.status(200).json({ success: true, data: { product: formatProductObj(product) } });
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

    const fields = pickProductFields(req.body);
    if (fields.category) {
      const catDoc = await Category.findOne({ name: fields.category.trim() });
      if (catDoc) {
        fields.category = catDoc._id;
      } else {
        return res.status(400).json({ success: false, message: `Category "${fields.category}" does not exist.` });
      }
    }

    Object.assign(product, fields);
    await product.save();

    const populated = await Product.findById(product._id).populate("category").lean();
    return res.status(200).json({ success: true, data: { product: formatProductObj(populated) } });
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

const bulkCreateProducts = async (req, res) => {
  try {
    const productsArray = req.body;
    if (!Array.isArray(productsArray)) {
      return res.status(400).json({ success: false, message: "Invalid payload: expected an array of products" });
    }

    const createdProducts = [];
    for (const item of productsArray) {
      const imagePath = item.image_url || item.image;
      if (!item.name || !item.description || !item.category || item.price === undefined || item.stock === undefined || !imagePath) {
        return res.status(400).json({
          success: false,
          message: `Product validation failed for item "${item.name || "Unnamed"}". Name, description, category, price, stock, and image are required.`,
        });
      }

      const catDoc = await Category.findOne({ name: item.category.trim() });
      if (!catDoc) {
        return res.status(400).json({
          success: false,
          message: `Category "${item.category}" does not exist. Please create it first.`,
        });
      }

      const product = await Product.create({
        name: item.name.trim(),
        description: item.description.trim(),
        category: catDoc._id,
        price: parseFloat(item.price),
        stock: parseInt(item.stock, 10),
        image: imagePath.trim(),
        rating: item.rating ? parseFloat(item.rating) : 4.0,
        sku: item.sku ? item.sku.trim() : "",
        createdBy: req.user.id,
      });

      const populated = await Product.findById(product._id).populate("category").lean();
      createdProducts.push(formatProductObj(populated));
    }

    return res.status(201).json({
      success: true,
      message: `Successfully imported ${createdProducts.length} products`,
      data: { products: createdProducts },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error during bulk insert", error: error.message });
  }
};

module.exports = {
  createProduct,
  updateProduct,
  deleteProduct,
  patchProduct,
  getAllProducts,
  getProductById,
  bulkCreateProducts,
};
