const router = require('express').Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const {
  createProductValidator,
  productQueryValidator,
  putProductValidator,
  patchProductValidator,
} = require('../validators/productValidator');
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  patchProduct,
  bulkCreateProducts,
} = require("../controllers/productController");

router.post('/', authMiddleware, roleMiddleware('admin'), createProductValidator, createProduct);
router.post('/bulk', authMiddleware, roleMiddleware('admin'), bulkCreateProducts);
router.get('/', productQueryValidator, getAllProducts);
router.get("/:id", getProductById);
router.put("/:id", authMiddleware, roleMiddleware('admin'), putProductValidator, updateProduct);
router.patch("/:id", authMiddleware, roleMiddleware('admin'), patchProductValidator, patchProduct);
router.delete("/:id", authMiddleware, roleMiddleware('admin'), deleteProduct);

module.exports = router;
