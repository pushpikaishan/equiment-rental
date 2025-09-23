const Refund = require('../Model/refundModel');
const Booking = require('../Model/bookingModel');

function ensureAdmin(req, res) {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'staff')) {
    res.status(403).json({ message: 'Forbidden' });
    return false;
  }
  return true;
}

// GET /refunds - list refunds
exports.list = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const { status, page = 1, limit = 20 } = req.query || {};
    const q = {};
    if (status) q.status = status;
    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Refund.find(q).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).populate('bookingId').populate('paymentId'),
      Refund.countDocuments(q)
    ]);
    res.json({ items, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (e) {
    console.error('Refunds list error:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /refunds/:id/process - mark refund processed
exports.process = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const { id } = req.params;
    const refund = await Refund.findById(id);
    if (!refund) return res.status(404).json({ message: 'Refund not found' });
    refund.status = 'processed';
    await refund.save();
    res.json({ refund });
  } catch (e) {
    console.error('Refunds process error:', e);
    res.status(500).json({ message: 'Server error' });
  }
};
