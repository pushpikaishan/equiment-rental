const mongoose = require('mongoose');

const BookingItemSchema = new mongoose.Schema({
  equipmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment', required: true },
  name: { type: String, required: true },
  pricePerDay: { type: Number, required: true },
  qty: { type: Number, required: true, min: 1 },
});

const BookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'userRole' },
  userRole: { type: String, enum: ['user', 'supplier', 'staff', 'admin'], required: true },
  bookingDate: { type: Date, required: true },
  items: { type: [BookingItemSchema], required: true, validate: v => Array.isArray(v) && v.length > 0 },
  // Customer snapshot (for contact on this booking)
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  customerPhone: { type: String, required: true },
  deliveryAddress: { type: String, required: true },
  notes: { type: String, default: '' },
  returnDate: { type: Date },
  subtotal: { type: Number, required: true, min: 0 },
  securityDeposit: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
  // Admin management fields
  disputed: { type: Boolean, default: false },
  disputeNote: { type: String, default: '' },
  cancelledAt: { type: Date },
  cancelReason: { type: String, default: '' },
  cancelledByRole: { type: String, enum: ['user', 'supplier', 'staff', 'admin', 'system'], default: undefined },
  cancelledById: { type: mongoose.Schema.Types.ObjectId, refPath: 'cancelledByRole' },
}, { timestamps: true });

module.exports = mongoose.model('Booking', BookingSchema);
