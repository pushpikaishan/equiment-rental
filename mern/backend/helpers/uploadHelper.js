// helpers/uploadHelper.js
const multer = require("multer");
const path = require("path");

// Storage config (reusable)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // saved in uploads folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // unique file name
  },
});

const upload = multer({ storage: storage });

module.exports = upload;
