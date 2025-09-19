
const express = require("express");
const router = express.Router();
const upload = require("../helpers/uploadHelper");

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

// Supplier profile picture upload
router.post("/:id/upload", upload.single("profileImage"), async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      { profileImage: `/uploads/${req.file.filename}` },
      { new: true }
    );
    res.status(200).json({ message: "Supplier profile picture updated", user: supplier });
  } catch (err) {
    res.status(500).json({ message: "Error uploading supplier image" });
  }
});


module.exports = router;
