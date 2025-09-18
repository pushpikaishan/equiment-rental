const Admin = require("../Model/adminModel");

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
    const admin = new Admin({ name, email, password });
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
    let admin = await Admin.findByIdAndUpdate(
      req.params.id,
      { name, email, password },
      { new: true } // returns the updated document
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
