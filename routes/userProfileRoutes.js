const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
    healthCheck,
    getProfile,
    updateProfile,
    deleteProfile,
} = require('../controllers/userController');

router.get("/healthcheck", healthCheck);
router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile);
router.delete("/profile", authMiddleware, deleteProfile);

module.exports = router;