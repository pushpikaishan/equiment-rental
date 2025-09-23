const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const ctrl = require('../Controllers/bookingController');

// Admin routes (must come before dynamic :id routes)
router.get('/admin', auth, ctrl.adminList);
router.get('/admin/summary', auth, ctrl.adminSummary);
router.put('/admin/:id/cancel', auth, ctrl.adminCancel);
router.put('/admin/:id/dispute', auth, ctrl.toggleDispute);
router.get('/admin/export/csv', auth, ctrl.exportCSV);
router.get('/admin/export/pdf', auth, ctrl.exportPDF);

// Create a booking from cart snapshot
router.post('/', auth, ctrl.create);
// Get my bookings
router.get('/my', auth, ctrl.getMine);
// Update my booking before 24h cutoff
router.put('/:id', auth, ctrl.update);
// Delete my booking before 24h cutoff
router.delete('/:id', auth, ctrl.remove);

// Confirm payment (dummy) -> marks booking confirmed and generates invoice
// (removed) confirm-payment route
// Confirm booking payment -> generate invoice and notify
router.post('/:id/confirm', auth, ctrl.confirm);

module.exports = router;
