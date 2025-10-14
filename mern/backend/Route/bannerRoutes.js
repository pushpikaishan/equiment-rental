const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const upload = require('../helpers/uploadHelper');
const Banner = require('../Model/bannerModel');

// Public: list banners (for homepage)
router.get('/', async (req, res) => {
  try {
    const list = await Banner.find({}).sort({ createdAt: -1 }).lean();
    res.json({ items: list });
  } catch (e) {
    res.status(500).json({ message: 'Failed to list banners' });
  }
});

// Admin: create (file upload or bannerUrl)
router.post('/', auth, upload.single('banner'), async (req, res) => {
  try {
    // basic role check if token contains role
    if (req.user?.role && req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    const { bannerUrl, title, alt } = req.body;
    let imagePath = null;
    if (req.file) imagePath = `/uploads/${req.file.filename}`;
    if (!imagePath && bannerUrl) imagePath = bannerUrl;
    if (!imagePath) return res.status(400).json({ message: 'No banner provided' });
    const saved = await Banner.create({ image: imagePath, title, alt, createdBy: req.user?.id });
    res.status(201).json(saved);
  } catch (e) {
    res.status(500).json({ message: 'Failed to create banner' });
  }
});

// Admin: delete
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user?.role && req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    const del = await Banner.findByIdAndDelete(req.params.id);
    if (!del) return res.status(404).json({ message: 'Not found' });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: 'Failed to delete banner' });
  }
});

module.exports = router;
