const Payment = require('../Model/paymentModel');
const PaymentAudit = require('../Model/paymentAuditModel');
const Booking = require('../Model/bookingModel');
const Delivery = require('../Model/deliveryModel');
const PDFDocument = require('pdfkit');

// Admin guard helper
function ensureAdmin(req, res) {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'staff')) {
    res.status(403).json({ message: 'Forbidden' });
    return false;
  }
  return true;
}

// List my successful payments and refunds (user-facing)
exports.my = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const q = { userId: req.user.id, status: { $in: ['paid', 'partial_refunded', 'refunded'] } };
    const items = await Payment.find(q).sort({ createdAt: -1 });
    res.json({ items });
  } catch (e) {
    console.error('My payments error:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.list = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const { status, method, gateway, customer, orderId, from, to, page = 1, limit = 20 } = req.query;

    const q = {};
    if (status) q.status = status;
    if (method) q.method = method;
    if (gateway) q.gateway = gateway;
    if (orderId) q.orderId = orderId;
    if (customer) q.$or = [
      { customerName: { $regex: customer, $options: 'i' } },
      { customerEmail: { $regex: customer, $options: 'i' } }
    ];
    if (from || to) {
      q.createdAt = {};
      if (from) q.createdAt.$gte = new Date(from);
      if (to) q.createdAt.$lte = new Date(to);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Payment.find(q).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Payment.countDocuments(q)
    ]);

    // attach booking details for richer management view
    const bookingIds = items.map(p => p.bookingId).filter(Boolean);
    let bookingMap = new Map();
    let deliveryMap = new Map();
    if (bookingIds.length) {
      const [bookings, deliveries] = await Promise.all([
        Booking.find({ _id: { $in: bookingIds } }),
        Delivery.find({ bookingId: { $in: bookingIds } })
      ]);
      bookingMap = new Map(bookings.map(b => [String(b._id), b]));
      deliveryMap = new Map(deliveries.map(d => [String(d.bookingId), d]));
    }
    // Fetch audits for these payments to detect deposit refunds
    const paymentIds = items.map(p => p._id);
    let auditByPayment = new Map();
    if (paymentIds.length) {
      const audits = await PaymentAudit.find({ paymentId: { $in: paymentIds } }).sort({ createdAt: -1 }).lean();
      for (const a of audits) {
        const key = String(a.paymentId);
        if (!auditByPayment.has(key)) auditByPayment.set(key, []);
        auditByPayment.get(key).push(a);
      }
    }

    const itemsWithBooking = items.map(p => {
      const b = bookingMap.get(String(p.bookingId));
      const d = deliveryMap.get(String(p.bookingId));
      // Compute recollect refund suggestion if a recollect report exists
      let recollect = null;
      if (b && d && d.recollectReport && (typeof d.recollectReport === 'object')) {
        const deposit = Number(b.securityDeposit || 0);
        const estimateTotal = Number(d.recollectReport.grandTotal || 0);
        const lateFine = Number(d.recollectReport.lateFine || 0);
        const repairCostTotal = Number(d.recollectReport.repairCostTotal || 0);
        const lateDays = Number(d.recollectReport.lateDays || 0);
        const suggestedRefund = Math.max(0, deposit - estimateTotal);
        recollect = { hasReport: true, deposit, estimateTotal, suggestedRefund, lateFine, repairCostTotal, lateDays };
      }
      // Detect if a deposit refund has been processed via audit notes
      const audits = auditByPayment.get(String(p._id)) || [];
      const depositRefunded = audits.some(a => (a.action === 'partial_refund' || a.action === 'refund') && typeof a.note === 'string' && a.note.toLowerCase().includes('deposit'));
      return Object.assign(p.toObject(), {
        booking: b ? {
          _id: b._id,
          status: b.status,
          bookingDate: b.bookingDate,
          createdAt: b.createdAt,
          deliveryAddress: b.deliveryAddress || '',
          disputed: !!b.disputed,
          customerName: b.customerName,
          customerEmail: b.customerEmail,
          customerPhone: b.customerPhone,
          total: b.total,
        } : null,
        recollect,
        depositRefunded,
      });
    });

    res.json({ items: itemsWithBooking, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (e) {
    console.error('Payments list error:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getOne = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const { id } = req.params;
    const pay = await Payment.findById(id);
    if (!pay) return res.status(404).json({ message: 'Payment not found' });
    const audit = await PaymentAudit.find({ paymentId: id }).sort({ createdAt: -1 });
    res.json({ payment: pay, audit });
  } catch (e) {
    console.error('Payments getOne error:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.markReceived = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const { id } = req.params;
    const { method = 'cash', note } = req.body || {};
    const pay = await Payment.findById(id);
    if (!pay) return res.status(404).json({ message: 'Payment not found' });
    pay.status = 'paid';
    pay.method = method;
    await pay.save();
    await PaymentAudit.create({ paymentId: pay._id, action: 'marked_paid', actorId: req.user.id, actorRole: req.user.role, note });
    res.json({ payment: pay });
  } catch (e) {
    console.error('Payments markReceived error:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.refund = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const { id } = req.params;
  const { amount, note } = req.body || {};
    const pay = await Payment.findById(id);
    if (!pay) return res.status(404).json({ message: 'Payment not found' });
    const refundAmount = Number(amount || pay.amount);
    if (!refundAmount || refundAmount < 0) return res.status(400).json({ message: 'Invalid refund amount' });

    let action = 'refund';
    if (refundAmount < pay.amount) action = 'partial_refund';
    pay.status = refundAmount < pay.amount ? 'partial_refunded' : 'refunded';
  await pay.save();
  await PaymentAudit.create({ paymentId: pay._id, action, amount: refundAmount, actorId: req.user.id, actorRole: req.user.role, note: note || '' });
    res.json({ payment: pay });
  } catch (e) {
    console.error('Payments refund error:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.summary = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [totalRevenue, monthlyRevenue, dailyRevenue, byMethod] = await Promise.all([
      Payment.aggregate([{ $match: { status: { $in: ['paid', 'partial_refunded'] } } }, { $group: { _id: null, sum: { $sum: '$amount' } } } ]),
      Payment.aggregate([{ $match: { status: { $in: ['paid', 'partial_refunded'] }, createdAt: { $gte: monthStart } } }, { $group: { _id: null, sum: { $sum: '$amount' } } } ]),
      Payment.aggregate([{ $match: { status: { $in: ['paid', 'partial_refunded'] }, createdAt: { $gte: dayStart } } }, { $group: { _id: null, sum: { $sum: '$amount' } } } ]),
      Payment.aggregate([{ $group: { _id: '$method', count: { $sum: 1 } } }])
    ]);

    res.json({
      totalRevenue: totalRevenue[0]?.sum || 0,
      monthlyRevenue: monthlyRevenue[0]?.sum || 0,
      dailyRevenue: dailyRevenue[0]?.sum || 0,
      byMethod: byMethod.reduce((acc, cur) => { acc[cur._id || 'unknown'] = cur.count; return acc; }, {})
    });
  } catch (e) {
    console.error('Payments summary error:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.exportCSV = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const items = await Payment.find({}).sort({ createdAt: -1 }).lean();
    const fields = ['_id', 'orderId', 'customerName', 'customerEmail', 'method', 'status', 'currency', 'amount', 'createdAt'];
    const escape = (val) => {
      if (val === null || val === undefined) return '';
      const s = String(val);
      if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
      return s;
    };
    const header = fields.join(',');
    const rows = items.map(it => fields.map(f => escape(it[f])).join(','));
    const csv = [header, ...rows].join('\n');
    res.header('Content-Type', 'text/csv');
    res.attachment(`payments-${Date.now()}.csv`);
    res.send(csv);
  } catch (e) {
    console.error('Payments exportCSV error:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.exportPDF = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const items = await Payment.find({}).sort({ createdAt: -1 }).lean();

    // Create PDF
    const doc = new PDFDocument({ margin: 36, size: 'A4' }); // 0.5in margins
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="payments-${Date.now()}.pdf"`);
    doc.pipe(res);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = doc.page.margins.left; // assume left/right equal
    const contentWidth = pageWidth - margin * 2;

    // Title
    doc.font('Helvetica-Bold').fontSize(18).fillColor('#0f172a');
    doc.text('Payments Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(10).fillColor('#334155');
    const generatedAt = new Date().toLocaleString();
    doc.text(`Generated at: ${generatedAt}`, { align: 'center' });
    doc.moveDown(1);

    // Table header styling
    const headers = ['Created', 'Order', 'Customer', 'Method', 'Status', 'Curr', 'Amount'];
    // Column widths must sum to contentWidth
    const colWidths = [100, 90, 120, 55, 65, 35, 70]; // total 535 for A4 with 36 margins
    const startX = margin;
    let y = doc.y;

    const drawHeader = () => {
      // Header background
      doc.save();
      doc.fillColor('#e2e8f0');
      doc.rect(startX, y, contentWidth, 22).fill();
      doc.restore();
      // Header text
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#0f172a');
      let x = startX + 6;
      headers.forEach((h, idx) => {
        doc.text(h, x, y + 6, { width: colWidths[idx] - 12, ellipsis: true });
        x += colWidths[idx];
      });
      y += 22;
    };

    const truncateToWidth = (text, width, fontSize = 9, font = 'Helvetica') => {
      doc.font(font).fontSize(fontSize);
      const s = String(text ?? '');
      let out = s;
      if (doc.widthOfString(out) <= width) return out;
      const ell = '…';
      let low = 0, high = out.length;
      while (low < high) {
        const mid = Math.floor((low + high) / 2);
        const candidate = out.slice(0, mid) + ell;
        if (doc.widthOfString(candidate) <= width) low = mid + 1; else high = mid;
      }
      return out.slice(0, Math.max(0, low - 1)) + ell;
    };

    const rowHeight = 20;

    const drawRow = (row, zebra) => {
      // zebra background
      if (zebra) {
        doc.save();
        doc.fillColor('#f8fafc');
        doc.rect(startX, y, contentWidth, rowHeight).fill();
        doc.restore();
      }
      // text
      doc.font('Helvetica').fontSize(9).fillColor('#0f172a');
      let x = startX + 6;
      row.forEach((val, idx) => {
        const width = colWidths[idx] - 12;
        const alignRight = headers[idx] === 'Amount';
        const text = truncateToWidth(val, width);
        if (alignRight) {
          const tw = doc.widthOfString(text);
          doc.text(text, x + width - tw, y + 6, { width, ellipsis: true });
        } else {
          doc.text(text, x, y + 6, { width, ellipsis: true });
        }
        x += colWidths[idx];
      });
      y += rowHeight;
    };

    const ensureSpace = (next = rowHeight) => {
      if (y + next > pageHeight - margin) {
        doc.addPage();
        y = margin; // reset top
        drawHeader();
      }
    };

    // Draw initial header
    drawHeader();

    // Rows
    items.forEach((it, idx) => {
      ensureSpace();
      const created = new Date(it.createdAt).toLocaleString();
      const order = it.orderId || it._id;
      const customer = it.customerName || it.customerEmail || '';
      const method = it.method || it.gateway || '';
      const status = (it.status || '').replace(/_/g, ' ');
      const curr = it.currency || '';
      const amount = (Number(it.amount) || 0).toFixed(2);
      drawRow([created, order, customer, method, status, curr, amount], idx % 2 === 1);
    });

    // Footer note
    ensureSpace(30);
    doc.moveTo(startX, y).lineTo(startX + contentWidth, y).strokeColor('#e2e8f0').stroke();
    y += 8;
    doc.font('Helvetica-Oblique').fontSize(8).fillColor('#64748b');
    doc.text('End of report', startX, y, { align: 'left' });

    doc.end();
  } catch (e) {
    console.error('Payments exportPDF error:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

// Generate invoice PDF (for paid payments)
exports.invoice = async (req, res) => {
  try {
    const { id } = req.params;
    const pay = await Payment.findById(id).lean();
    if (!pay) return res.status(404).json({ message: 'Payment not found' });
    // Authorization: owner can access; admin/staff can access
    const isOwner = req.user && String(pay.userId) === String(req.user.id);
    const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'staff');
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Forbidden' });
    if (pay.status !== 'paid' && pay.status !== 'partial_refunded') {
      return res.status(400).json({ message: 'Invoice available only for paid or partially refunded payments' });
    }
    const doc = new PDFDocument({ margin: 36, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${pay.orderId || pay._id}.pdf"`);
    doc.pipe(res);

    doc.font('Helvetica-Bold').fontSize(20).text('INVOICE', { align: 'right' });
    doc.moveDown();
    doc.font('Helvetica').fontSize(10);
    doc.text(`Invoice No: ${pay.orderId || pay._id}`);
    doc.text(`Date: ${new Date(pay.createdAt).toLocaleString()}`);
    doc.moveDown();
    doc.text(`Billed To:`);
    doc.font('Helvetica-Bold').text(`${pay.customerName || ''}`);
    doc.font('Helvetica').text(`${pay.customerEmail || ''}`);
    doc.moveDown();
    doc.text(`Payment Method: ${pay.method || pay.gateway || 'N/A'}`);
    doc.text(`Status: ${(pay.status || '').replace(/_/g, ' ')}`);
    doc.moveDown();
    doc.font('Helvetica-Bold').text('Summary');
    doc.font('Helvetica');
    const lines = [
      ['Subtotal', `${pay.currency || 'LKR'} ${(Number(pay.subtotal || pay.amount) || 0).toFixed(2)}`],
      ['Deposit', `${pay.currency || 'LKR'} ${(Number(pay.deposit || 0) || 0).toFixed(2)}`],
      ['Taxes', `${pay.currency || 'LKR'} ${(Number(pay.taxes || 0) || 0).toFixed(2)}`],
      ['Discount', `${pay.currency || 'LKR'} ${(Number(pay.discount || 0) || 0).toFixed(2)}`],
      ['Total Paid', `${pay.currency || 'LKR'} ${(Number(pay.amount || 0) || 0).toFixed(2)}`],
    ];
    const labelWidth = 120;
    lines.forEach(([k, v]) => {
      const y = doc.y;
      doc.text(k, 36, y, { width: labelWidth });
      doc.text(v, 36 + labelWidth + 10, y);
      doc.moveDown(0.5);
    });
    doc.moveDown(2);
    doc.font('Helvetica-Oblique').fontSize(9).fillColor('#64748b').text('Thank you for your business.');
    doc.end();
  } catch (e) {
    console.error('Invoice PDF error:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

// Generate receipt PDF (for refunded payments)
exports.receipt = async (req, res) => {
  try {
    const { id } = req.params;
    const pay = await Payment.findById(id).lean();
    if (!pay) return res.status(404).json({ message: 'Payment not found' });
    // Authorization: owner can access; admin/staff can access
    const isOwner = req.user && String(pay.userId) === String(req.user.id);
    const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'staff');
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Forbidden' });
    if (pay.status !== 'refunded' && pay.status !== 'partial_refunded') {
      return res.status(400).json({ message: 'Receipt available only for refunded payments' });
    }
    // Fetch last refund audit as reference
    const lastRefund = await PaymentAudit.findOne({ paymentId: id, action: { $in: ['refund', 'partial_refund'] } }).sort({ createdAt: -1 }).lean();
    const doc = new PDFDocument({ margin: 36, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="receipt-${pay.orderId || pay._id}.pdf"`);
    doc.pipe(res);

    doc.font('Helvetica-Bold').fontSize(20).text('REFUND RECEIPT', { align: 'right' });
    doc.moveDown();
    doc.font('Helvetica').fontSize(10);
    doc.text(`Receipt No: ${pay.orderId || pay._id}`);
    doc.text(`Date: ${new Date((lastRefund?.createdAt) || pay.updatedAt || Date.now()).toLocaleString()}`);
    doc.moveDown();
    doc.text(`Customer:`);
    doc.font('Helvetica-Bold').text(`${pay.customerName || ''}`);
    doc.font('Helvetica').text(`${pay.customerEmail || ''}`);
    doc.moveDown();
    const refunded = Number(lastRefund?.amount || 0);
    const title = (pay.status === 'partial_refunded') ? 'Partial Refund Amount' : 'Refund Amount';
    const currency = pay.currency || 'LKR';
    doc.font('Helvetica-Bold').text('Summary');
    doc.font('Helvetica');
    const lines = [
      [title, `${currency} ${refunded ? refunded.toFixed(2) : (Number(pay.amount || 0)).toFixed(2)}`],
      ['Original Payment', `${currency} ${(Number(pay.amount || 0)).toFixed(2)}`],
      ['Status', (pay.status || '').replace(/_/g, ' ')],
      ['Note', lastRefund?.note || ''],
    ];
    const labelWidth = 150;
    lines.forEach(([k, v]) => {
      const y = doc.y;
      doc.text(k, 36, y, { width: labelWidth });
      doc.text(String(v), 36 + labelWidth + 10, y);
      doc.moveDown(0.5);
    });
    doc.moveDown(2);
    doc.font('Helvetica-Oblique').fontSize(9).fillColor('#64748b').text('This receipt acknowledges the refund to your original payment method.');
    doc.end();
  } catch (e) {
    console.error('Receipt PDF error:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE payment (admin/staff)
exports.remove = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const { id } = req.params;
    const pay = await Payment.findById(id);
    if (!pay) return res.status(404).json({ message: 'Payment not found' });
    await PaymentAudit.deleteMany({ paymentId: id });
    await Payment.deleteOne({ _id: id });
    res.json({ ok: true });
  } catch (e) {
    console.error('Payments remove error:', e);
    res.status(500).json({ message: 'Server error' });
  }
};
