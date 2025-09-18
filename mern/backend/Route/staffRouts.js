const express = require("express");
const router = express.Router();

//insert model
const Staff = require("../Model/staffModel");

// Import Staff controller
const StaffController = require("../Controllers/staffContraller");

// Route paths
router.get("/", StaffController.getAllStaff);
router.post("/", StaffController.addStaff);
router.get("/:id", StaffController.getStaffById);
router.put("/:id", StaffController.updateStaff);
router.delete("/:id", StaffController.deleteStaff);

// Export router
module.exports = router;
