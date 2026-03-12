const User = require('../models/User');
const Bill = require('../models/Bill');
const Product = require('../models/Product');

const Shop = require('../models/Shop');

// @desc    Get all shop owners (admin only)
// @route   GET /api/admin/shops
// @access  Admin
const getShops = async (req, res) => {
  try {
    const owners = await User.find({ role: 'owner' }).select('-password').lean();

    // Attach product/bill counts per shop
    const enriched = await Promise.all(
      owners.map(async (owner) => {
        const ownerShops = await Shop.find({ ownerId: owner._id }).select('_id shopName').lean();
        const shopIds = ownerShops.map(s => s._id);
        const shopNames = ownerShops.map(s => s.shopName).join(', ');

        const productCount = await Product.countDocuments({ shopId: { $in: shopIds } });
        const billCount    = await Bill.countDocuments({ shopId: { $in: shopIds } });
        const bills        = await Bill.find({ shopId: { $in: shopIds } }).lean();
        const totalRevenue = bills.reduce((acc, b) => acc + (b.totalPrice || 0), 0);
        return { ...owner, shopName: shopNames || owner.shopName, productCount, billCount, totalRevenue };
      })
    );

    res.json(enriched);
  } catch (error) {
    console.error('getShops error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete a shop owner and all its data (shops, products, bills, staff)
// @route   DELETE /api/admin/shop/:id
// @access  Admin
const deleteShop = async (req, res) => {
  try {
    const owner = await User.findById(req.params.id);
    if (!owner || owner.role === 'admin') {
      return res.status(404).json({ message: 'Shop owner not found' });
    }

    const ownerShops = await Shop.find({ ownerId: owner._id }).select('_id').lean();
    const shopIds = ownerShops.map(s => s._id);

    // Cascade delete products, bills, shops, and staff belonging to this owner
    await Product.deleteMany({ shopId: { $in: shopIds } });
    await Bill.deleteMany({ shopId: { $in: shopIds } });
    await Shop.deleteMany({ ownerId: owner._id });
    await User.deleteMany({ shopId: { $in: shopIds }, role: 'staff' });
    
    await User.findByIdAndDelete(owner._id);

    res.json({ message: 'Owner and all associated data removed' });
  } catch (error) {
    console.error('deleteShop error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Platform-wide statistics
// @route   GET /api/admin/stats
// @access  Admin
const getAdminStats = async (req, res) => {
  try {
    const totalShops    = await User.countDocuments({ role: 'owner' });
    const totalProducts = await Product.countDocuments();
    const totalBills    = await Bill.countDocuments();

    const bills        = await Bill.find().lean();
    const totalRevenue = bills.reduce((acc, b) => acc + (b.totalPrice || 0), 0);

    res.json({ totalShops, totalProducts, totalBills, totalRevenue });
  } catch (error) {
    console.error('getAdminStats error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { getShops, deleteShop, getAdminStats };
