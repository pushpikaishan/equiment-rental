const mongoose = require("mongoose");

const equipmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    image: { type: String, default: "" }, // stored as /uploads/<filename>
    rentalPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 0 },
    category: { type: String, default: "Lighting", trim: true },
    available: { type: Boolean, default: true },
    // Track damaged units and history from recollect reports
    damagedCount: { type: Number, default: 0 },
    damageLogs: [
      new mongoose.Schema({
        at: { type: Date, default: Date.now },
        bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
        reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'Delivery' },
        qty: { type: Number, default: 0 },
        condition: { type: String, enum: ['none','minor','major'], default: 'none' },
        note: { type: String, default: '' },
        staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
      }, { _id: false })
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Equipment", equipmentSchema);
