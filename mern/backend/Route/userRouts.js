const express = require("express");
const router = express.Router();

//insert model
const User = require("../Model/userModel");

//inser controller
const UserController = require("../Controllers/userContraller");


//routhpath...
router.get("/",UserController.getAllusers);
router.post("/",UserController.addUser);
router.get("/:id",UserController.getById);
router.put("/:id",UserController.updateUser);
router.delete("/:id",UserController.deleteUser);


//export
module.exports = router;
