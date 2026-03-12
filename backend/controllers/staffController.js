const User = require('../models/User');
const Shop = require('../models/Shop');
const generateToken = require('../utils/generateToken');

// @desc    Register a new staff member for a shop
// @route   POST /api/staff
// @access  Private (Owner/Admin)
const createStaff = async (req, res) => {
  try {
    const { name, email, password, shopId } = req.body;

    // Verify shop exists and belongs to the owner (unless admin)
    const shopQuery = { _id: shopId };
    if (req.user.role === 'owner') {
      shopQuery.ownerId = req.user._id;
    }

    const shop = await Shop.findOne(shopQuery);
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found or you do not have permission' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const staff = await User.create({
      name,
      email,
      password,
      role: 'staff',
      shopId: shop._id,
      isAdmin: false
    });

    if (staff) {
      res.status(201).json({
        _id: staff._id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        shopId: staff.shopId
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('createStaff error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get staff members for a specific shop
// @route   GET /api/staff?shopId=...
// @access  Private (Owner/Admin)
const getStaff = async (req, res) => {
  try {
    const { shopId } = req.query;
    
    if (!shopId) {
      return res.status(400).json({ message: 'Shop ID is required' });
    }

    // Verify shop exists and belongs to the owner (unless admin)
    const shopQuery = { _id: shopId };
    if (req.user.role === 'owner') {
      shopQuery.ownerId = req.user._id;
    }

    const shop = await Shop.findOne(shopQuery);
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found or access denied' });
    }

    const staffList = await User.find({ shopId: shop._id, role: 'staff' }).select('-password');
    res.json(staffList);
  } catch (error) {
    console.error('getStaff error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete a staff member
// @route   DELETE /api/staff/:id?shopId=...
// @access  Private (Owner/Admin)
const deleteStaff = async (req, res) => {
  try {
    const staffId = req.params.id;
    const { shopId } = req.query;

    if (!shopId) {
       return res.status(400).json({ message: 'Shop ID is required' });
    }

    // Verify shop exists and belongs to the owner (unless admin)
    const shopQuery = { _id: shopId };
    if (req.user.role === 'owner') {
      shopQuery.ownerId = req.user._id;
    }

    const shop = await Shop.findOne(shopQuery);
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found or access denied' });
    }

    // Find the staff user to delete
    const staffUser = await User.findOne({ _id: staffId, shopId: shop._id, role: 'staff' });
    if (!staffUser) {
       return res.status(404).json({ message: 'Staff member not found in this shop' });
    }

    await User.findByIdAndDelete(staffUser._id);
    res.json({ message: 'Staff member removed' });
  } catch (error) {
    console.error('deleteStaff error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { createStaff, getStaff, deleteStaff };
