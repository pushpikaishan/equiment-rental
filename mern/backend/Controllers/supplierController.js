const Supplier = require("../Model/supplierModel");

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
    const supplier = new Supplier({
      companyName,
      name,
      email,
      phone,
      district,
      password,
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
  const { companyName, name, phone, district, email } = req.body;
  try {
    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      { companyName, name, phone, district, email },
      { new: true } // returns updated document
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
