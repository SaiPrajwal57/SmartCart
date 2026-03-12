const express = require('express');
const router = express.Router();
const { createShop, getShops, getShopById, updateShop, deleteShop } = require('../controllers/shopController');
const { protect, ownerOnly, staffAccess } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, ownerOnly, createShop)
  .get(protect, ownerOnly, getShops);

router.route('/:id')
  .get(protect, staffAccess, getShopById)
  .put(protect, ownerOnly, updateShop)
  .delete(protect, ownerOnly, deleteShop);

module.exports = router;
