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
  },
  { timestamps: true }
);

module.exports = mongoose.model("Equipment", equipmentSchema);
