const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const staffSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phoneno: { type: String, required: true },
  nicNo: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "staff" } 
});
module.exports = mongoose.model("Staff", staffSchema);
