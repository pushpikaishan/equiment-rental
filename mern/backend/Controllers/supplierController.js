const Supplier = require("../Model/supplierModel");
const bcrypt = require("bcryptjs");

// Get all suppliers
const getAllSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find();
    if (!suppliers) {
      return res.status(404).json({ message: "No suppliers found" });
    }
    return res.status(200).json({ suppliers });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Add supplier
const addSupplier = async (req, res) => {
  const { companyName, name, email, phone, district, password } = req.body;
  try {
    // ===== PASSWORD HASHING (bcrypt) =====
    // Hash plain-text password before saving supplier
    let hashedPassword = password;
    if (typeof password === 'string' && password.length > 0) {
      const looksHashed = /^\$2[aby]\$/.test(password);
      if (!looksHashed) {
        hashedPassword = await bcrypt.hash(password, 10);
      }
    }

    const supplier = new Supplier({
      companyName,
      name,
      email,
      phone,
      district,
      password: hashedPassword,
    });
    await supplier.save();
    return res.status(200).json({ supplier });
  } catch (err) {
    console.log(err);
    return res.status(400).json({ message: "Unable to add supplier" });
  }
};

// Get supplier by ID
const getSupplierById = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }
    return res.status(200).json({ supplier });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Update supplier
const updateSupplier = async (req, res) => {
  const { companyName, name, phone, district, email, password } = req.body;
  try {
    const update = { companyName, name, phone, district, email };
    if (typeof password === 'string' && password.length > 0) {
      // ===== PASSWORD HASHING (bcrypt) on update =====
      const looksHashed = /^\$2[aby]\$/.test(password);
      update.password = looksHashed ? password : await bcrypt.hash(password, 10);
    }
    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    );
    return res.status(200).json({ supplier });
  } catch (err) {
    console.log(err);
    return res.status(400).json({ message: "Unable to update supplier" });
  }
};

// Delete supplier
const deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndDelete(req.params.id);
    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }
    return res.status(200).json({ supplier });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getAllSuppliers = getAllSuppliers;
exports.addSupplier = addSupplier;
exports.getSupplierById = getSupplierById;
exports.updateSupplier = updateSupplier;
exports.deleteSupplier = deleteSupplier;
