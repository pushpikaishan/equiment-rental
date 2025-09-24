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
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const LOW_STOCK_THRESHOLD = 5; // configurable threshold

    const oneYearAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const [users, products, activeOrders, revenueAgg, monthlyAgg, refundCount, lowStock, monthlySeriesAgg, dailySeriesAgg] = await Promise.all([
      User.countDocuments({}),
      Equipment.countDocuments({}),
      Booking.countDocuments({ status: { $in: ["pending", "confirmed"] } }),
      Payment.aggregate([
        { $match: { status: "paid" } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      Payment.aggregate([
        { $match: { status: { $in: ["paid", "partial_refunded"] }, createdAt: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      Payment.countDocuments({ status: { $in: ["refunded", "partial_refunded"] } }),
      Equipment.find({ quantity: { $gte: 0, $lte: LOW_STOCK_THRESHOLD } }),
      Payment.aggregate([
        { $match: { status: { $in: ["paid", "partial_refunded"] }, createdAt: { $gte: oneYearAgo } } },
        { $group: { _id: { y: { $year: "$createdAt" }, m: { $month: "$createdAt" } }, total: { $sum: "$amount" } } },
        { $sort: { "_id.y": 1, "_id.m": 1 } }
      ]),
      Payment.aggregate([
        { $match: { status: { $in: ["paid", "partial_refunded"] }, createdAt: { $gte: monthStart, $lt: nextMonthStart } } },
        { $group: { _id: { y: { $year: "$createdAt" }, m: { $month: "$createdAt" }, d: { $dayOfMonth: "$createdAt" } }, total: { $sum: "$amount" } } },
        { $sort: { "_id.y": 1, "_id.m": 1, "_id.d": 1 } }
      ])
    ]);

    const revenue = revenueAgg[0]?.total || 0;
    const monthlyRevenue = monthlyAgg[0]?.total || 0;
    // Map low stock items with minimal fields
    const lowStockItems = (lowStock || []).map(it => ({
      _id: it._id,
      name: it.name,
      quantity: it.quantity,
      category: it.category
    }));
    // Normalize monthly series to last 12 months with zeros where missing
    const seriesMap = new Map();
    for (const row of monthlySeriesAgg) {
      const y = row._id?.y, m = row._id?.m;
      if (typeof y === 'number' && typeof m === 'number') {
        seriesMap.set(`${y}-${String(m).padStart(2,'0')}`, Number(row.total) || 0);
      }
    }
    const monthlySeries = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      monthlySeries.push({
        key,
        label: d.toLocaleString(undefined, { month: 'short' }),
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        value: seriesMap.get(key) || 0,
      });
    }

    // Daily series for current month (zero-filled)
    const dailyMap = new Map();
    for (const row of dailySeriesAgg) {
      const d = row._id?.d;
      if (typeof d === 'number') dailyMap.set(d, Number(row.total) || 0);
    }
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dailySeries = [];
    for (let d = 1; d <= daysInMonth; d++) {
      dailySeries.push({
        day: d,
        label: String(d),
        value: dailyMap.get(d) || 0,
      });
    }

    res.json({ users, products, activeOrders, revenue, monthlyRevenue, refundCount, lowStock: lowStockItems, monthlySeries, dailySeries });
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
