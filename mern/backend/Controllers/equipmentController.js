const Equipment = require("../Model/equipmentModel");

// Helpers
const toBool = (v) => {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') return v.toLowerCase() === 'true';
  return Boolean(v);
};

const toNum = (v) => {
  if (typeof v === 'number') return v;
  if (typeof v === 'string' && v !== '') return Number(v);
  return undefined;
};

// Create equipment
exports.create = async (req, res) => {
  try {
    const { name, description, rentalPrice, quantity, category, available } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : "";

    const equipment = await Equipment.create({
      name,
      description,
      image,
      rentalPrice: toNum(rentalPrice),
      quantity: toNum(quantity),
      category,
      available: toBool(available),
    });
    return res.status(201).json({ equipment });
  } catch (err) {
    console.error("Create equipment error:", err);
    const message = err.message?.includes('validation') ? 'Validation failed' : (err.message || 'Unable to create equipment');
    return res.status(400).json({ message });
  }
};

// List all equipment
exports.list = async (req, res) => {
  try {
    const items = await Equipment.find().sort({ createdAt: -1 });
    return res.status(200).json({ items });
  } catch (err) {
    console.error("List equipment error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get by id
exports.getById = async (req, res) => {
  try {
    const item = await Equipment.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Equipment not found" });
    return res.status(200).json({ item });
  } catch (err) {
    console.error("Get equipment error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Update equipment (supports optional image replacement)
exports.update = async (req, res) => {
  try {
    const { name, description, rentalPrice, quantity, category, available } = req.body;
    const update = {
      name,
      description,
      rentalPrice: toNum(rentalPrice),
      quantity: toNum(quantity),
      category,
      available: typeof available === 'undefined' ? undefined : toBool(available),
    };
    if (req.file) update.image = `/uploads/${req.file.filename}`;

    // Remove undefined fields so they aren't overwritten
    Object.keys(update).forEach((k) => update[k] === undefined && delete update[k]);

    const item = await Equipment.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ message: "Equipment not found" });
    return res.status(200).json({ item });
  } catch (err) {
    console.error("Update equipment error:", err);
    const message = err.message?.includes('validation') ? 'Validation failed' : (err.message || 'Unable to update equipment');
    return res.status(400).json({ message });
  }
};

// Delete equipment
exports.remove = async (req, res) => {
  try {
    const item = await Equipment.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: "Equipment not found" });
    return res.status(200).json({ item });
  } catch (err) {
    console.error("Delete equipment error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
