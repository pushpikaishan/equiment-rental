const mongoose = require('mongoose');

const twoFactorSettingsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  role: { type: String, required: true },
  email: { type: String, required: true },
  enabled: { type: Boolean, default: false },
}, { timestamps: true });

twoFactorSettingsSchema.index({ userId: 1, role: 1 }, { unique: true });

module.exports = mongoose.model('TwoFactorSettings', twoFactorSettingsSchema);
