const router = require("express").Router();
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const {
  createCategoryValidator,
  updateCategoryValidator,
} = require("../validators/categoryValidator");
const {
  getCategories,
  createCategory,
  deleteCategory,
  updateCategory,
} = require("../controllers/categoryController");

router.get("/", getCategories);
router.post("/", authMiddleware, roleMiddleware("admin"), createCategoryValidator, createCategory);
router.put("/:id", authMiddleware, roleMiddleware("admin"), updateCategoryValidator, updateCategory);
router.delete("/:id", authMiddleware, roleMiddleware("admin"), deleteCategory);

module.exports = router;
