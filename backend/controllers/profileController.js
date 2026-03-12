const User = require('../models/User');

// @desc  Get current user's profile
// @route GET /api/profile
// @access Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({
      _id:      user._id,
      name:     user.name,
      email:    user.email,
      shopName: user.shopName || '',
      address:  user.address  || '',
      phone:    user.phone    || '',
    });
  } catch (error) {
    console.error('getProfile error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc  Update current user's profile (shop details only – NOT password)
// @route PUT /api/profile
// @access Private
const updateProfile = async (req, res) => {
  try {
    const { name, shopName, address, phone } = req.body;

    // Use $set so we only touch the fields we want – no pre-save hook, no password re-hash
    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { name, shopName, address, phone } },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updated) return res.status(404).json({ message: 'User not found' });

    res.json({
      _id:      updated._id,
      name:     updated.name,
      email:    updated.email,
      shopName: updated.shopName || '',
      address:  updated.address  || '',
      phone:    updated.phone    || '',
    });
  } catch (error) {
    console.error('updateProfile error:', error);
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

module.exports = { getProfile, updateProfile };
