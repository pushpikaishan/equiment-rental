const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

// Import route files

const userRoutes = require("./Route/userRouts");
const supplierRoutes = require("./Route/supplierRouts");
const staffRoutes = require("./Route/staffRouts");
const adminRoutes = require("./Route/adminRouts");
const authRoutes = require("./Route/authRouts");
const equipmentRoutes = require("./Route/equipmentRouts");
const bookingRoutes = require("./Route/bookingRoutes");
const paymentRoutes = require("./Route/paymentRoutes");
const feedbackRoutes = require("./Route/feedbackRoutes");


const app = express();

// Middleware
app.use(express.json());
app.use(cors());



app.use("/users", userRoutes);
app.use("/suppliers", supplierRoutes);
app.use("/staff", staffRoutes);
app.use("/admins", adminRoutes);

app.use("/auth", authRoutes);
app.use("/equipment", equipmentRoutes);
app.use("/bookings", bookingRoutes);
app.use("/payments", paymentRoutes);
app.use("/feedback", feedbackRoutes);
// notifications route removed per revert request
app.use("/uploads", express.static(path.join(__dirname, "uploads")));



const PORT = process.env.PORT || 5000;
// Connect to MongoDB


mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch(err => console.error("❌ DB Connection Error:", err));
