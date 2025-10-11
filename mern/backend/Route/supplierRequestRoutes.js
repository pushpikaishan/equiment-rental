const express = require('express');
const router = express.Router();
const ctrl = require('../Controllers/supplierRequestController');
const auth = require('../middleware/authMiddleware');

// Create requests (user-auth)
router.post('/', auth, ctrl.create);

// Supplier: view own incoming requests
router.get('/mine', auth, ctrl.getMine);

// Supplier: update status
router.put('/:id/status', auth, ctrl.updateStatus);

// Supplier: update fulfillment progress
router.put('/:id/progress', auth, ctrl.updateProgress);

module.exports = router;
