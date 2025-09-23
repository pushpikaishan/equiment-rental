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
