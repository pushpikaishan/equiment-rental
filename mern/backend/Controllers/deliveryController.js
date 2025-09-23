const Delivery = require('../Model/deliveryModel');
const Booking = require('../Model/bookingModel');
const Staff = require('../Model/staffModel');

function ensureAdmin(req, res) {
  const role = req.user?.role;
  const ok = role === 'admin' || role === 'staff';
  if (!ok) res.status(403).json({ message: 'Admin/staff only' });
  return ok;
}

// Vehicle/email handling removed per latest requirements.

// GET /deliveries/admin - list confirmed bookings with delivery info (paginated)
exports.adminList = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit || '10', 10)));

    const q = { status: 'confirmed' };
    const total = await Booking.countDocuments(q);
    const bookings = await Booking.find(q).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit);
    const bookingIds = bookings.map(b => b._id);
    const deliveries = await Delivery.find({ bookingId: { $in: bookingIds } });
    const map = new Map(deliveries.map(d => [String(d.bookingId), d]));
    const items = bookings.map(b => ({ booking: b, delivery: map.get(String(b._id)) || null }));
    res.json({ items, total, page, limit });
  } catch (e) {
    console.error('Admin deliveries list error:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /deliveries/user/my - list deliveries for current user's bookings
exports.userList = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    // find bookings owned by the logged-in user (regardless of role type in refPath)
    const bookings = await Booking.find({ userId: req.user.id }).sort({ createdAt: -1 });
    const bookingIds = bookings.map(b => b._id);
    if (bookingIds.length === 0) return res.json({ items: [] });
    const deliveries = await Delivery.find({ bookingId: { $in: bookingIds } })
      .sort({ createdAt: -1 })
      .populate('driverId', 'name phoneno email');
    const bmap = new Map(bookings.map(b => [String(b._id), b]));
    const items = deliveries.map(d => ({ delivery: d, booking: bmap.get(String(d.bookingId)) || null }));
    res.json({ items });
  } catch (e) {
    console.error('User deliveries list error:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /deliveries/admin/drivers - list staff to choose drivers
exports.listDrivers = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;
    // Return all staff members to choose from
    const drivers = await Staff.find({ role: 'staff' }, { name: 1, email: 1 }).sort({ name: 1 });
    res.json({ drivers });
  } catch (e) {
    console.error('List drivers error:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /deliveries/admin/:bookingId/assign
exports.assign = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const { bookingId } = req.params;
    const { driverId = '' } = req.body || {};
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.status !== 'confirmed') return res.status(400).json({ message: 'Only confirmed bookings can be assigned for delivery' });
    if (!driverId) return res.status(400).json({ message: 'driverId is required' });
    const staff = await Staff.findById(driverId);
    if (!staff) return res.status(400).json({ message: 'Driver not found' });

    let delivery = await Delivery.findOne({ bookingId });
    if (!delivery) {
      delivery = await Delivery.create({
        bookingId,
        driverId,
        driver: staff.name,
        status: 'assigned',
        assignedAt: new Date(),
      });
    } else {
      delivery.driverId = driverId;
      delivery.driver = staff.name;
      delivery.status = 'assigned';
      delivery.assignedAt = new Date();
      await delivery.save();
    }

    res.json({ delivery });
  } catch (e) {
    console.error('Assign delivery error:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /deliveries/admin/:bookingId/complete
exports.complete = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const { bookingId } = req.params;
    const delivery = await Delivery.findOne({ bookingId });
    if (!delivery) return res.status(404).json({ message: 'Delivery not found' });
    delivery.status = 'delivered';
    delivery.deliveredAt = new Date();
    await delivery.save();
    res.json({ delivery });
  } catch (e) {
    console.error('Complete delivery error:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /deliveries/admin - remove all delivery records
exports.purgeAll = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const { deletedCount } = await Delivery.deleteMany({});
    res.json({ ok: true, deletedCount });
  } catch (e) {
    console.error('Purge deliveries error:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /deliveries/admin/:bookingId/recollect/assign - assign a staff to recollect after delivered
exports.assignRecollect = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const { bookingId } = req.params;
    const { driverId = '' } = req.body || {};
    if (!driverId) return res.status(400).json({ message: 'driverId is required' });
    const staff = await Staff.findById(driverId);
    if (!staff) return res.status(400).json({ message: 'Staff not found' });

    let delivery = await Delivery.findOne({ bookingId });
    if (!delivery) return res.status(404).json({ message: 'Delivery not found' });
    if (delivery.status !== 'delivered') return res.status(400).json({ message: 'Recollect can be assigned only after delivered' });

    delivery.recollectDriverId = staff._id;
    delivery.recollectDriver = staff.name;
    delivery.recollectStatus = 'assigned';
    delivery.recollectAssignedAt = new Date();
    await delivery.save();

    res.json({ delivery });
  } catch (e) {
    console.error('Assign recollect error:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /deliveries/admin/:bookingId/recollect/returned - admin marks items returned to warehouse
exports.markRecollectReturned = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const { bookingId } = req.params;
    const delivery = await Delivery.findOne({ bookingId });
    if (!delivery) return res.status(404).json({ message: 'Delivery not found' });
    if (!delivery.recollectReport) return res.status(400).json({ message: 'Recollect report not submitted yet' });
    delivery.recollectStatus = 'returned';
    delivery.recollectedAt = new Date();
    await delivery.save();
    res.json({ delivery });
  } catch (e) {
    console.error('Mark recollect returned error:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /deliveries/driver/:bookingId/status - staff updates their delivery status
exports.updateByDriver = async (req, res) => {
  try {
    // Only staff can update their own assigned delivery
    if (req.user?.role !== 'staff') return res.status(403).json({ message: 'Staff only' });
    const { bookingId } = req.params;
    const { status } = req.body || {};
    const allowed = ['assigned', 'in-progress', 'delivered', 'failed'];
    if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status', allowed });
    const delivery = await Delivery.findOne({ bookingId, driverId: req.user.id });
    if (!delivery) return res.status(404).json({ message: 'Delivery not found for this staff' });
    delivery.status = status;
    if (status === 'delivered') delivery.deliveredAt = new Date();
    await delivery.save();
    res.json({ delivery });
  } catch (e) {
    console.error('Driver update delivery status error:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /deliveries/driver/recollect/my - list recollect tasks for logged-in staff
exports.driverRecollectList = async (req, res) => {
  try {
    if (req.user?.role !== 'staff') return res.status(403).json({ message: 'Staff only' });
    const deliveries = await Delivery.find({ recollectDriverId: req.user.id })
      .sort({ updatedAt: -1 })
      .populate('bookingId');
    res.json({ deliveries });
  } catch (e) {
    console.error('Driver recollect list error:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /deliveries/driver/:bookingId/recollect/status - staff updates recollect status (accept/reject/in-progress/completed)
exports.updateRecollectByDriver = async (req, res) => {
  try {
    if (req.user?.role !== 'staff') return res.status(403).json({ message: 'Staff only' });
    const { bookingId } = req.params;
    const { status } = req.body || {};
    const allowed = ['accepted', 'rejected', 'in-progress', 'completed'];
    if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status', allowed });
    const delivery = await Delivery.findOne({ bookingId, recollectDriverId: req.user.id });
    if (!delivery) return res.status(404).json({ message: 'Recollect task not found for this staff' });
    delivery.recollectStatus = status;
    if (status === 'completed') delivery.recollectedAt = new Date();
    await delivery.save();
    res.json({ delivery });
  } catch (e) {
    console.error('Driver update recollect status error:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /deliveries/driver/:bookingId/recollect/report - staff submits recollect report
exports.submitRecollectReport = async (req, res) => {
  try {
    if (req.user?.role !== 'staff') return res.status(403).json({ message: 'Staff only' });
    const { bookingId } = req.params;
  const { items = [], comment = '', actualReturnDate } = req.body || {};
    const delivery = await Delivery.findOne({ bookingId, recollectDriverId: req.user.id }).populate('bookingId');
    if (!delivery) return res.status(404).json({ message: 'Recollect task not found for this staff' });
    if (!['accepted', 'in-progress', 'completed'].includes(delivery.recollectStatus)) {
      return res.status(400).json({ message: 'Recollect report can be submitted only after accept/start' });
    }
    // Build items with computed repair costs
    const booking = delivery.bookingId; // populated booking
    const priceMap = new Map();
    if (booking && Array.isArray(booking.items)) {
      booking.items.forEach(bi => {
        priceMap.set(String(bi.equipmentId || bi._id || bi.name), Number(bi.pricePerDay || 0));
      });
    }
  let repairTotal = 0;
    const normItems = Array.isArray(items) ? items.map(i => {
      const condition = ['none','minor','major'].includes(String(i.condition || 'none')) ? String(i.condition || 'none') : 'none';
      const expectedQty = Number(i.expectedQty || 0);
      const collectedQty = Number(i.collectedQty || 0);
      const damagedQty = Math.max(0, expectedQty - collectedQty);
      // Basis cost per item: pricePerDay (rented cost) from booking
      const key = String(i.equipmentId || i.name);
      const unitCost = priceMap.get(key) ?? 0;
      let repairCost = 0;
      if (condition === 'minor') repairCost = 0.5 * unitCost * damagedQty;
      if (condition === 'major') repairCost = 1.0 * unitCost * damagedQty;
      repairTotal += repairCost;
      return {
        equipmentId: i.equipmentId || undefined,
        name: i.name || '',
        expectedQty,
        collectedQty,
        condition,
        damagedQty,
        repairCost,
        note: i.note || '',
      };
    }) : [];

    // Late fine calculation
    const plannedReturn = booking?.returnDate ? new Date(booking.returnDate) : null;
    const actualDate = actualReturnDate ? new Date(actualReturnDate) : new Date();
    let lateDays = 0;
    if (plannedReturn) {
      const ms = actualDate - plannedReturn;
      lateDays = Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
    }
  // totalPerDay: sum of pricePerDay * qty from booking items
    const totalPerDay = booking && Array.isArray(booking.items)
      ? booking.items.reduce((sum, bi) => sum + Number(bi.pricePerDay || 0) * Number(bi.qty || 0), 0)
      : 0;
  // Updated formula: late fine = lateDays * (totalPerDay * 0.2)
  const lateFine = lateDays * (totalPerDay * 0.2);

    delivery.recollectReport = {
      items: normItems,
      actualReturnDate: actualReturnDate ? new Date(actualReturnDate) : new Date(),
      comment,
      repairCostTotal: repairTotal,
      lateDays,
      lateFine,
      grandTotal: repairTotal + lateFine,
      createdAt: new Date(),
      createdBy: req.user.id,
    };
  // Mark status as report submitted
  delivery.recollectStatus = 'report_submitted';
  await delivery.save();

    // Inventory updates: reduce quantity by damaged items and log damage details
    try {
      const Equipment = require('../Model/equipmentModel');
      const bookingId = delivery.bookingId?._id || delivery.bookingId;
      const reportId = delivery._id;
      for (const it of normItems) {
        if (!it.equipmentId || !it.damagedQty || it.damagedQty <= 0) continue;
        const update = {
          $inc: { quantity: -Number(it.damagedQty || 0), damagedCount: Number(it.damagedQty || 0) },
          $push: { damageLogs: {
            at: new Date(), bookingId, reportId, qty: Number(it.damagedQty || 0), condition: it.condition || 'none', note: it.note || '', staffId: req.user.id
          } }
        };
        await Equipment.findByIdAndUpdate(it.equipmentId, update, { new: false });
      }
    } catch (invErr) {
      console.error('Inventory update after recollect error:', invErr);
      // proceed even if inventory update fails
    }
    res.json({ delivery });
  } catch (e) {
    console.error('Submit recollect report error:', e);
    res.status(500).json({ message: 'Server error' });
  }
};
