const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const {
    createUserValidator,
    updateProfileValidator,
    putProfileValidator,
    patchProfileValidator,
    adminUpdateUserValidator,
} = require('../validators/userValidator');
const {
    healthCheck,
    createUser,
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    getProfile,
    updateProfile,
    deleteProfile,
    changePassword,
} = require('../controllers/userController');

router.get("/healthcheck", healthCheck);
router.post("/", authMiddleware, roleMiddleware("admin"), createUserValidator, createUser);
router.get("/", authMiddleware, roleMiddleware("admin"), getUsers);
router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, putProfileValidator, updateProfile);
router.patch("/profile", authMiddleware, patchProfileValidator, updateProfile);
router.patch("/profile/password", authMiddleware, changePassword);
router.delete("/profile", authMiddleware, deleteProfile);
router.get("/:id", authMiddleware, roleMiddleware("admin"), getUserById);
router.put("/:id", authMiddleware, roleMiddleware("admin"), adminUpdateUserValidator, updateUser);
router.patch("/:id", authMiddleware, roleMiddleware("admin"), adminUpdateUserValidator, updateUser);
router.delete("/:id", authMiddleware, roleMiddleware("admin"), deleteUser);

module.exports = router;
