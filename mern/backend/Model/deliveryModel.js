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
}, { timestamps: true });

module.exports = mongoose.model('Delivery', deliverySchema);
