const Staff = require("../Model/staffModel");

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
    const staff = new Staff({ name, phoneno, nicNo, email, password });
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
    let staff = await Staff.findByIdAndUpdate(req.params.id, { name, phoneno, nicNo, email, password });
    staff = await staff.save();
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
