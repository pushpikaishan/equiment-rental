const express = require("express");
const router = express.Router();
const upload = require("../helpers/uploadHelper");

//insert model
const Staff = require("../Model/staffModel");

// Import Staff controller
const StaffController = require("../Controllers/staffContraller");

// Route paths
router.get("/", StaffController.getAllStaff);
router.post("/", StaffController.addStaff);
router.get("/:id", StaffController.getStaffById);
router.put("/:id", StaffController.updateStaff);
router.delete("/:id", StaffController.deleteStaff);


// Staff profile picture upload
router.post("/:id/upload", upload.single("profileImage"), async (req, res) => {
  try {
    const staff = await Staff.findByIdAndUpdate(
      req.params.id,
      { profileImage: `/uploads/${req.file.filename}` },
      { new: true }
    );
    res.status(200).json({ message: "Staff profile picture updated", user: staff });
  } catch (err) {
    res.status(500).json({ message: "Error uploading staff image" });
  }
});


// Export router
module.exports = router;
