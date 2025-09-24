const mongoose = require('mongoose');

const SupplierInventorySchema = new mongoose.Schema(
  {
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    image: { type: String, default: '' }, // path under /uploads
    category: { type: String, default: 'General', index: true },
    district: { type: String, default: '' },
    location: { type: String, default: '' },
    rentalPrice: { type: Number, required: true, min: [0.01, 'Rental price must be greater than 0'] },
    quantity: { type: Number, required: true, min: [1, 'Quantity must be at least 1'] },
    available: { type: Boolean, default: true },
    // Optional metadata
    specs: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SupplierInventory', SupplierInventorySchema);
