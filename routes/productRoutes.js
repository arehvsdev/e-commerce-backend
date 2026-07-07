const router = require('express').Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { mongoIdParam } = require('../validators/commonValidator');
const {
  createProductValidator,
  productQueryValidator,
  updateProductValidator
} = require('../validators/productValidator');
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  patchProduct
} = require("../controllers/productController");

router.post('/', authMiddleware, roleMiddleware('admin'), createProductValidator, createProduct);
router.get('/', productQueryValidator, getAllProducts);
router.get("/:id", mongoIdParam("id"), getProductById);
router.put("/:id", authMiddleware, roleMiddleware('admin'), mongoIdParam("id"), updateProductValidator, updateProduct);
router.patch("/:id", authMiddleware, roleMiddleware('admin'), mongoIdParam("id"), updateProductValidator, patchProduct);
router.delete("/:id", authMiddleware, roleMiddleware('admin'), mongoIdParam("id"), deleteProduct);


module.exports = router;
