const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const supplierSchema = new Schema({
  companyName: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  district: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, default: "supplier" },
  profileImage: { type: String, default: "" }
});

//Creates "suppliers" collection
module.exports = mongoose.model("Supplier", supplierSchema);
