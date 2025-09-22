const Booking = require('../Model/bookingModel');
const Equipment = require('../Model/equipmentModel');
const { generateInvoicePDF } = require('./invoiceHelper');

const DAY_MS = 24 * 60 * 60 * 1000;

// Helper to compute totals and deposit (10% deposit by default)
function computeTotals(items, depositRate = 0.1) {
  const subtotal = items.reduce((sum, it) => sum + (Number(it.pricePerDay) || 0) * (it.qty || 0), 0);
  const securityDeposit = Math.round(subtotal * depositRate * 100) / 100;
  return { subtotal, securityDeposit, total: subtotal + securityDeposit };
}

exports.create = async (req, res) => {
  try {
  const { bookingDate, items, customerName, customerEmail, customerPhone, deliveryAddress, notes } = req.body;
    if (!bookingDate || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'bookingDate and items required' });
    }
    if (!customerName || !customerEmail || !customerPhone || !deliveryAddress) {
      return res.status(400).json({ message: 'Customer details (name, email, phone) and delivery address are required' });
    }
    const date = new Date(bookingDate);
    if (isNaN(date.getTime())) {
      return res.status(400).json({ message: 'Invalid bookingDate' });
    }

    // Validate equipment availability and map to snapshot items
    const snapItems = [];
    for (const it of items) {
      const eq = await Equipment.findById(it.equipmentId);
      if (!eq) return res.status(400).json({ message: 'Equipment not found' });
      const available = (eq.available !== false) && (Number(eq.quantity) || 0) >= (it.qty || 0) && (it.qty || 0) > 0;
      if (!available) return res.status(400).json({ message: `Item not available: ${eq.name}` });
      snapItems.push({ equipmentId: eq._id, name: eq.name, pricePerDay: Number(eq.rentalPrice) || 0, qty: it.qty });
    }

    const sums = computeTotals(snapItems);
    const booking = await Booking.create({
      userId: req.user.id,
      userRole: req.user.role,
      bookingDate: date,
      items: snapItems,
      customerName,
      customerEmail,
      customerPhone,
  deliveryAddress,
      notes: notes || '',
      subtotal: sums.subtotal,
      securityDeposit: sums.securityDeposit,
      total: sums.total,
    });

    return res.status(201).json({ booking });
  } catch (e) {
    console.error('Create booking error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getMine = async (req, res) => {
  try {
    const list = await Booking.find({ userId: req.user.id }).sort({ createdAt: -1 });
    return res.json({ bookings: list });
  } catch (e) {
    console.error('Get my bookings error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (String(booking.userId) !== String(req.user.id)) return res.status(403).json({ message: 'Forbidden' });

    // 24h rule: allow modifications up to 24 hours before the booking date
    const cutoff = new Date(booking.bookingDate).getTime() - DAY_MS;
    if (Date.now() > cutoff) {
      return res.status(400).json({ message: 'Cannot modify booking within 24 hours of the booking date' });
    }

  const { bookingDate, items, customerName, customerEmail, customerPhone, deliveryAddress, notes } = req.body;

    if (bookingDate) {
      const date = new Date(bookingDate);
      if (isNaN(date.getTime())) return res.status(400).json({ message: 'Invalid bookingDate' });
      booking.bookingDate = date;
    }

    if (customerName) booking.customerName = customerName;
    if (customerEmail) booking.customerEmail = customerEmail;
    if (customerPhone) booking.customerPhone = customerPhone;
  if (deliveryAddress) booking.deliveryAddress = deliveryAddress;
    if (typeof notes === 'string') booking.notes = notes;

    if (Array.isArray(items) && items.length > 0) {
      // Revalidate items
      const snapItems = [];
      for (const it of items) {
        const eq = await Equipment.findById(it.equipmentId);
        if (!eq) return res.status(400).json({ message: 'Equipment not found' });
        const available = (eq.available !== false) && (Number(eq.quantity) || 0) >= (it.qty || 0) && (it.qty || 0) > 0;
        if (!available) return res.status(400).json({ message: `Item not available: ${eq.name}` });
        snapItems.push({ equipmentId: eq._id, name: eq.name, pricePerDay: Number(eq.rentalPrice) || 0, qty: it.qty });
      }
      const sums = computeTotals(snapItems);
      booking.items = snapItems;
      booking.subtotal = sums.subtotal;
      booking.securityDeposit = sums.securityDeposit;
      booking.total = sums.total;
    }

    await booking.save();
    return res.json({ booking });
  } catch (e) {
    console.error('Update booking error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (String(booking.userId) !== String(req.user.id)) return res.status(403).json({ message: 'Forbidden' });

    // 24h rule: allow deletion within 24 hours after creation
    const cutoff = new Date(booking.createdAt).getTime() + DAY_MS;
    if (Date.now() > cutoff) {
      return res.status(400).json({ message: 'You can cancel a booking only within 24 hours after creation' });
    }

    await booking.deleteOne();
    return res.json({ message: 'Booking deleted' });
  } catch (e) {
    console.error('Delete booking error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
};

// (removed) confirmPayment handler
// Confirm booking payment: mark confirmed and generate invoice PDF (no notifications)
exports.confirm = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (String(booking.userId) !== String(req.user.id)) return res.status(403).json({ message: 'Forbidden' });

    booking.status = 'confirmed';
    await booking.save();

    // Generate invoice PDF (still created on server, but no notification is sent)
    const invoicePath = await generateInvoicePDF(booking);
    return res.json({ booking, invoicePath });
  } catch (e) {
    console.error('Confirm booking error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
};
