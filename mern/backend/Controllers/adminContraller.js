const Admin = require("../Model/adminModel");
const bcrypt = require("bcryptjs");

// Get all admins
const getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find();
    if (!admins) {
      return res.status(404).json({ message: "No admins found" });
    }
    return res.status(200).json({ admins });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Add admin
const addAdmin = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    // ===== PASSWORD HASHING (bcrypt) =====
    let hashedPassword = password;
    if (typeof password === 'string' && password.length > 0) {
      const looksHashed = /^\$2[aby]\$/.test(password);
      if (!looksHashed) {
        hashedPassword = await bcrypt.hash(password, 10);
      }
    }
    const admin = new Admin({ name, email, password: hashedPassword });
    await admin.save();
    return res.status(200).json({ admin });
  } catch (err) {
    console.log(err);
    return res.status(400).json({ message: "Unable to add admin" });
  }
};

// Get admin by ID
const getAdminById = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    return res.status(200).json({ admin });
  } catch (err) {
    console.log(err);
  }
};

// Update admin
const updateAdmin = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const update = { name, email };
    if (typeof password === 'string' && password.length > 0) {
      // ===== PASSWORD HASHING (bcrypt) on update =====
      const looksHashed = /^\$2[aby]\$/.test(password);
      update.password = looksHashed ? password : await bcrypt.hash(password, 10);
    }
    let admin = await Admin.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    );
    return res.status(200).json({ admin });
  } catch (err) {
    console.log(err);
    return res.status(400).json({ message: "Unable to update admin" });
  }
};

// Delete admin
const deleteAdmin = async (req, res) => {
  try {
    const admin = await Admin.findByIdAndDelete(req.params.id);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    return res.status(200).json({ admin });
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  getAllAdmins,
  addAdmin,
  getAdminById,
  updateAdmin,
  deleteAdmin
};
