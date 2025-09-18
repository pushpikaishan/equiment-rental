
const express = require("express");
const router = express.Router();

//insert model
const Supplier = require("../Model/supplierModel");

// Import controller
const SupplierController = require("../Controllers/supplierController");

// Routes
router.get("/", SupplierController.getAllSuppliers);
router.post("/", SupplierController.addSupplier);
router.get("/:id", SupplierController.getSupplierById);
router.put("/:id", SupplierController.updateSupplier);
router.delete("/:id", SupplierController.deleteSupplier);

module.exports = router;
