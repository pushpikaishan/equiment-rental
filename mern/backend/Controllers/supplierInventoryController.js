const SupplierInventory = require('../Model/supplierInventoryModel');

function ensureSupplier(req, res) {
  const role = req.user?.role;
  const ok = role === 'supplier';
  if (!ok) res.status(403).json({ message: 'Supplier only' });
  return ok;
}

// POST /supplier-inventories
exports.create = async (req, res) => {
  try {
    if (!ensureSupplier(req, res)) return;
    const { name, description = '', category = 'General', district = '', location = '', rentalPrice, quantity, available = true, specs } = req.body;
    if (!name || !rentalPrice || !quantity) {
      return res.status(400).json({ message: 'name, rentalPrice, and quantity are required' });
    }
    const price = Number(rentalPrice);
    const qty = Number(quantity);
    if (!(price > 0)) return res.status(400).json({ message: 'Rental price must be greater than 0' });
    if (!(qty >= 1)) return res.status(400).json({ message: 'Quantity must be at least 1' });

    const image = req.file?.filename ? `/uploads/${req.file.filename}` : (req.body.image || '');

    const item = await SupplierInventory.create({
      supplierId: req.user.id,
      name,
      description,
      category,
      district,
      location,
      rentalPrice: price,
      quantity: qty,
      available: !!available,
      image,
      specs,
    });
    res.status(201).json({ item });
  } catch (e) {
    console.error('SupplierInventory create error:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /supplier-inventories/mine
exports.getMine = async (req, res) => {
  try {
    if (!ensureSupplier(req, res)) return;
    const items = await SupplierInventory.find({ supplierId: req.user.id }).sort({ createdAt: -1 });
    res.json({ items });
  } catch (e) {
    console.error('SupplierInventory getMine error:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /supplier-inventories/:id
exports.update = async (req, res) => {
  try {
    if (!ensureSupplier(req, res)) return;
    const { id } = req.params;
    const item = await SupplierInventory.findById(id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    if (String(item.supplierId) !== String(req.user.id)) return res.status(403).json({ message: 'Forbidden' });

    const { name, description, category, district, location, rentalPrice, quantity, available, specs } = req.body;
    if (typeof name === 'string' && name.trim()) item.name = name.trim();
    if (typeof description === 'string') item.description = description;
    if (typeof category === 'string' && category) item.category = category;
    if (typeof district === 'string') item.district = district;
    if (typeof location === 'string') item.location = location;
    if (typeof rentalPrice !== 'undefined') {
      const price = Number(rentalPrice);
      if (!(price > 0)) return res.status(400).json({ message: 'Rental price must be greater than 0' });
      item.rentalPrice = price;
    }
    if (typeof quantity !== 'undefined') {
      const qty = Number(quantity);
      if (!(qty >= 1)) return res.status(400).json({ message: 'Quantity must be at least 1' });
      item.quantity = qty;
    }
    if (typeof available === 'boolean') item.available = available;
    if (typeof specs !== 'undefined') item.specs = specs;

    // image
    if (req.file?.filename) {
      item.image = `/uploads/${req.file.filename}`;
    } else if (typeof req.body.image === 'string') {
      item.image = req.body.image; // allow clearing or external path
    }

    await item.save();
    res.json({ item });
  } catch (e) {
    console.error('SupplierInventory update error:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /supplier-inventories/:id
exports.remove = async (req, res) => {
  try {
    if (!ensureSupplier(req, res)) return;
    const { id } = req.params;
    const item = await SupplierInventory.findById(id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    if (String(item.supplierId) !== String(req.user.id)) return res.status(403).json({ message: 'Forbidden' });
    await item.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (e) {
    console.error('SupplierInventory remove error:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /supplier-inventories/public
exports.publicList = async (req, res) => {
  try {
    const { q = '', category = '', district = '', available = 'true' } = req.query || {};
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit || '12', 10)));
    const filter = {};
    if (available === 'true') filter.available = true;
    if (category) filter.category = category;
    if (district) filter.district = district;
    if (q) {
      filter.$or = [
        { name: new RegExp(q, 'i') },
        { description: new RegExp(q, 'i') },
        { category: new RegExp(q, 'i') },
      ];
    }
    const total = await SupplierInventory.countDocuments(filter);
    const items = await SupplierInventory.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    res.json({ items, total, page, limit });
  } catch (e) {
    console.error('SupplierInventory publicList error:', e);
    res.status(500).json({ message: 'Server error' });
  }
};
