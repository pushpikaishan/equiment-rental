const Booking = require('../Model/bookingModel');
const Equipment = require('../Model/equipmentModel');
const Admin = require('../Model/adminModel');
const Staff = require('../Model/staffModel');
const { generateInvoicePDF } = require('./invoiceHelper');
const Payment = require('../Model/paymentModel');
const PaymentAudit = require('../Model/paymentAuditModel');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
// Try to load sharp for ICO->PNG conversion; optional dependency
let sharp = null;
try {
  sharp = require('sharp');
} catch (e) {
  // sharp not installed; we'll skip ICO conversion
  sharp = null;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

// Helper to compute totals and deposit (30% deposit by default)
// Uses number of rental days = max(1, ceil((returnDate - bookingDate)/DAY_MS))
function computeTotals(items, bookingDate, returnDate, depositRate = 0.3) {
  let days = 1;
  if (bookingDate && returnDate) {
    const bd = new Date(bookingDate).getTime();
    const rd = new Date(returnDate).getTime();
    if (!isNaN(bd) && !isNaN(rd) && rd >= bd) {
      days = Math.max(1, Math.ceil((rd - bd) / DAY_MS));
    }
  }
  const subtotalPerDay = items.reduce((sum, it) => sum + (Number(it.pricePerDay) || 0) * (it.qty || 0), 0);
  const subtotal = subtotalPerDay * days;
  const securityDeposit = Math.round(subtotal * depositRate * 100) / 100;
  return { subtotal, securityDeposit, total: subtotal + securityDeposit, days };
}

// Atomically decrement equipment quantities for a set of items.
// If any decrement fails (insufficient stock), revert prior decrements and throw.
async function reserveInventory(items) {
  const decremented = [];
  try {
    for (const it of items) {
      const qty = Number(it.qty || 0);
      if (!it.equipmentId || qty <= 0) continue;
      const updated = await Equipment.findOneAndUpdate(
        { _id: it.equipmentId, quantity: { $gte: qty }, available: { $ne: false } },
        { $inc: { quantity: -qty } },
        { new: true }
      );
      if (!updated) {
        throw new Error('Insufficient stock for one or more items');
      }
      // If stock hits 0, mark unavailable
      if (Number(updated.quantity) === 0 && updated.available !== false) {
        try { await Equipment.findByIdAndUpdate(updated._id, { $set: { available: false } }, { new: false }); } catch {}
      }
      decremented.push({ equipmentId: it.equipmentId, qty });
    }
  } catch (e) {
    // rollback
    for (const d of decremented) {
      try { await Equipment.findByIdAndUpdate(d.equipmentId, { $inc: { quantity: d.qty } }, { new: false }); } catch {}
    }
    throw e;
  }
}

// Increment equipment quantities back for a set of items (used on cancellation)
async function restoreInventory(items) {
  for (const it of items || []) {
    const qty = Number(it.qty || 0);
    if (!it.equipmentId || qty <= 0) continue;
    try {
      // Restore quantity and mark available since stock is now > 0
      await Equipment.findByIdAndUpdate(
        it.equipmentId,
        { $inc: { quantity: qty }, $set: { available: true } },
        { new: false }
      );
    } catch {}
  }
}

exports.create = async (req, res) => {
  try {
  // Whitelist fields that a user is allowed to update
  const { bookingDate, returnDate, items, customerName, customerEmail, customerPhone, deliveryAddress, notes, status, cancelledAt, cancelReason } = req.body;

    // Prevent users from directly modifying restricted fields
    if (typeof status !== 'undefined' || typeof cancelledAt !== 'undefined' || typeof cancelReason !== 'undefined') {
      return res.status(400).json({ message: 'Attempt to modify restricted fields' });
    }
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
    let retDate;
    if (returnDate) {
      retDate = new Date(returnDate);
      if (isNaN(retDate.getTime())) return res.status(400).json({ message: 'Invalid returnDate' });
      if (retDate.getTime() < date.getTime()) return res.status(400).json({ message: 'returnDate must be on or after bookingDate' });
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

    const sums = computeTotals(snapItems, date, retDate);
    // Reserve inventory (decrement quantities) before creating booking
    await reserveInventory(snapItems);
    let booking;
    try {
      booking = await Booking.create({
        userId: req.user.id,
        userRole: req.user.role,
        bookingDate: date,
        items: snapItems,
        customerName,
        customerEmail,
        customerPhone,
        deliveryAddress,
        notes: notes || '',
        returnDate: retDate,
        subtotal: sums.subtotal,
        securityDeposit: sums.securityDeposit,
        total: sums.total,
      });
    } catch (err) {
      // Rollback inventory if booking creation fails
      try { await restoreInventory(snapItems); } catch {}
      throw err;
    }

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

    // Allow user edits only within 1 hour after creating the booking
    const createdAtMs = new Date(booking.createdAt).getTime();
    const editWindowEnd = createdAtMs + HOUR_MS;
    if (Date.now() > editWindowEnd) {
      return res.status(400).json({ message: 'You can edit this booking only within 1 hour after creation' });
    }

  const { bookingDate, returnDate, items, customerName, customerEmail, customerPhone, deliveryAddress, notes } = req.body;

    if (bookingDate) {
      const date = new Date(bookingDate);
      if (isNaN(date.getTime())) return res.status(400).json({ message: 'Invalid bookingDate' });
      booking.bookingDate = date;
    }

    if (typeof returnDate !== 'undefined') {
      if (returnDate === null || returnDate === '') {
        booking.returnDate = undefined;
      } else {
        const rd = new Date(returnDate);
        if (isNaN(rd.getTime())) return res.status(400).json({ message: 'Invalid returnDate' });
        const bd = new Date(booking.bookingDate).getTime();
        if (rd.getTime() < bd) return res.status(400).json({ message: 'returnDate must be on or after bookingDate' });
        booking.returnDate = rd;
      }
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
      const sums = computeTotals(snapItems, booking.bookingDate, booking.returnDate);
      booking.items = snapItems;
      booking.subtotal = sums.subtotal;
      booking.securityDeposit = sums.securityDeposit;
      booking.total = sums.total;
    }

    // If dates changed but items didn't, still recompute totals based on existing items and new dates
    if (!(Array.isArray(items) && items.length > 0)) {
      const sums = computeTotals(booking.items || [], booking.bookingDate, booking.returnDate);
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

    // Restore inventory since this effectively cancels the booking
    try { await restoreInventory(booking.items || []); } catch (e) { console.error('Restore inventory on delete failed:', e); }
    await booking.deleteOne();
    return res.json({ message: 'Booking deleted' });
  } catch (e) {
    console.error('Delete booking error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
};

// PUT /bookings/:id/cancel - user cancels own booking
exports.userCancel = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (String(booking.userId) !== String(req.user.id)) return res.status(403).json({ message: 'Forbidden' });

    // Business rule: allow cancellation anytime until it's cancelled or already cancelled
    if (booking.status === 'cancelled') return res.status(400).json({ message: 'Booking already cancelled' });

    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    booking.cancelReason = req.body?.reason || '';
    booking.cancelledByRole = req.user.role;
    booking.cancelledById = req.user.id;
    // Restore inventory back to stock on cancellation
    try { await restoreInventory(booking.items || []); } catch (e) { console.error('Restore inventory on user cancel failed:', e); }
    await booking.save();

    // Create a refund record for admin processing
    try {
      const Refund = require('../Model/refundModel');
      // Try to locate a payment for this booking
      const pay = await Payment.findOne({ bookingId: booking._id });
      const amount = Number(pay?.amount ?? booking.total) || 0;
      await Refund.create({
        bookingId: booking._id,
        userId: booking.userId,
        paymentId: pay?._id,
        amount,
        reason: booking.cancelReason || 'User cancelled booking',
        status: 'pending',
      });
    } catch (e) {
      console.error('Create refund record error:', e);
      // do not fail cancellation on refund creation error
    }

    return res.json({ booking });
  } catch (e) {
    console.error('User cancel booking error:', e);
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

  // Generate invoice PDF and email to customer
  const invoicePath = await generateInvoicePDF(booking);

    // Create or update a Payment record for admin management
    let payment = await Payment.findOne({ bookingId: booking._id });
    const transactionId = `DUMMY-${Date.now()}`;
    if (!payment) {
      payment = await Payment.create({
        bookingId: booking._id,
        orderId: String(booking._id),
        userId: booking.userId,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        method: 'card',
        status: 'paid',
        currency: 'LKR',
        amount: Number(booking.total) || 0,
        subtotal: Number(booking.subtotal) || 0,
        deposit: Number(booking.securityDeposit) || 0,
        taxes: 0,
        discount: 0,
        transactionId,
        gateway: 'dummy',
        invoicePath,
        meta: { source: 'checkout_confirm' },
      });
      await PaymentAudit.create({ paymentId: payment._id, action: 'created', actorId: booking.userId, actorRole: booking.userRole, note: 'Payment captured via dummy gateway', amount: payment.amount });
    } else {
      payment.status = 'paid';
      payment.invoicePath = invoicePath;
      payment.transactionId = transactionId;
      payment.method = payment.method || 'card';
      payment.gateway = payment.gateway || 'dummy';
      await payment.save();
      await PaymentAudit.create({ paymentId: payment._id, action: 'updated', actorId: booking.userId, actorRole: booking.userRole, note: 'Payment updated on confirm', amount: payment.amount });
    }

    // Email invoice to customer
    try {
      const { sendMail } = require('../helpers/emailHelper');
      const subject = 'Payment Successful - Invoice Attached';
      const text = `Hello ${booking.customerName},\n\nWe have received your payment for order ${booking._id}. Your invoice is attached.\n\nThank you!`;
      const html = `<p>Hello ${booking.customerName},</p><p>We have received your payment for order <strong>${booking._id}</strong>. Your invoice is attached.</p><p>Thank you!</p>`;
      // Attach the generated invoice file from disk
      const path = require('path');
      const absPath = path.join(process.cwd(), invoicePath.replace(/^\//, ''));
      await sendMail({ to: booking.customerEmail, subject, text, html, attachments: [{ filename: `invoice-${booking._id}.pdf`, path: absPath }] });
    } catch (mailErr) {
      console.error('Send invoice email failed:', mailErr);
    }

    return res.json({ booking, invoicePath, payment });
  } catch (e) {
    console.error('Confirm booking error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
};

// --- Admin endpoints ---
function ensureAdmin(req, res) {
  const role = req.user?.role;
  const ok = role === 'admin' || role === 'staff';
  if (!ok) {
    res.status(403).json({ message: 'Admin/staff only' });
  }
  return ok;
}

// GET /bookings/admin - list with filters & pagination
exports.adminList = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const { status, customer = '', orderId = '', from = '', to = '', disputed = '' } = req.query;
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit || '10', 10)));
    const q = {};
    if (status) q.status = status;
    if (orderId) q._id = orderId.match(/^\w+$/) ? orderId : undefined; // allow exact id
    if (typeof q._id === 'undefined' && orderId) {
      // if not valid id, match none
      q._id = null;
    }
    if (customer) {
      q.$or = [
        { customerName: new RegExp(customer, 'i') },
        { customerEmail: new RegExp(customer, 'i') },
      ];
    }
    if (disputed === 'true') q.disputed = true;
    if (disputed === 'false') q.disputed = false;
    // Date range on createdAt by default
    if (from || to) {
      q.createdAt = {};
      if (from) q.createdAt.$gte = new Date(from);
      if (to) {
        const d = new Date(to);
        d.setHours(23, 59, 59, 999);
        q.createdAt.$lte = d;
      }
    }

    const total = await Booking.countDocuments(q);
    const items = await Booking.find(q).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit);
    res.json({ items, total, page, limit });
  } catch (e) {
    console.error('Admin bookings list error:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /bookings/admin/summary - usage metrics
exports.adminSummary = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const [total, pending, confirmed, cancelled, disputed] = await Promise.all([
      Booking.countDocuments({}),
      Booking.countDocuments({ status: 'pending' }),
      Booking.countDocuments({ status: 'confirmed' }),
      Booking.countDocuments({ status: 'cancelled' }),
      Booking.countDocuments({ disputed: true }),
    ]);
    // Revenue approximations based on booking totals
    const agg = await Booking.aggregate([
      { $group: { _id: null, totalAmount: { $sum: '$total' }, subtotal: { $sum: '$subtotal' }, deposit: { $sum: '$securityDeposit' } } },
    ]);
    const totals = agg[0] || { totalAmount: 0, subtotal: 0, deposit: 0 };
    res.json({ total, pending, confirmed, cancelled, disputed, totals });
  } catch (e) {
    console.error('Admin bookings summary error:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /bookings/admin/:id/cancel - cancel a booking
exports.adminCancel = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const { id } = req.params;
    const { reason = '' } = req.body || {};
    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    const wasCancelled = booking.status === 'cancelled';
    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    booking.cancelReason = reason;
    booking.cancelledByRole = req.user.role;
    booking.cancelledById = req.user.id;
    // Only restore once if not already cancelled before
    if (!wasCancelled) {
      try { await restoreInventory(booking.items || []); } catch (e) { console.error('Restore inventory on admin cancel failed:', e); }
    }
    await booking.save();

    // Notify customer via email with cancellation reason (only on first cancel)
    if (!wasCancelled && booking.customerEmail) {
      try {
        const { sendMail } = require('../helpers/emailHelper');
        const subject = `Your booking ${booking._id} has been cancelled`;
        const safeReason = (reason && String(reason).trim()) ? String(reason).trim() : 'No reason provided.';
        const text = `Hello ${booking.customerName},\n\nWe are writing to inform you that your booking (${booking._id}) scheduled for ${booking.bookingDate ? new Date(booking.bookingDate).toLocaleDateString() : 'N/A'} has been cancelled by our team.\n\nReason: ${safeReason}\n\nIf you have any questions, please reply to this email.\n\nRegards,\nSupport Team`;
        const html = `<p>Hello ${booking.customerName},</p>
          <p>We are writing to inform you that your booking (<strong>${booking._id}</strong>) scheduled for <strong>${booking.bookingDate ? new Date(booking.bookingDate).toLocaleDateString() : 'N/A'}</strong> has been cancelled by our team.</p>
          <p><strong>Reason:</strong> ${safeReason}</p>
          <p>If you have any questions, please reply to this email.</p>
          <p>Regards,<br/>Support Team</p>`;
        await sendMail({ to: booking.customerEmail, subject, text, html });
      } catch (mailErr) {
        console.error('Send cancellation email failed:', mailErr);
      }
    }
    res.json({ booking });
  } catch (e) {
    console.error('Admin cancel booking error:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /bookings/admin/:id/dispute - toggle or set dispute
exports.toggleDispute = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const { id } = req.params;
    const { disputed, note = '' } = req.body || {};
    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (typeof disputed === 'boolean') booking.disputed = disputed; else booking.disputed = !booking.disputed;
    if (note) booking.disputeNote = note;
    await booking.save();
    res.json({ booking });
  } catch (e) {
    console.error('Admin toggle dispute error:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /bookings/admin/export/csv - Export bookings to CSV with status filter
exports.exportCSV = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const { status, customer = '', orderId = '', from = '', to = '', disputed = '' } = req.query || {};
    const q = {};
    if (status) q.status = status;
    if (orderId) q._id = orderId;
    if (customer) q.$or = [{ customerName: new RegExp(customer, 'i') }, { customerEmail: new RegExp(customer, 'i') }];
    if (disputed === 'true') q.disputed = true;
    if (disputed === 'false') q.disputed = false;
    if (from || to) {
      q.createdAt = {};
      if (from) q.createdAt.$gte = new Date(from);
      if (to) { const d = new Date(to); d.setHours(23,59,59,999); q.createdAt.$lte = d; }
    }
    const rows = await Booking.find(q).sort({ createdAt: -1 });

    // Metadata: report generator info (admin)
    const adminName = req.user?.name || 'Admin User';
    const adminEmail = req.user?.email || 'admin@system.com';
    const generatedOn = new Date().toISOString();

    const headers = [
      'Booking ID','Created At','Booking Date','Customer Name','Customer Email','Phone','Status','Subtotal','Security Deposit','Total','Cancelled At','Cancel Reason'
    ];
    const lines = [];
    // Prepend metadata rows
    lines.push(['Generated on', generatedOn].join(','));
    lines.push(['Generated by', adminName, adminEmail].join(','));
    lines.push('');
    // Column headers
    lines.push(headers.join(','));

    let totals = { subtotal: 0, deposit: 0, total: 0 };
    for (const b of rows) {
      totals.subtotal += Number(b.subtotal) || 0;
      totals.deposit += Number(b.securityDeposit) || 0;
      totals.total += Number(b.total) || 0;
      const rec = [
        String(b._id),
        new Date(b.createdAt).toISOString(),
        b.bookingDate ? new Date(b.bookingDate).toISOString().slice(0,10) : '',
        b.customerName || '',
        b.customerEmail || '',
        b.customerPhone || '',
        b.status || '',
        (Number(b.subtotal) || 0).toFixed(2),
        (Number(b.securityDeposit) || 0).toFixed(2),
        (Number(b.total) || 0).toFixed(2),
        b.cancelledAt ? new Date(b.cancelledAt).toISOString() : '',
        b.cancelReason || '',
      ].map(v => (typeof v === 'string' && (v.includes(',') || v.includes('"'))) ? '"' + v.replace(/"/g,'""') + '"' : v);
      lines.push(rec.join(','));
    }
    // Totals row
    const totalsRow = ['Totals','','','','','','', totals.subtotal.toFixed(2), totals.deposit.toFixed(2), totals.total.toFixed(2),'',''];
    lines.push(totalsRow.join(','));

    const csv = lines.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="bookings-report.csv"');
    res.send(csv);
  } catch (e) {
    console.error('Admin bookings CSV export error:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /bookings/admin/export/pdf - Export bookings to PDF with status filter
exports.exportPDF = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const { status, orderId = '', from = '', to = '', disputed = '' } = req.query || {};
    const q = {};

    if (status) q.status = status;
    if (orderId) q._id = orderId;
    if (disputed === 'true') q.disputed = true;
    if (disputed === 'false') q.disputed = false;
    if (from || to) {
      q.createdAt = {};
      if (from) q.createdAt.$gte = new Date(from);
      if (to) {
        const d = new Date(to);
        d.setHours(23, 59, 59, 999);
        q.createdAt.$lte = d;
      }
    }

    const rows = await Booking.find(q).sort({ createdAt: -1 });

    // Get admin/staff details from DB using authenticated user id
    let adminName = 'Unknown';
    let adminEmail = '';
    try {
      const uid = req.user?.id;
      const role = req.user?.role;
      if (uid && role === 'admin') {
        const doc = await Admin.findById(uid).select('name email');
        if (doc) { adminName = doc.name || adminName; adminEmail = doc.email || adminEmail; }
      } else if (uid && role === 'staff') {
        const doc = await Staff.findById(uid).select('name email');
        if (doc) { adminName = doc.name || adminName; adminEmail = doc.email || adminEmail; }
      }
    } catch (e) {
      // Non-fatal: keep defaults
      console.warn('Could not load admin profile for PDF:', e.message);
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="bookings-report.pdf"');

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    doc.pipe(res);

    // --- HEADER with LOGO and BRANDING ---
    const contentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const startX = doc.page.margins.left;
    const startY = doc.page.margins.top;
    let y = startY;

  // Draw header background first so images/text render on top
  doc.save();
  doc.rect(startX, y - 10, contentWidth, 80).fill('#eff6ff');
  doc.restore();

    // Always try favicon.ico first (converted to PNG), then PNG fallbacks
    const logoSize = 60; // target square fit
    const faviconPath = path.join(process.cwd(), '../frontend/public/favicon.ico');
    const pngFallbacks = [
      path.join(process.cwd(), '../frontend/public/logback.png'),
      path.join(process.cwd(), '../frontend/public/logo192.png'),
      path.join(process.cwd(), '../frontend/public/logo512.png'),
    ];

    let logoAdded = false;

    // 1) favicon.ico -> PNG buffer via sharp (if available)
    if (fs.existsSync(faviconPath)) {
      if (sharp) {
        try {
          const pngBuffer = await sharp(faviconPath).png().toBuffer();
          doc.image(pngBuffer, startX, y, { fit: [logoSize, logoSize] });
          logoAdded = true;
        } catch (e) {
          console.warn('Failed to render favicon.ico via sharp:', e.message);
        }
      } else {
        console.warn('sharp is not installed; cannot render favicon.ico directly. Falling back to PNG logos.');
      }
    }

    // 2) PNG fallbacks if favicon rendering failed
    if (!logoAdded) {
      for (const logoPath of pngFallbacks) {
        if (fs.existsSync(logoPath)) {
          try {
            doc.image(logoPath, startX, y, { fit: [logoSize, logoSize] });
            logoAdded = true;
            break;
          } catch (e) {
            console.warn(`Failed to load logo from ${logoPath}:`, e.message);
          }
        }
      }
    }

    // Company name and title
  const titleX = logoAdded ? startX + logoSize + 12 : startX;
  const titleY = logoAdded ? y + 5 : y;
    
    doc.font('Helvetica-Bold').fontSize(28).fillColor('#1e293b')
      .text('Eventrix', titleX, titleY, { width: contentWidth - (logoAdded ? 65 : 0), align: logoAdded ? 'left' : 'center' });
    
    doc.font('Helvetica-Bold').fontSize(20).fillColor('#3b82f6')
      .text('Booking Report', titleX, titleY + 32, { width: contentWidth - (logoAdded ? 65 : 0), align: logoAdded ? 'left' : 'center' });

    y += 90;

    // Report metadata bar with blue accent
    doc.save();
    doc.rect(startX, y, contentWidth, 50).fill('#f8fafc');
    doc.rect(startX, y, 5, 50).fill('#3b82f6'); // Left accent bar
    doc.restore();

    const generatedOn = new Date().toLocaleString();
    const filterLabel = status ? `Status: ${status.toUpperCase()}` : 'All Bookings';
    
    doc.font('Helvetica').fontSize(10).fillColor('#64748b')
      .text('Generated on:', startX + 15, y + 10, { continued: true })
      .font('Helvetica-Bold').fillColor('#1e293b')
      .text(` ${generatedOn}`);
    
    doc.font('Helvetica').fontSize(10).fillColor('#64748b')
      .text('Filter:', startX + 15, y + 25, { continued: true })
      .font('Helvetica-Bold').fillColor('#1e293b')
      .text(` ${filterLabel}`);

    doc.font('Helvetica').fontSize(10).fillColor('#64748b')
      .text('Generated by:', startX + contentWidth / 2 + 15, y + 10, { continued: true })
      .font('Helvetica-Bold').fillColor('#1e293b')
      .text(` ${adminName}`);
    
    doc.font('Helvetica').fontSize(10).fillColor('#64748b')
      .text('Email:', startX + contentWidth / 2 + 15, y + 25, { continued: true })
      .font('Helvetica-Bold').fillColor('#1e293b')
      .text(` ${adminEmail}`);

    y += 60;

    // --- TABLE HEADERS ---
    // Adjusted for portrait A4: Date, ID (shorter), Email, Status, Total
    const headers = ['Date', 'Booking ID', 'Customer Email', 'Status', 'Total (LKR)'];
    const colWidths = [0.15, 0.22, 0.35, 0.12, 0.16].map(f => Math.floor(f * contentWidth));
    const rowH = 28;

    const ellipsize = (text, maxWidth) => {
      const t = String(text ?? '');
      doc.font('Helvetica').fontSize(10);
      if (doc.widthOfString(t) <= maxWidth) return t;
      const ell = '…';
      let lo = 0, hi = t.length, best = '';
      while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        const cand = t.slice(0, mid) + ell;
        if (doc.widthOfString(cand) <= maxWidth) { best = cand; lo = mid + 1; } else { hi = mid; }
      }
      return best || ell;
    };

    const drawHeader = () => {
      doc.save();
      // Blue gradient effect for header
      doc.rect(startX, y, contentWidth, rowH).fill('#3b82f6');
      doc.restore();
      let x = startX;
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#ffffff');
      headers.forEach((h, i) => {
        doc.text(h, x + 4, y + 9, { width: colWidths[i] - 8, align: 'center', lineBreak: false });
        x += colWidths[i];
      });
      y += rowH;
    };

    drawHeader();

    const ensurePage = () => {
      if (y + rowH > doc.page.height - doc.page.margins.bottom) {
        doc.addPage({ size: 'A4' });
        y = startY;
        drawHeader();
      }
    };

    // --- ROWS ---
    let grandTotal = 0;
    rows.forEach((b, idx) => {
      ensurePage();
      const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
      doc.save();
      doc.rect(startX, y, contentWidth, rowH).fill(bg);
      doc.restore();

      let x = startX;
      const values = [
        new Date(b.createdAt).toLocaleDateString(),
        String(b._id).slice(-8), // Show last 8 chars of ID to save space
        b.customerEmail || '',
        b.status || '',
        (Number(b.total) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })
      ];
      grandTotal += Number(b.total) || 0;

      values.forEach((v, i) => {
        const text = ellipsize(v, colWidths[i] - 8);
        const opts = { width: colWidths[i] - 8, lineBreak: false };
        doc.font('Helvetica').fontSize(9).fillColor('#0f172a');
        if (i === 4) doc.text(text, x + 4, y + 9, { ...opts, align: 'right' });
        else if (i === 3) doc.text(text, x + 4, y + 9, { ...opts, align: 'center' });
        else doc.text(text, x + 4, y + 9, opts);
        x += colWidths[i];
      });

      doc.moveTo(startX, y + rowH).lineTo(startX + contentWidth, y + rowH).strokeColor('#e2e8f0').stroke();
      y += rowH;
    });

    // --- GRAND TOTAL ---
    ensurePage();
    y += 10;
    
    // Blue accent box for total - adjusted for portrait
    const totalBoxWidth = Math.min(250, contentWidth - 20);
    doc.save();
    doc.rect(startX + contentWidth - totalBoxWidth, y, totalBoxWidth, 35).fill('#eff6ff');
    doc.rect(startX + contentWidth - totalBoxWidth - 5, y, 5, 35).fill('#3b82f6');
    doc.restore();
    
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#1e293b')
      .text('Grand Total:', startX + contentWidth - totalBoxWidth + 10, y + 10, { continued: true })
      .fillColor('#3b82f6')
      .text(` LKR ${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);

    // --- FOOTER with Admin Info ---
    y += 50;
    ensurePage();
    
    doc.save();
    doc.rect(startX, y, contentWidth, 50).fill('#f8fafc');
    doc.rect(startX, y, contentWidth, 2).fill('#3b82f6');
    doc.restore();
    
    doc.font('Helvetica').fontSize(9).fillColor('#64748b')
      .text(`Report generated by: ${adminName} (${adminEmail})`, startX + 10, y + 12, { width: contentWidth - 20, align: 'center' });
    
    doc.font('Helvetica').fontSize(8).fillColor('#94a3b8')
      .text('Eventrix Equipment Rental System | Confidential', startX + 10, y + 30, { width: contentWidth - 20, align: 'center' });

    doc.end();
  } catch (e) {
    console.error('Admin bookings PDF export error:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /bookings/admin/upcoming?days=7 - upcoming bookings within next N days with payment method and counts
exports.adminUpcoming = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const days = Math.max(1, Math.min(30, parseInt(req.query.days || '7', 10)));

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + (days - 1));
    end.setHours(23, 59, 59, 999);

    // Fetch bookings in range by bookingDate
    const bookings = await Booking.find({
      bookingDate: { $gte: start, $lte: end },
    }).sort({ bookingDate: 1 });

    // Attach payment method
    const ids = bookings.map(b => b._id);
    const payments = ids.length ? await Payment.find({ bookingId: { $in: ids } }).select('bookingId method') : [];
    const pmap = new Map(payments.map(p => [String(p.bookingId), p.method || 'card']));

    // Group by date string (YYYY-MM-DD)
    const fmt = (d) => new Date(d).toISOString().slice(0, 10);
    const dayMap = new Map();
    for (const b of bookings) {
      const key = fmt(b.bookingDate);
      if (!dayMap.has(key)) dayMap.set(key, []);
      dayMap.get(key).push({
        _id: b._id,
        bookingDate: b.bookingDate,
        returnDate: b.returnDate,
        status: b.status,
        disputed: !!b.disputed,
        customerName: b.customerName,
        customerEmail: b.customerEmail,
        customerPhone: b.customerPhone,
        items: Array.isArray(b.items) ? b.items.map(it => ({ name: it.name, qty: it.qty, pricePerDay: it.pricePerDay })) : [],
        total: b.total,
        paymentMethod: pmap.get(String(b._id)) || 'cash',
      });
    }

    // Build continuous days array even for no bookings days
    const daysArr = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = fmt(d);
      daysArr.push({ date: key, items: dayMap.get(key) || [] });
    }

    // Counts by status across the window
    const countsByStatus = { pending: 0, confirmed: 0, cancelled: 0, disputed: 0 };
    for (const b of bookings) {
      if (countsByStatus[b.status] !== undefined) countsByStatus[b.status] += 1;
      if (b.disputed) countsByStatus.disputed += 1;
    }

    res.json({ days: daysArr, countsByStatus });
  } catch (e) {
    console.error('Admin upcoming bookings error:', e);
    res.status(500).json({ message: 'Server error' });
  }
};
