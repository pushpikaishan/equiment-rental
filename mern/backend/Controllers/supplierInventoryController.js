const SupplierInventory = require('../Model/supplierInventoryModel');
const ActivityLog = require('../Model/activityLogModel');

function ensureSupplier(req, res) {
  const role = req.user?.role;
  const ok = role === 'supplier';
  if (!ok) res.status(403).json({ message: 'Supplier only' });
  return ok;
}

function ensureAdmin(req, res) {
  const role = req.user?.role;
  const ok = role === 'admin' || role === 'staff';
  if (!ok) res.status(403).json({ message: 'Admin/Staff only' });
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
    // New listings require ad fee before becoming publicly visible
    const AD_FEE = 1000;
    res.status(201).json({
      item,
      requiresAdFee: true,
      adFeeAmount: AD_FEE,
      currency: 'LKR'
    });
  } catch (e) {
    console.error('SupplierInventory create error:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /supplier-inventories/updates/mine
// List admin updates (e.g., activate/deactivate with reasons) for the supplier
exports.updatesList = async (req, res) => {
  try {
    if (!ensureSupplier(req, res)) return;
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit || '10', 10)));
    const supplierIdStr = String(req.user.id);
    let supplierIdObj = null;
    try { const m = require('mongoose'); if (m.Types.ObjectId.isValid(supplierIdStr)) supplierIdObj = new m.Types.ObjectId(supplierIdStr); } catch (_) {}
    const q = {
      action: 'admin.supplierInventory.update',
      $or: [
        { 'meta.supplierId': supplierIdStr },
        ...(supplierIdObj ? [{ 'meta.supplierId': supplierIdObj }] : [])
      ]
    };
    const total = await ActivityLog.countDocuments(q);
    const items = await ActivityLog.find(q).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean();
    const notices = items.map(it => ({
      id: String(it._id),
      at: it.createdAt,
      inventoryId: it.meta?.inventoryId || '',
      name: it.meta?.name || '',
      reason: it.meta?.reason || '',
      updates: it.meta?.updates || {}
    }));
    res.json({ items: notices, total, page, limit });
  } catch (e) {
    console.error('SupplierInventory updatesList error:', e);
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

    // Auto-deactivate ad if expired
    if (item.adActive && item.adExpiresAt && new Date(item.adExpiresAt).getTime() < Date.now()) {
      item.adActive = false;
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
    const now = new Date();
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
    // Only show ad-active and non-expired items publicly
    filter.adActive = true;
    filter.adExpiresAt = { $gt: now };
    const total = await SupplierInventory.countDocuments(filter);
    const items = await SupplierInventory.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    // Attach remainingDays
    const decorated = items.map(it => {
      const rem = it.adExpiresAt ? Math.ceil((new Date(it.adExpiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;
      return Object.assign(it, { remainingDays: Math.max(0, rem) });
    });
    res.json({ items: decorated, total, page, limit });
  } catch (e) {
    console.error('SupplierInventory publicList error:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /supplier-inventories/:id/renew
exports.renewInfo = async (req, res) => {
  try {
    if (!ensureSupplier(req, res)) return;
    const { id } = req.params;
    const it = await SupplierInventory.findById(id);
    if (!it) return res.status(404).json({ message: 'Item not found' });
    if (String(it.supplierId) !== String(req.user.id)) return res.status(403).json({ message: 'Forbidden' });
    const now = Date.now();
    const remaining = it.adExpiresAt ? Math.max(0, Math.ceil((new Date(it.adExpiresAt).getTime() - now) / (1000 * 60 * 60 * 24))) : 0;
    res.json({
      adActive: !!it.adActive,
      adExpiresAt: it.adExpiresAt,
      remainingDays: remaining,
      requiresAdFee: !it.adActive || remaining === 0,
      adFeeAmount: 1000,
      currency: 'LKR'
    });
  } catch (e) {
    console.error('SupplierInventory renewInfo error:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============== Admin endpoints ==============
// GET /supplier-inventories/admin
exports.adminList = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const { q = '', category = '', district = '', adStatus = 'all' } = req.query || {};
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit || '12', 10)));
    const now = new Date();

    const filter = {};
    if (q) {
      filter.$or = [
        { name: new RegExp(q, 'i') },
        { description: new RegExp(q, 'i') },
        { category: new RegExp(q, 'i') },
      ];
    }
    if (category) filter.category = category;
    if (district) filter.district = district;

    if (adStatus === 'active') {
      filter.adActive = true;
      filter.adExpiresAt = { $gt: now };
    } else if (adStatus === 'inactive') {
      filter.$or = [ { adActive: { $ne: true } }, { adExpiresAt: { $lte: now } } ];
    } else if (adStatus === 'expired') {
      filter.adActive = true;
      filter.adExpiresAt = { $lte: now };
    }

    const total = await SupplierInventory.countDocuments(filter);
    const items = await SupplierInventory.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('supplierId', 'companyName name email phone district role')
      .lean();

    const decorated = items.map(it => {
      const exp = it.adExpiresAt ? new Date(it.adExpiresAt) : null;
      const remaining = exp ? Math.max(0, Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0;
      const expired = exp ? exp.getTime() <= now.getTime() : true;
      return Object.assign(it, { remainingDays: remaining, expired });
    });
    res.json({ items: decorated, total, page, limit });
  } catch (e) {
    console.error('SupplierInventory adminList error:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /supplier-inventories/admin/:id
exports.adminUpdate = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const { id } = req.params;
    const { updates = {}, reason = '' } = req.body || {};
    if (!reason || String(reason).trim().length < 3) return res.status(400).json({ message: 'Reason is required (min 3 chars)' });

    const item = await SupplierInventory.findById(id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    const allowed = ['name','description','category','district','location','rentalPrice','quantity','available','adActive'];
    const changes = {};
    for (const k of allowed) {
      if (Object.prototype.hasOwnProperty.call(updates, k)) {
        changes[k] = updates[k];
      }
    }
    if (typeof changes.rentalPrice !== 'undefined') {
      const price = Number(changes.rentalPrice);
      if (!(price > 0)) return res.status(400).json({ message: 'Rental price must be greater than 0' });
      item.rentalPrice = price;
      delete changes.rentalPrice;
    }
    if (typeof changes.quantity !== 'undefined') {
      const qty = Number(changes.quantity);
      if (!(qty >= 1)) return res.status(400).json({ message: 'Quantity must be at least 1' });
      item.quantity = qty;
      delete changes.quantity;
    }
    if (typeof changes.available === 'boolean') {
      item.available = changes.available;
      delete changes.available;
    }
    if (typeof changes.name === 'string' && changes.name.trim()) { item.name = changes.name.trim(); delete changes.name; }
    if (typeof changes.description === 'string') { item.description = changes.description; delete changes.description; }
    if (typeof changes.category === 'string' && changes.category) { item.category = changes.category; delete changes.category; }
    if (typeof changes.district === 'string') { item.district = changes.district; delete changes.district; }
    if (typeof changes.location === 'string') { item.location = changes.location; delete changes.location; }

    // Handle adActive override
    if (Object.prototype.hasOwnProperty.call(updates, 'adActive')) {
      const desired = !!updates.adActive;
      const now = new Date();
      if (desired) {
        // If expired or missing, grant a 30-day window as an admin override
        if (!item.adExpiresAt || new Date(item.adExpiresAt).getTime() <= now.getTime()) {
          const monthFromNow = new Date(now.getTime());
          monthFromNow.setMonth(monthFromNow.getMonth() + 1);
          item.adExpiresAt = monthFromNow;
          item.adPaidAt = now;
          item.adRenewals = (Number(item.adRenewals || 0) + 1);
        }
        item.adActive = true;
      } else {
        item.adActive = false;
      }
    }

    await item.save();

    // Log admin action
    try {
      await ActivityLog.create({
        userId: req.user.id,
        role: req.user.role,
        email: req.user.email || '',
        action: 'admin.supplierInventory.update',
        status: 'success',
        ip: req.ip,
        userAgent: req.headers['user-agent'] || '',
        meta: { inventoryId: item._id, supplierId: item.supplierId, reason, updates }
      });
    } catch (_) { /* ignore log errors */ }

    res.json({ item });
  } catch (e) {
    console.error('SupplierInventory adminUpdate error:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /supplier-inventories/admin/:id
exports.adminRemove = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const { id } = req.params;
    const { reason = '' } = req.body || {};
    if (!reason || String(reason).trim().length < 3) return res.status(400).json({ message: 'Reason is required (min 3 chars)' });
    const item = await SupplierInventory.findById(id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    await item.deleteOne();
    try {
      await ActivityLog.create({
        userId: req.user.id,
        role: req.user.role,
        email: req.user.email || '',
        action: 'admin.supplierInventory.delete',
        status: 'success',
        ip: req.ip,
        userAgent: req.headers['user-agent'] || '',
        meta: { inventoryId: id, supplierId: item.supplierId, reason, name: item.name || '' }
      });
    } catch (_) { /* ignore log errors */ }
    res.json({ message: 'Deleted' });
  } catch (e) {
    console.error('SupplierInventory adminRemove error:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /supplier-inventories/deletions/mine
// List recent admin deletions targeting the current supplier with reasons
exports.deletionsList = async (req, res) => {
  try {
    if (!ensureSupplier(req, res)) return;
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit || '10', 10)));
    // Match supplierId stored either as ObjectId or string in activity meta
    const supplierIdStr = String(req.user.id);
    let supplierIdObj = null;
    try { const m = require('mongoose'); if (m.Types.ObjectId.isValid(supplierIdStr)) supplierIdObj = new m.Types.ObjectId(supplierIdStr); } catch (_) {}
    const q = {
      action: 'admin.supplierInventory.delete',
      $or: [
        { 'meta.supplierId': supplierIdStr },
        ...(supplierIdObj ? [{ 'meta.supplierId': supplierIdObj }] : [])
      ]
    };
    const total = await ActivityLog.countDocuments(q);
    const items = await ActivityLog.find(q).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean();
    // Map to a compact payload for frontend
    const notices = items.map(it => ({
      id: String(it._id),
      at: it.createdAt,
      inventoryId: it.meta?.inventoryId || '',
      name: it.meta?.name || '',
      reason: it.meta?.reason || ''
    }));
    res.json({ items: notices, total, page, limit });
  } catch (e) {
    console.error('SupplierInventory deletionsList error:', e);
    res.status(500).json({ message: 'Server error' });
  }
};
