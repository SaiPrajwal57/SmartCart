const express = require('express');
const router = express.Router();
const { createStaff, getStaff, deleteStaff } = require('../controllers/staffController');
const { protect, ownerOnly } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, ownerOnly, createStaff)
  .get(protect, ownerOnly, getStaff);

router.route('/:id')
  .delete(protect, ownerOnly, deleteStaff);

module.exports = router;
