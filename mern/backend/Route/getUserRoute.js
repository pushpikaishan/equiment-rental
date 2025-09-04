const express = require("express");
const router = express.Router();
const User = require("../Model/userModel");
const Admin = require("../Model/adminModel");
const Staff = require("../Model/staffModel");
const Supplier = require("../Model/supplierModel");

// GET /users/:id → fetch full info by ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    let user =
      (await User.findById(id)) ||
      (await Admin.findById(id)) ||
      (await Staff.findById(id)) ||
      (await Supplier.findById(id));

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      nic: user.nic || user.nicNo || null,
      phoneno: user.phoneno || user.phone || null,
      district: user.district || null,
      role: user.role,
      companyName: user.companyName || null, // for supplier
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
