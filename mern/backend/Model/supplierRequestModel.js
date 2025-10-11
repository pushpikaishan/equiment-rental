const mongoose = require('mongoose');

const SupplierRequestItemSchema = new mongoose.Schema({
  inventoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'SupplierInventory', required: true },
  name: { type: String, required: true },
  pricePerDay: { type: Number, required: true, min: 0 },
  qty: { type: Number, required: true, min: 1 },
});

const SupplierRequestSchema = new mongoose.Schema({
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true, index: true },
  bookingDate: { type: Date, required: true },
  returnDate: { type: Date },
  items: { type: [SupplierRequestItemSchema], required: true, validate: v => Array.isArray(v) && v.length > 0 },
  // Customer snapshot
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  customerPhone: { type: String, required: true },
  deliveryAddress: { type: String, required: true },
  notes: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'accepted', 'rejected', 'cancelled'], default: 'pending' },
  fulfillmentStatus: { type: String, enum: ['new', 'ready', 'shipped', 'returned', 'completed'], default: 'new' },
}, { timestamps: true });

module.exports = mongoose.model('SupplierRequest', SupplierRequestSchema);
