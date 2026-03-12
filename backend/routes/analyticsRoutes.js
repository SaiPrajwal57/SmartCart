const express = require('express');
const router = express.Router();
const { getAnalytics, getMostSold, getLeastSold, getDailySales, getMonthlySales } = require('../controllers/analyticsController');
const { protect, ownerOnly } = require('../middleware/authMiddleware');

router.get('/',              protect, ownerOnly, getAnalytics);
router.get('/most-sold',     protect, ownerOnly, getMostSold);
router.get('/least-sold',    protect, ownerOnly, getLeastSold);
router.get('/daily-sales',   protect, ownerOnly, getDailySales);
router.get('/monthly-sales', protect, ownerOnly, getMonthlySales);

module.exports = router;
