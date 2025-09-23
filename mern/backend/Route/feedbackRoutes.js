const express = require("express");
const router = express.Router();
const feedbackController = require("../Controllers/feedbackController");
const auth = require("../middleware/authMiddleware");

// Public
router.get("/", feedbackController.list);

// Authenticated
router.get("/my", auth, feedbackController.my);
router.post("/", auth, feedbackController.create);
router.put("/:id", auth, feedbackController.update);
router.delete("/:id", auth, feedbackController.remove);

module.exports = router;
