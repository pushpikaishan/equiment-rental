const SupplierRequest = require('../Model/supplierRequestModel');
const SupplierInventory = require('../Model/supplierInventoryModel');
const { sendMail } = require('../helpers/emailHelper');

function ensureUser(req, res) {
  const role = req.user?.role;
  const ok = role === 'user' || role === 'supplier' || role === 'staff' || role === 'admin';
  if (!ok) res.status(401).json({ message: 'Unauthorized' });
  return ok;
}

function ensureSupplier(req, res) {
  const role = req.user?.role;
  const ok = role === 'supplier';
  if (!ok) res.status(403).json({ message: 'Supplier only' });
  return ok;
}

// POST /supplier-requests - create one request per supplier grouping
// body: { bookingDate, returnDate, items: [{ inventoryId, qty }], customerName, customerEmail, customerPhone, deliveryAddress, notes }
exports.create = async (req, res) => {
  try {
    if (!ensureUser(req, res)) return;
    const { bookingDate, returnDate, items, customerName, customerEmail, customerPhone, deliveryAddress, notes } = req.body || {};
    if (!bookingDate || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'bookingDate and items required' });
    }
    if (!customerName || !customerEmail || !customerPhone || !deliveryAddress) {
      return res.status(400).json({ message: 'Customer details and address are required' });
    }
    const bd = new Date(bookingDate);
    if (isNaN(bd.getTime())) return res.status(400).json({ message: 'Invalid bookingDate' });
    let rd;
    if (returnDate) {
      rd = new Date(returnDate);
      if (isNaN(rd.getTime())) return res.status(400).json({ message: 'Invalid returnDate' });
      if (rd.getTime() < bd.getTime()) return res.status(400).json({ message: 'returnDate must be on or after bookingDate' });
    }

    // Load all inventory items, group by supplier
    const invIds = items.map(i => i.inventoryId).filter(Boolean);
    const invDocs = await SupplierInventory.find({ _id: { $in: invIds } });
    if (invDocs.length !== invIds.length) return res.status(400).json({ message: 'One or more inventory items not found' });

    const bySupplier = new Map();
    for (const i of items) {
      const doc = invDocs.find(d => String(d._id) === String(i.inventoryId));
      if (!doc) continue;
      const qty = Number(i.qty || 0);
      if (!(qty >= 1)) return res.status(400).json({ message: `Invalid quantity for ${doc.name}` });
      if (doc.available === false || (Number(doc.quantity) || 0) < qty) {
        return res.status(400).json({ message: `Insufficient stock for ${doc.name}` });
      }
      const key = String(doc.supplierId);
      if (!bySupplier.has(key)) bySupplier.set(key, []);
      bySupplier.get(key).push({ doc, qty });
    }

    // For each supplier group, atomically decrement stock and create a request
    const created = [];
    for (const [supplierId, arr] of bySupplier.entries()) {
      const snapItems = [];
      const decs = [];
      try {
        for (const { doc, qty } of arr) {
          const updated = await SupplierInventory.findOneAndUpdate(
            { _id: doc._id, quantity: { $gte: qty }, available: { $ne: false } },
            { $inc: { quantity: -qty } },
            { new: true }
          );
          if (!updated) throw new Error(`Insufficient stock for ${doc.name}`);
          if (Number(updated.quantity) === 0 && updated.available !== false) {
            try { await SupplierInventory.findByIdAndUpdate(updated._id, { $set: { available: false } }, { new: false }); } catch {}
          }
          decs.push({ id: doc._id, qty });
          snapItems.push({ inventoryId: doc._id, name: doc.name, pricePerDay: Number(doc.rentalPrice) || 0, qty });
        }

        const reqDoc = await SupplierRequest.create({
          supplierId,
          userId: req.user.id,
          bookingDate: bd,
          returnDate: rd,
          items: snapItems,
          customerName,
          customerEmail,
          customerPhone,
          deliveryAddress,
          notes: notes || '',
          status: 'pending',
        });
        created.push(reqDoc);
      } catch (e) {
        // rollback supplier decrements for this supplier group
        for (const d of decs) {
          try { await SupplierInventory.findByIdAndUpdate(d.id, { $inc: { quantity: d.qty } }, { new: false }); } catch {}
        }
        throw e; // bubble up
      }
    }

    res.status(201).json({ requests: created });
  } catch (e) {
    console.error('Create supplier request error:', e);
    res.status(500).json({ message: e.message || 'Server error' });
  }
};

// GET /supplier-requests/mine - for supplier to view incoming requests
exports.getMine = async (req, res) => {
  try {
    if (!ensureSupplier(req, res)) return;
    const list = await SupplierRequest.find({ supplierId: req.user.id }).sort({ createdAt: -1 });
    res.json({ items: list });
  } catch (e) {
    console.error('Get supplier requests error:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /supplier-requests/:id/status { status: 'accepted'|'rejected'|'cancelled' }
exports.updateStatus = async (req, res) => {
  try {
    if (!ensureSupplier(req, res)) return;
    const { id } = req.params;
    const { status } = req.body || {};
    if (!['accepted', 'rejected', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const doc = await SupplierRequest.findById(id);
    if (!doc) return res.status(404).json({ message: 'Request not found' });
    if (String(doc.supplierId) !== String(req.user.id)) return res.status(403).json({ message: 'Forbidden' });

    // If cancelling a previously accepted reservation, optionally restore stock
    // For simplicity: on rejected or cancelled from pending, restore quantities
    if (doc.status === 'pending' && (status === 'rejected' || status === 'cancelled')) {
      for (const it of doc.items || []) {
        try { await SupplierInventory.findByIdAndUpdate(it.inventoryId, { $inc: { quantity: Number(it.qty) || 0 } }, { new: false }); } catch {}
      }
    }
    doc.status = status;
    await doc.save();

    // Notify customer about decision
    try {
      const subject = status === 'accepted' ? 'Your supplier request was accepted' : 'Your supplier request was declined';
      const lines = [
        `Hello ${doc.customerName},`,
        '',
        status === 'accepted' ? 'Good news! Your request has been accepted by the supplier.' : 'We are sorry. Your request was declined by the supplier.',
        `Request ID: ${doc._id}`,
        `Status: ${doc.status}`,
        '',
        'Thank you for using Equipment Rental.'
      ];
      await sendMail({ to: doc.customerEmail, subject, text: lines.join('\n') });
    } catch (e) { console.warn('Email notify (status) failed:', e.message); }
    res.json({ item: doc });
  } catch (e) {
    console.error('Update supplier request status error:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /supplier-requests/:id/progress { status: 'ready'|'shipped'|'returned'|'completed' }
exports.updateProgress = async (req, res) => {
  try {
    if (!ensureSupplier(req, res)) return;
    const { id } = req.params;
    const { status } = req.body || {};
    const allowed = ['ready', 'shipped', 'returned', 'completed'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid progress status' });
    }
    const doc = await SupplierRequest.findById(id);
    if (!doc) return res.status(404).json({ message: 'Request not found' });
    if (String(doc.supplierId) !== String(req.user.id)) return res.status(403).json({ message: 'Forbidden' });
    if (doc.status !== 'accepted') return res.status(400).json({ message: 'Only accepted requests can be progressed' });

  const order = { new: 0, ready: 1, shipped: 2, returned: 3, completed: 4 };
  const current = doc.fulfillmentStatus || 'new';
    if (order[status] < order[current]) {
      return res.status(400).json({ message: `Cannot move progress backward from ${current} to ${status}` });
    }
  const prevStatus = current;
  doc.fulfillmentStatus = status;
  await doc.save();

    // Notify customer ONLY when shipped (suppress emails for ready/returned/completed)
    if (status === 'shipped') {
      try {
        const subject = 'The order is shipped';
        const text = [
          `Hello ${doc.customerName},`,
          '',
          'Good news! The order is shipped.',
          `Request ID: ${doc._id}`,
          '',
          'Thank you for using Equipment Rental.'
        ].join('\n');
        await sendMail({ to: doc.customerEmail, subject, text });
      } catch (e) { console.warn('Email notify (progress) failed:', e.message); }
    }

    res.json({ item: doc });
  } catch (e) {
    console.error('Update supplier request progress error:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /supplier-requests/my - customer fetch own supplier requests
exports.getMy = async (req, res) => {
  try {
    if (!ensureUser(req, res)) return;
    const userId = req.user.id;
    const list = await SupplierRequest.find({ userId }).sort({ createdAt: -1 });
    res.json({ items: list });
  } catch (e) {
    console.error('Get my supplier requests error:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /supplier-requests/:id/user-update - customer allows editing while pending and within 1 hour
exports.userUpdate = async (req, res) => {
  try {
    if (!ensureUser(req, res)) return;
    const { id } = req.params;
    const doc = await SupplierRequest.findById(id);
    if (!doc) return res.status(404).json({ message: 'Request not found' });
    if (String(doc.userId) !== String(req.user.id)) return res.status(403).json({ message: 'Forbidden' });
    if (doc.status !== 'pending') return res.status(400).json({ message: 'Only pending requests can be edited' });
    const created = new Date(doc.createdAt).getTime();
    if (isNaN(created) || Date.now() > created + 60 * 60 * 1000) {
      return res.status(400).json({ message: 'Edit window expired (1 hour from creation)' });
    }

    const { bookingDate, returnDate, customerName, customerEmail, customerPhone, deliveryAddress, notes } = req.body || {};
    if (!bookingDate) return res.status(400).json({ message: 'bookingDate required' });
    const bd = new Date(bookingDate);
    if (isNaN(bd.getTime())) return res.status(400).json({ message: 'Invalid bookingDate' });
    let rd;
    if (returnDate) {
      rd = new Date(returnDate);
      if (isNaN(rd.getTime())) return res.status(400).json({ message: 'Invalid returnDate' });
      if (rd.getTime() < bd.getTime()) return res.status(400).json({ message: 'returnDate must be on or after bookingDate' });
    }
    if (!customerName || !customerEmail || !customerPhone || !deliveryAddress) {
      return res.status(400).json({ message: 'Customer details and address required' });
    }

    doc.bookingDate = bd;
    doc.returnDate = rd;
    doc.customerName = customerName;
    doc.customerEmail = customerEmail;
    doc.customerPhone = customerPhone;
    doc.deliveryAddress = deliveryAddress;
    doc.notes = notes || '';
    await doc.save();
    res.json({ item: doc });
  } catch (e) {
    console.error('User update supplier request error:', e);
    res.status(500).json({ message: e.message || 'Server error' });
  }
};

// PUT /supplier-requests/:id/cancel-by-user - customer cancels pending request and restores stock
exports.cancelByUser = async (req, res) => {
  try {
    if (!ensureUser(req, res)) return;
    const { id } = req.params;
    const doc = await SupplierRequest.findById(id);
    if (!doc) return res.status(404).json({ message: 'Request not found' });
    if (String(doc.userId) !== String(req.user.id)) return res.status(403).json({ message: 'Forbidden' });
    if (doc.status !== 'pending') return res.status(400).json({ message: 'Only pending requests can be cancelled by user' });

    // restore stock quantities
    for (const it of doc.items || []) {
      try { await SupplierInventory.findByIdAndUpdate(it.inventoryId, { $inc: { quantity: Number(it.qty) || 0 } }, { new: false }); } catch {}
    }
    doc.status = 'cancelled';
    await doc.save();
    res.json({ item: doc });
  } catch (e) {
    console.error('Cancel supplier request by user error:', e);
    res.status(500).json({ message: e.message || 'Server error' });
  }
};
