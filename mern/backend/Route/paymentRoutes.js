const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const ctrl = require('../Controllers/paymentController');

// User route: my payments (success/partial)
router.get('/my', auth, ctrl.my);

// Admin/staff routes
router.get('/', auth, ctrl.list);
router.get('/summary', auth, ctrl.summary);
router.get('/export/csv', auth, ctrl.exportCSV);
router.get('/export/pdf', auth, ctrl.exportPDF);
router.get('/:id/refund-receipt', auth, ctrl.exportRefundReceipt);
router.get('/:id', auth, ctrl.getOne);
router.put('/:id/mark-received', auth, ctrl.markReceived);
router.post('/:id/refund', auth, ctrl.refund);

module.exports = router;
