const mongoose = require('mongoose');

const refundSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  amount: { type: Number, required: true },
  reason: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'processed'], default: 'pending' },
}, { timestamps: true });

module.exports = mongoose.model('Refund', refundSchema);
