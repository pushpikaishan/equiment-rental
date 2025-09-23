const mongoose = require('mongoose');

const PaymentAuditSchema = new mongoose.Schema({
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', required: true },
  action: { type: String, required: true }, // created, marked_paid, refund, partial_refund, export, update
  amount: { type: Number },
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  actorRole: { type: String },
  note: { type: String },
  meta: { type: Object, default: {} },
}, { timestamps: true });

module.exports = mongoose.model('PaymentAudit', PaymentAuditSchema);
