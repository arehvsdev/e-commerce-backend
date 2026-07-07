const express = require('express');
const router = express.Router();

const {
  healthCheck,
  registerUser,
  loginUser
} = require("../controllers/authenticationController");

router.get("/healthCheck", healthCheck);
router.post("/register", registerUser);
router.post("/login", loginUser);

module.exports = router;