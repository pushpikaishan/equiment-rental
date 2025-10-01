const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, refPath: 'role' },
  role: { type: String, enum: ['user','supplier','admin','staff'], required: false },
  email: { type: String, default: '' },
  action: { type: String, required: true },
  status: { type: String, enum: ['success','failed','info'], default: 'info' },
  ip: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  meta: { type: Object, default: {} },
}, { timestamps: { createdAt: true, updatedAt: false } });

ActivityLogSchema.index({ createdAt: -1 });
ActivityLogSchema.index({ action: 1, status: 1 });
ActivityLogSchema.index({ userId: 1, role: 1 });
ActivityLogSchema.index({ email: 1 });

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
