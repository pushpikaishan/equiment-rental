const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Schema definition
const InventorySchema = new Schema({
  name: {
    type: String, // dataType
    required: true, // Validation
  },
  quantity: {
    type: Number, 
    required: true, 
  },
  price: {
    type: Number, 
    required: true, 
  },
});

// Export model
const Inventory = mongoose.model("Inventory", InventorySchema);
module.exports = Inventory; 
