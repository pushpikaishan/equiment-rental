const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const ctrl = require('../Controllers/paymentController');

// All routes require auth; controller enforces admin/staff
router.get('/', auth, ctrl.list);
router.get('/summary', auth, ctrl.summary);
router.get('/export/csv', auth, ctrl.exportCSV);
router.get('/export/pdf', auth, ctrl.exportPDF);
router.get('/:id', auth, ctrl.getOne);
router.put('/:id/mark-received', auth, ctrl.markReceived);
router.post('/:id/refund', auth, ctrl.refund);

module.exports = router;
