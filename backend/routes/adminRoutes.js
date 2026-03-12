const express = require('express');
const router = express.Router();
const { getShops, deleteShop, getAdminStats } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/shops',       protect, adminOnly, getShops);
router.delete('/shop/:id', protect, adminOnly, deleteShop);
router.get('/stats',       protect, adminOnly, getAdminStats);

module.exports = router;
