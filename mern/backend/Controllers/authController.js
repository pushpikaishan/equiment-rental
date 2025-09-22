const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../Model/userModel");
const Supplier = require("../Model/supplierModel");
const Admin = require("../Model/adminModel");
const Staff = require("../Model/staffModel");

// Generate JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" } // extend token lifetime to reduce frequent expirations
  );
};

// Login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  // Check if fields are empty
  if (!email || !password) {
    return res.status(400).json({ msg: "Email and password are required" });
  }

  try {
    // Trim email to remove spaces
    const trimmedEmail = String(email).trim();

    // Find account in all collections
    let account =
      (await User.findOne({ email: trimmedEmail })) ||
      (await Supplier.findOne({ email: trimmedEmail })) ||
      (await Admin.findOne({ email: trimmedEmail })) ||
      (await Staff.findOne({ email: trimmedEmail }));

    // Validate account existence and password (support bcrypt hash or plain text)
    if (!account) {
      return res.status(401).json({ msg: "Invalid credentials" });
    }

    let isValid = false;
    const stored = String(account.password || "");
    try {
      if (/^\$2[aby]\$/.test(stored)) {
        // bcrypt hash
        isValid = await bcrypt.compare(password, stored);
      } else {
        // plain-text fallback
        isValid = stored === password;
      }
    } catch (e) {
      isValid = false;
    }

    if (!isValid) {
      return res.status(401).json({ msg: "Invalid credentials" });
    }

    const token = generateToken(account);

    res.json({
      token,
      role: account.role,
      user: {
        id: account._id,
        name: account.name,
        email: account.email,
        role: account.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).send("Server error");
  }
};

// Get profile
exports.getProfile = async (req, res) => {
  try {
    let account;
    switch (req.user.role) {
      case "user":
        account = await User.findById(req.user.id).select("-password");
        break;
      case "supplier":
        account = await Supplier.findById(req.user.id).select("-password");
        break;
      case "admin":
        account = await Admin.findById(req.user.id).select("-password");
        break;
      case "staff":
        account = await Staff.findById(req.user.id).select("-password");
        break;
      default:
        return res.status(400).json({ msg: "Invalid role" });
    }
    if (!account) {
      return res.status(404).json({ msg: "Account not found" });
    }
    res.json(account);
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).send("Server error");
  }
};
