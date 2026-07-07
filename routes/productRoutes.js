const router = require('express').Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const productValidator = require('../validators/productValidator');
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  patchProduct
} = require("../controllers/productController");

router.post('/', authMiddleware, roleMiddleware('admin'),productValidator, createProduct);
router.get('/', authMiddleware, getAllProducts);
router.get("/:id", authMiddleware, getProductById);
router.put("/:id", authMiddleware, roleMiddleware('admin'), productValidator, updateProduct);
router.patch("/:id", authMiddleware, roleMiddleware('admin'), productValidator, patchProduct);


module.exports = router;