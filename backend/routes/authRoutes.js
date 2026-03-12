const express = require('express');
const router = express.Router();
const {
  authUser,
  registerUser,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');

router.post('/register',          registerUser);
router.post('/login',             authUser);
router.post('/forgot-password',   forgotPassword);
router.put('/reset-password/:token', resetPassword);

module.exports = router;
