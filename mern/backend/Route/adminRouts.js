const express = require("express");
const router = express.Router();

//insert model
const Admin = require("../Model/adminModel");

// Import Admin controller
const AdminController = require("../Controllers/adminContraller");

// Route paths
router.get("/", AdminController.getAllAdmins);
router.post("/", AdminController.addAdmin);
router.get("/:id", AdminController.getAdminById);
router.put("/:id", AdminController.updateAdmin);
router.delete("/:id", AdminController.deleteAdmin);

// Export router
module.exports = router;
