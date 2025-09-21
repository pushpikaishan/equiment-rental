const Inventory = require("../Model/InventoryModel");

// Display all
const getAllInventory = async (req, res, next) => {
  let inventory;

  try {
    inventory = await Inventory.find();
  } catch (err) {
    console.log(err);
  }

  if (!inventory || inventory.length === 0) {
    return res.status(404).json({ message: "Inventory not found" });
  }

  return res.status(200).json({ inventory });
};

// Insert
const addInventory = async (req, res, next) => {
  const { name, quantity, price } = req.body;

  try {
    const inventoryItem = new Inventory({ name, quantity, price });
    await inventoryItem.save();
    return res.status(200).json({ message: "Inventory added successfully", inventory: inventoryItem });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Unable to add inventory" });
  }
};

// Get by ID
const getById = async (req, res, next) => {
  const id = req.params.id;
  let inventory;

  try {
    inventory = await Inventory.findById(id);
  } catch (err) {
    console.log(err);
  }

  if (!inventory) {
    return res.status(404).json({ message: "Inventory not found" });
  }

  return res.status(200).json({ inventory });
};

// Update inventory details
const updateInventory = async (req, res, next) => {
  const id = req.params.id;
  const { name, quantity, price } = req.body;

  let inventory;

  try {
    inventory = await Inventory.findByIdAndUpdate(
      id,
      { name, quantity, price },
      { new: true } // ✅ return updated doc
    );
  } catch (err) {
    console.log(err);
  }

  if (!inventory) {
    return res.status(404).json({ message: "Unable to update inventory details" });
  }

  return res.status(200).json({ message: "Inventory updated successfully", inventory });
};

// Delete inventory details
const deleteInventory = async (req, res, next) => {
  const id = req.params.id;
  let inventory;

  try {
    inventory = await Inventory.findByIdAndDelete(id);
  } catch (err) {
    console.log(err);
  }

  if (!inventory) {
    return res.status(404).json({ message: "Unable to delete inventory details" });
  }

  return res.status(200).json({ message: "Inventory deleted successfully", inventory });
};

exports.getAllInventory = getAllInventory;
exports.addInventory = addInventory;
exports.getById = getById;
exports.updateInventory = updateInventory;
exports.deleteInventory = deleteInventory;
