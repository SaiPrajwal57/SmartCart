const crypto = require('crypto');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// Strong password validation helper
const validatePassword = (password) => {
  const errors = [];
  if (!password || password.length < 8) errors.push('at least 8 characters');
  if (!/[A-Z]/.test(password))            errors.push('one uppercase letter');
  if (!/[a-z]/.test(password))            errors.push('one lowercase letter');
  if (!/[0-9]/.test(password))            errors.push('one digit');
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) errors.push('one special character');
  return errors;
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const authUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id:     user._id,
        name:    user.name,
        email:   user.email,
        role:    user.role,
        shopId:  user.shopId,
        isAdmin: user.isAdmin,
        token:   generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('authUser error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, adminKey } = req.body;

    // Validate strong password
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      return res.status(400).json({
        message: `Password must contain: ${passwordErrors.join(', ')}.`,
      });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Determine role: if adminKey is provided, it must match the env secret
    let isAdmin = false;
    if (adminKey) {
      if (!process.env.ADMIN_SECRET_KEY || adminKey !== process.env.ADMIN_SECRET_KEY) {
        return res.status(401).json({ message: 'Invalid admin key provided. Registration failed.' });
      }
      isAdmin = true;
    }

    const user = await User.create({
      name,
      email,
      password,
      role:    isAdmin ? 'admin' : 'owner',
      isAdmin: !!isAdmin,
    });

    if (user) {
      res.status(201).json({
        _id:     user._id,
        name:    user.name,
        email:   user.email,
        role:    user.role,
        shopId:  user.shopId,
        isAdmin: user.isAdmin,
        token:   generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('registerUser error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Send password reset token
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'No account found with that email' });
    }

    // Generate raw token and store hashed version in DB
    const rawToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken  = crypto.createHash('sha256').update(rawToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes
    await user.save({ validateBeforeSave: false });

    // Return raw token so the user can use it on the reset page
    res.json({
      message:    'Reset token generated. Copy the token below and use it to reset your password.',
      resetToken: rawToken,
    });
  } catch (error) {
    console.error('forgotPassword error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Reset password using token
// @route   PUT /api/auth/reset-password/:token
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken:  hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Validate strong password on reset too
    const passwordErrors = validatePassword(req.body.password);
    if (passwordErrors.length > 0) {
      return res.status(400).json({
        message: `Password must contain: ${passwordErrors.join(', ')}.`,
      });
    }

    user.password            = req.body.password;
    user.resetPasswordToken  = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: 'Password reset successful. You can now log in.' });
  } catch (error) {
    console.error('resetPassword error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { authUser, registerUser, forgotPassword, resetPassword };
