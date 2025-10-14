const Feedback = require("../Model/feedbackModel");
const User = require("../Model/userModel");
const Supplier = require("../Model/supplierModel");
const Admin = require("../Model/adminModel");
const Staff = require("../Model/staffModel");

// Public: list latest feedbacks (supports ?limit=n, max 100)
exports.list = async (req, res) => {
  try {
    const limitParam = parseInt(req.query.limit, 10);
    const limit = Number.isNaN(limitParam)
      ? 100
      : Math.max(1, Math.min(limitParam, 100));
    const items = await Feedback.find().sort({ createdAt: -1 }).limit(limit);
    res.json({ items });
  } catch (err) {
    console.error("List feedback error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Auth: list my feedbacks
exports.my = async (req, res) => {
  try {
    const items = await Feedback.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ items });
  } catch (err) {
    console.error("My feedback error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Auth: create feedback
exports.create = async (req, res) => {
  try {
    const { content, rating } = req.body;
    if (!content || !String(content).trim()) {
      return res.status(400).json({ message: "Content is required" });
    }
    // Find user display name from any account type
    let actorName = "User";
    try {
      let acc =
        (await User.findById(req.user.id)) ||
        (await Supplier.findById(req.user.id)) ||
        (await Admin.findById(req.user.id)) ||
        (await Staff.findById(req.user.id));
      if (acc) actorName = acc.name || acc.email || actorName;
    } catch (e) {}
    const item = await Feedback.create({
      userId: req.user.id,
      userName: actorName,
      content: String(content).trim(),
      rating: Number(rating) || 5,
    });
    res.status(201).json({ item });
  } catch (err) {
    console.error("Create feedback error:", err);
    res.status(400).json({ message: err.message || "Unable to create feedback" });
  }
};

// Auth: update my feedback
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const feedback = await Feedback.findById(id);
    if (!feedback) return res.status(404).json({ message: "Feedback not found" });
    if (String(feedback.userId) !== String(req.user.id)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const update = {};
    if (typeof req.body.content !== "undefined") update.content = String(req.body.content).trim();
    if (typeof req.body.rating !== "undefined") update.rating = Number(req.body.rating);
    const item = await Feedback.findByIdAndUpdate(id, { $set: update }, { new: true });
    res.json({ item });
  } catch (err) {
    console.error("Update feedback error:", err);
    res.status(400).json({ message: err.message || "Unable to update feedback" });
  }
};

// Auth: delete my feedback
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const feedback = await Feedback.findById(id);
    if (!feedback) return res.status(404).json({ message: "Feedback not found" });
    if (String(feedback.userId) !== String(req.user.id)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    await feedback.deleteOne();
    res.json({ success: true });
  } catch (err) {
    console.error("Delete feedback error:", err);
    res.status(400).json({ message: err.message || "Unable to delete feedback" });
  }
};
