const express = require('express');
const router = express.Router();
const { addBillItems, getBills, getBillById } = require('../controllers/billController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getBills).post(protect, addBillItems);
router.route('/:id').get(protect, getBillById);

module.exports = router;
