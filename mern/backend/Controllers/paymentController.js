const Payment = require('../Model/paymentModel');
const PaymentAudit = require('../Model/paymentAuditModel');
const Booking = require('../Model/bookingModel');
const PDFDocument = require('pdfkit');

// Admin guard helper
function ensureAdmin(req, res) {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'staff')) {
    res.status(403).json({ message: 'Forbidden' });
    return false;
  }
  return true;
}

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
    res.json({ items, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
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
    await PaymentAudit.create({ paymentId: pay._id, action, amount: refundAmount, actorId: req.user.id, actorRole: req.user.role, note });
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
    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="payments-${Date.now()}.pdf"`);
    doc.pipe(res);
    doc.fontSize(18).text('Payments Report', { align: 'center' });
    doc.moveDown();
    items.forEach((it) => {
      doc.fontSize(10).text(`${it.createdAt} | ${it.orderId || it._id} | ${it.customerName || ''} | ${it.method} | ${it.status} | ${it.currency} ${it.amount}`);
    });
    doc.end();
  } catch (e) {
    console.error('Payments exportPDF error:', e);
    res.status(500).json({ message: 'Server error' });
  }
};
