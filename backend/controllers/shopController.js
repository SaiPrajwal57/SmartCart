const Shop = require('../models/Shop');

// @desc    Create a new shop
// @route   POST /api/shops
// @access  Private (Owner/Admin)
const createShop = async (req, res) => {
  try {
    const { shopName, address, phone } = req.body;

    const shop = new Shop({
      ownerId: req.user._id,
      shopName,
      address,
      phone
    });

    const createdShop = await shop.save();
    res.status(201).json(createdShop);
  } catch (error) {
    console.error('createShop error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get all shops for logged in owner
// @route   GET /api/shops
// @access  Private (Owner/Admin)
const getShops = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'owner') {
      query.ownerId = req.user._id;
    }
    // Admin gets all shops
    const shops = await Shop.find(query);
    res.json(shops);
  } catch (error) {
    console.error('getShops error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete a shop
// @route   DELETE /api/shops/:id
// @access  Private (Owner/Admin)
const deleteShop = async (req, res) => {
  try {
    let query = { _id: req.params.id };
    if (req.user.role === 'owner') {
      query.ownerId = req.user._id;
    }

    const shop = await Shop.findOneAndDelete(query);
    if (shop) {
      res.json({ message: 'Shop removed' });
    } else {
      res.status(404).json({ message: 'Shop not found or you are not authorized' });
    }
  } catch (error) {
    console.error('deleteShop error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get shop by ID
// @route   GET /api/shops/:id
// @access  Private (Owner/Admin/Staff)
const getShopById = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }
    
    // Ensure the owner can only view their own shop (unless admin)
    if (req.user.role === 'owner' && shop.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this shop' });
    }

    // Ensure staff can only view the shop they are assigned to
    if (req.user.role === 'staff' && shop._id.toString() !== req.user.shopId.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this shop' });
    }
    
    res.json(shop);
  } catch (error) {
    console.error('getShopById error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update a shop
// @route   PUT /api/shops/:id
// @access  Private (Owner/Admin)
const updateShop = async (req, res) => {
  try {
    const { shopName, address, phone } = req.body;
    let query = { _id: req.params.id };
    
    if (req.user.role === 'owner') {
      query.ownerId = req.user._id;
    }

    const shop = await Shop.findOne(query);
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found or not authorized' });
    }

    shop.shopName = shopName || shop.shopName;
    shop.address = address !== undefined ? address : shop.address;
    shop.phone = phone !== undefined ? phone : shop.phone;

    const updatedShop = await shop.save();
    res.json(updatedShop);
  } catch (error) {
    console.error('updateShop error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { createShop, getShops, getShopById, updateShop, deleteShop };
