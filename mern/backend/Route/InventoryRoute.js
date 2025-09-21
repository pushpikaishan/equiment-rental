const express = require("express");
const router = express.Router();

//insert model
const Invenory = require("../Model/InventoryModel")

//insert inventory controller
const InvenoryController  = require("../Controllers/InventoryController");

router.get("/",InvenoryController.getAllInventory);
router.post("/",InvenoryController.addInventory);
router.get("/:id",InvenoryController.getById);
router.put("/:id",InvenoryController.updateInventory);
router.delete("/:id",InvenoryController.deleteInventory);

//export
module.exports = router;