const express = require('express');
const router = express.Router();
const ctrl = require('../Controllers/supplierInventoryController');
const auth = require('../middleware/authMiddleware');
const upload = require('../helpers/uploadHelper');

// Supplier-authenticated endpoints
router.post('/', auth, upload.single('image'), ctrl.create);
router.get('/mine', auth, ctrl.getMine);
router.put('/:id', auth, upload.single('image'), ctrl.update);
router.delete('/:id', auth, ctrl.remove);
// Ad renew info for supplier
router.get('/:id/renew', auth, ctrl.renewInfo);

// Public list
router.get('/public', ctrl.publicList);

module.exports = router;
