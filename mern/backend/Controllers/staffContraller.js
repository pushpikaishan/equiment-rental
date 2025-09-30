const Staff = require("../Model/staffModel");
const bcrypt = require("bcryptjs");

// Get all staff
const getAllStaff = async (req, res) => {
  try {
    const staff = await Staff.find();
    if (!staff) {
      return res.status(404).json({ message: "No staff found" });
    }
    return res.status(200).json({ staff });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Add staff
const addStaff = async (req, res) => {
  const { name, phoneno, nicNo, email, password } = req.body;
  try {
    // ===== PASSWORD HASHING (bcrypt) =====
    let hashedPassword = password;
    if (typeof password === 'string' && password.length > 0) {
      const looksHashed = /^\$2[aby]\$/.test(password);
      if (!looksHashed) {
        hashedPassword = await bcrypt.hash(password, 10);
      }
    }
    const staff = new Staff({ name, phoneno, nicNo, email, password: hashedPassword });
    await staff.save();
    return res.status(200).json({ staff });
  } catch (err) {
    console.log(err);
    return res.status(400).json({ message: "Unable to add staff" });
  }
};

// Get by ID
const getStaffById = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }
    return res.status(200).json({ staff });
  } catch (err) {
    console.log(err);
  }
};

// Update staff
const updateStaff = async (req, res) => {
  const { name, phoneno, nicNo, email, password } = req.body;
  try {
    const update = { name, phoneno, nicNo, email };
    if (typeof password === 'string' && password.length > 0) {
      // ===== PASSWORD HASHING (bcrypt) on update =====
      const looksHashed = /^\$2[aby]\$/.test(password);
      update.password = looksHashed ? password : await bcrypt.hash(password, 10);
    }
    const staff = await Staff.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    );
    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }
    return res.status(200).json({ staff });
  } catch (err) {
    console.log(err);
    return res.status(400).json({ message: "Unable to update staff" });
  }
};

// Delete staff
const deleteStaff = async (req, res) => {
  try {
    const staff = await Staff.findByIdAndDelete(req.params.id);
    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }
    return res.status(200).json({ staff });
  } catch (err) {
    console.log(err);
  }
};

exports.getAllStaff = getAllStaff;
exports.addStaff = addStaff;
exports.getStaffById = getStaffById;
exports.updateStaff = updateStaff;
exports.deleteStaff = deleteStaff;
