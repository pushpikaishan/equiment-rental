const express = require("express");
const router = express.Router();
const upload = require("../helpers/uploadHelper");

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

router.post("/:id/upload", upload.single("profileImage"), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { profileImage: `/uploads/${req.file.filename}` },
      { new: true }
    );
    res.status(200).json({ message: "User profile picture updated", user });
  } catch (err) {
    res.status(500).json({ message: "Error uploading user image" });
  }
});





//export
module.exports = router;
