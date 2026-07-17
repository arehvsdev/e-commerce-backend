const express = require('express');
const router = express.Router();

const {
  healthCheck,
  registerUser,
  loginUser,
  checkEmail,
  resetPassword,
} = require("../controllers/authenticationController");
const {
  registerValidator,
  loginValidator,
  checkEmailValidator,
  resetPasswordValidator,
} = require("../validators/authValidator");

router.get("/healthCheck", healthCheck);
router.post("/register", registerValidator, registerUser);
router.post("/login", loginValidator, loginUser);
router.post("/check-email", checkEmailValidator, checkEmail);
router.post("/reset-password", resetPasswordValidator, resetPassword);

module.exports = router;
