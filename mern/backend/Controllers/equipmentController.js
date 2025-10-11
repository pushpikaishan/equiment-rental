const Equipment = require("../Model/equipmentModel");
const Admin = require("../Model/adminModel");
const { sendMail } = require("../helpers/emailHelper");

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

// POST /equipment/restock
// body: { items: [{ id, qty }], wholesaler?: { id, name } }
// Admin-only endpoint to increment equipment quantities; flips available=true if stock becomes > 0
exports.restock = async (req, res) => {
  try {
    const { items, wholesaler } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'No items to restock' });
    }

    const ids = items.map(i => i.id).filter(Boolean);
    const docs = await Equipment.find({ _id: { $in: ids } });
    if (docs.length !== ids.length) {
      return res.status(400).json({ message: 'One or more items not found' });
    }

    const updated = [];
    const lines = [];
    for (const it of items) {
      const add = Number(it.qty || 0);
      if (!(add > 0)) continue;
      const doc = await Equipment.findOneAndUpdate(
        { _id: it.id },
        { $inc: { quantity: add } },
        { new: true }
      );
      if (!doc) continue;
      // If quantity now > 0 and was unavailable, re-enable availability
      if (Number(doc.quantity) > 0 && doc.available === false) {
        try { await Equipment.findByIdAndUpdate(doc._id, { $set: { available: true } }, { new: false }); } catch {}
      }
      updated.push({ id: String(doc._id), quantity: doc.quantity });
      const prevQty = Math.max(0, Number(doc.quantity) - add);
      lines.push(`• ${doc.name} — added ${add}, new qty ${doc.quantity} (was ${prevQty})`);
    }

    // Fire-and-forget email to admin with summary (best-effort)
    try {
      const adminDoc = req.user?.id ? await Admin.findById(req.user.id).select('email name') : null;
      const to = (adminDoc && adminDoc.email) || process.env.ADMIN_EMAIL || process.env.SMTP_USER;
      if (to && lines.length > 0) {
        const when = new Date().toLocaleString();
        const w = wholesaler || {};
        const subject = `Restock Order — ${w.name || 'Wholesaler'} (${when})`;
        const text = [
          `A restock order has been processed by ${adminDoc?.name || 'an admin'} on ${when}.`,
          '',
          `Wholesaler: ${w.name || 'N/A'}${w.id ? ` (ID: ${w.id})` : ''}`,
          '',
          'Items:',
          ...lines,
        ].join('\n');
        await sendMail({ to, subject, text });
      }
    } catch (e) {
      console.error('restock email send error:', e?.message || e);
    }

    return res.json({ updated, wholesaler: wholesaler || null });
  } catch (err) {
    console.error('Equipment restock error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
