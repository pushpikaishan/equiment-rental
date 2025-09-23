const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const ctrl = require('../Controllers/deliveryController');

router.get('/admin', auth, ctrl.adminList);
router.get('/admin/drivers', auth, ctrl.listDrivers);
router.post('/admin/:bookingId/assign', auth, ctrl.assign);
router.put('/admin/:bookingId/complete', auth, ctrl.complete);
router.post('/admin/:bookingId/recollect/assign', auth, ctrl.assignRecollect);
router.put('/admin/:bookingId/recollect/returned', auth, ctrl.markRecollectReturned);
router.delete('/admin', auth, ctrl.purgeAll);
// User: list my deliveries
router.get('/user/my', auth, ctrl.userList);

// Driver dashboard: list deliveries assigned to the logged-in staff
router.get('/driver/my', auth, async (req, res) => {
	try {
		if (req.user?.role !== 'staff') return res.status(403).json({ message: 'Staff only' });
		const deliveries = await require('../Model/deliveryModel')
			.find({ driverId: req.user.id })
			.sort({ createdAt: -1 })
			.populate('bookingId');
		res.json({ deliveries });
	} catch (e) {
		console.error('Driver my deliveries error:', e);
		res.status(500).json({ message: 'Server error' });
	}
});

// Staff can update their own assigned delivery status
router.put('/driver/:bookingId/status', auth, ctrl.updateByDriver);
// Staff recollect task: list and update
router.get('/driver/recollect/my', auth, ctrl.driverRecollectList);
router.put('/driver/:bookingId/recollect/status', auth, ctrl.updateRecollectByDriver);
router.post('/driver/:bookingId/recollect/report', auth, ctrl.submitRecollectReport);

module.exports = router;
