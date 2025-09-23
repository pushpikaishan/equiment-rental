const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const ctrl = require('../Controllers/refundController');

router.get('/', auth, ctrl.list);
router.put('/:id/process', auth, ctrl.process);

module.exports = router;
