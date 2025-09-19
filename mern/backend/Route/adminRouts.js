const express = require("express");
const router = express.Router();
const upload = require("../helpers/uploadHelper");

//insert model
const Admin = require("../Model/adminModel");

// Import Admin controller
const AdminController = require("../Controllers/adminContraller");

// Route paths
router.get("/", AdminController.getAllAdmins);
router.post("/", AdminController.addAdmin);
router.get("/:id", AdminController.getAdminById);
router.put("/:id", AdminController.updateAdmin);
router.delete("/:id", AdminController.deleteAdmin);

// Profile image upload (Admin only)
router.post("/:id/upload", upload.single("profileImage"), async (req, res) => {
  try {
    const admin = await Admin.findByIdAndUpdate(
      req.params.id,
      { profileImage: `/uploads/${req.file.filename}` },
      { new: true }
    );
    res.status(200).json({ message: "Admin profile picture updated", user: admin });
  } catch (err) {
    res.status(500).json({ message: "Error uploading admin image" });
  }
});

// Export router
module.exports = router;
