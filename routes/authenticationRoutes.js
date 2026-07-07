const express = require('express');
const router = express.Router();

const {
  healthCheck,
  registerUser,
  loginUser
} = require("../controllers/authenticationController");
const {
  registerValidator,
  loginValidator
} = require("../validators/authValidator");

router.get("/healthCheck", healthCheck);
router.post("/register", registerValidator, registerUser);
router.post("/login", loginValidator, loginUser);

module.exports = router;
