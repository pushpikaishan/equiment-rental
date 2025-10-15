const express = require('express');
const router = express.Router();
const ctrl = require('../Controllers/supplierRequestController');
const auth = require('../middleware/authMiddleware');

// Create requests (user-auth)
router.post('/', auth, ctrl.create);

// Supplier: view own incoming requests
router.get('/mine', auth, ctrl.getMine);

// Customer: view own supplier requests
router.get('/my', auth, ctrl.getMy);

// Supplier: update status
router.put('/:id/status', auth, ctrl.updateStatus);

// Supplier: update fulfillment progress
router.put('/:id/progress', auth, ctrl.updateProgress);

// Customer: update/cancel own pending request
router.put('/:id/user-update', auth, ctrl.userUpdate);
router.put('/:id/cancel-by-user', auth, ctrl.cancelByUser);

// Supplier: export reports (CSV/PDF)
router.get('/export/csv', auth, ctrl.exportCSV);
router.get('/export/pdf', auth, ctrl.exportPDF);

module.exports = router;
