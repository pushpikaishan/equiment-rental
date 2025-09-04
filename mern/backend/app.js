const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");


// Import route files

const userRoutes = require("./Route/userRouts");
const supplierRoutes = require("./Route/supplierRouts");
const staffRoutes = require("./Route/staffRouts");
const adminRoutes = require("./Route/adminRouts");
const authRoutes = require("./Route/authRouts");
const getAllRouts = require("./Route/getUserRoute");

const app = express();

// Middleware
app.use(express.json());
app.use(cors());



app.use("/users", userRoutes);
app.use("/suppliers", supplierRoutes);
app.use("/staff", staffRoutes);
app.use("/admins", adminRoutes);

app.use("/auth", authRoutes);
app.use("/getall", getAllRouts);

// Connect to MongoDB
const MONGO_URI = "mongodb+srv://it23817876:5S2Wjk5pSmgOehvX@cluster0.kmidshm.mongodb.net/YOUR_DB_NAME?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .then(() => {
    app.listen(5000, () => console.log("Server running on port 5000"));
  })
  .catch((err) => console.log("MongoDB connection error:", err));
