const express = require("express");
const { login, getProfile, requestPasswordReset, resetPasswordWithCode, testEmail, checkEmailExists } = require("../Controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/login", login);
router.get("/profile", authMiddleware, getProfile);
router.post("/forgot-password", requestPasswordReset);
router.post("/reset-password", resetPasswordWithCode);
router.post("/check-email", checkEmailExists);

// Optional dev-only endpoint to verify SMTP setup
if (String(process.env.ENABLE_TEST_EMAIL || '').toLowerCase() === 'true') {
	router.post("/test-email", testEmail);
}

module.exports = router;
