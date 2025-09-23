const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  orderId: { type: String }, // human-readable booking/order reference
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  customerName: { type: String },
  customerEmail: { type: String },
  method: { type: String, enum: ['card', 'cash', 'bank_transfer', 'paypal', 'stripe', 'payhere', 'other'], default: 'card' },
  status: { type: String, enum: ['pending', 'paid', 'failed', 'refunded', 'partial_refunded'], default: 'pending' },
  currency: { type: String, default: 'LKR' },
  amount: { type: Number, required: true, default: 0 },
  subtotal: { type: Number, default: 0 },
  deposit: { type: Number, default: 0 },
  taxes: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  transactionId: { type: String },
  gateway: { type: String }, // e.g., stripe, paypal, payhere
  invoicePath: { type: String },
  meta: { type: Object, default: {} },
}, { timestamps: true });

module.exports = mongoose.model('Payment', PaymentSchema);
