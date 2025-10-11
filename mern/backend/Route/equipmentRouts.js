const express = require("express");
const router = express.Router();
const upload = require("../helpers/uploadHelper");
const EquipmentController = require("../Controllers/equipmentController");
const auth = require("../middleware/authMiddleware");

// Simple admin-only guard assuming req.user.role is set by auth middleware
const adminOnly = (req, res, next) => {
	if (!req.user || req.user.role !== "admin") {
		return res.status(403).json({ message: "Admin access required" });
	}
	next();
};

// List all equipment
router.get("/", EquipmentController.list);

// Create equipment with image
router.post("/", auth, adminOnly, upload.single("image"), EquipmentController.create);

// Read one
router.get("/:id", EquipmentController.getById);

// Update (optionally replace image)
router.put("/:id", auth, adminOnly, upload.single("image"), EquipmentController.update);

// Delete
router.delete("/:id", auth, adminOnly, EquipmentController.remove);

// Restock multiple items (admin only)
router.post("/restock", auth, adminOnly, EquipmentController.restock);

module.exports = router;
