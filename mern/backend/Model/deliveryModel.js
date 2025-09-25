const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
  vehicle: { type: String, default: '' },
  driver: { type: String, default: '' },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  driverEmail: { type: String, default: '' },
  status: { type: String, enum: ['unassigned', 'assigned', 'in-progress', 'delivered', 'failed'], default: 'unassigned' },
  assignedAt: { type: Date },
  deliveredAt: { type: Date },
  // Recollection task fields (pickup after delivery)
  recollectStatus: { type: String, enum: ['none', 'assigned', 'accepted', 'in-progress', 'report_submitted', 'returned', 'completed', 'rejected'], default: 'none' },
  recollectDriverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  recollectDriver: { type: String, default: '' },
  recollectAssignedAt: { type: Date },
  recollectedAt: { type: Date },
  recollectReport: {
    items: [
      new mongoose.Schema({
        equipmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment' },
        name: { type: String },
        expectedQty: { type: Number },
        collectedQty: { type: Number },
        condition: { type: String, enum: ['none', 'minor', 'major'], default: 'none' },
        damagedQty: { type: Number, default: 0 },
        repairCost: { type: Number, default: 0 },
        note: { type: String, default: '' },
      }, { _id: false })
    ],
    actualReturnDate: { type: Date },
    comment: { type: String, default: '' },
    repairCostTotal: { type: Number, default: 0 },
    lateDays: { type: Number, default: 0 },
    lateFine: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    createdAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  },
  // Live driver location for tracking
  driverLocation: {
    lat: { type: Number },
    lng: { type: Number },
    accuracy: { type: Number },
    updatedAt: { type: Date }
  }
}, { timestamps: true });

module.exports = mongoose.model('Delivery', deliverySchema);
