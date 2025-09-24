const express = require("express");
const router = express.Router();
const upload = require("../helpers/uploadHelper");
const auth = require("../middleware/authMiddleware");

// Models for stats
const User = require("../Model/userModel");
const Equipment = require("../Model/equipmentModel");
const Booking = require("../Model/bookingModel");
const Payment = require("../Model/paymentModel");

//insert model
const Admin = require("../Model/adminModel");

// Import Admin controller
const AdminController = require("../Controllers/adminContraller");

// Route paths
router.get("/", AdminController.getAllAdmins);
router.post("/", AdminController.addAdmin);

// Admin stats: totals for dashboard cards (must be BEFORE ":id" routes)
router.get("/stats", auth, async (req, res) => {
  try {
    // Optional: verify req.user.role === 'admin'
    const [users, products, activeOrders, revenueAgg] = await Promise.all([
      User.countDocuments({}),
      Equipment.countDocuments({}),
      Booking.countDocuments({ status: { $in: ["pending", "confirmed"] } }),
      Payment.aggregate([
        { $match: { status: "paid" } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ])
    ]);

    const revenue = revenueAgg[0]?.total || 0;
    res.json({ users, products, activeOrders, revenue });
  } catch (err) {
    console.error("/admins/stats error", err);
    res.status(500).json({ message: "Failed to load stats" });
  }
});

// Dynamic routes (placed after specific paths)
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
