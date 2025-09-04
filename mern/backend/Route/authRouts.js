const express = require("express");
const router = express.Router();
const User = require("../Model/userModel");
const Admin = require("../Model/adminModel");
const Staff = require("../Model/staffModel");
const Supplier = require("../Model/supplierModel");

// POST /auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    let user =
      (await User.findOne({ email, password })) ||
      (await Admin.findOne({ email, password })) ||
      (await Staff.findOne({ email, password })) ||
      (await Supplier.findOne({ email, password }));

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Return ID and role only
    res.json({
      id: user._id,
      role: user.role,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
