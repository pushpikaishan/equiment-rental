const express = require('express');
const ActivityLog = require('../Model/activityLogModel');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

function ensureAdmin(req, res, next) {
  const role = req.user?.role;
  if (role !== 'admin' && role !== 'staff') {
    return res.status(403).json({ message: 'Admin/staff only' });
  }
  next();
}

// GET /activity - list logs with filters (admin/staff only)
router.get('/', auth, ensureAdmin, async (req, res) => {
  try {
    const { userId, email, role, action, status, from, to, page = '1', limit = '20' } = req.query;
    const q = {};
    if (userId) q.userId = userId;
    if (email) q.email = new RegExp(String(email), 'i');
    if (role) q.role = role;
    if (action) q.action = action;
    if (status) q.status = status;
    if (from || to) {
      q.createdAt = {};
      if (from) q.createdAt.$gte = new Date(from);
      if (to) { const d = new Date(to); d.setHours(23,59,59,999); q.createdAt.$lte = d; }
    }
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const lim = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const total = await ActivityLog.countDocuments(q);
    const items = await ActivityLog.find(q).sort({ createdAt: -1 }).skip((pageNum-1)*lim).limit(lim);
    res.json({ items, total, page: pageNum, limit: lim });
  } catch (e) {
    console.error('List activity error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
