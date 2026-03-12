const Bill = require('../models/Bill');
const Product = require('../models/Product');
const Shop = require('../models/Shop');
const mongoose = require('mongoose');

// Helper function to resolve and validate shopId
const getShopIdForRequest = async (req) => {
  if (req.user.role === 'owner' || req.user.role === 'admin') {
    const shopId = req.query.shopId;
    if (!shopId) {
      throw new Error('shopId is required');
    }
    
    if (req.user.role === 'owner') {
      const shop = await Shop.findOne({ _id: shopId, ownerId: req.user._id });
      if (!shop) {
        throw new Error('Not authorized for this shop');
      }
    }
    return new mongoose.Types.ObjectId(shopId);
  }
  
  throw new Error('Unauthorized role');
};

// @desc    Get comprehensive analytics data (for dashboard)
// @route   GET /api/analytics
// @access  Private (Owner/Admin)
const getAnalytics = async (req, res) => {
  try {
    const shopId = await getShopIdForRequest(req);

    const totalBills    = await Bill.countDocuments({ shopId });
    const totalProducts = await Product.countDocuments({ shopId });

    const bills = await Bill.find({ shopId });
    const totalRevenue = bills.reduce((acc, bill) => acc + bill.totalPrice, 0);

    const productSales = await Bill.aggregate([
      { $match: { shopId } },
      { $unwind: '$billItems' },
      {
        $group: {
          _id: '$billItems.product',
          name: { $first: '$billItems.name' },
          totalQuantitySold: { $sum: '$billItems.qty' },
          totalRevenueGenerated: { $sum: { $multiply: ['$billItems.qty', '$billItems.price'] } },
        },
      },
      { $sort: { totalQuantitySold: -1 } },
    ]);

    const mostSoldProducts  = productSales.slice(0, 5);
    const leastSoldProducts = [...productSales].reverse().slice(0, 5);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyRevenue = await Bill.aggregate([
      { $match: { shopId, createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalPrice' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({ totalBills, totalProducts, totalRevenue, mostSoldProducts, leastSoldProducts, dailyRevenue });
  } catch (error) {
    if (error.message === 'shopId is required' || error.message === 'Not authorized for this shop') {
      return res.status(400).json({ message: error.message });
    }
    console.error('getAnalytics error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Most sold products
// @route   GET /api/analytics/most-sold
// @access  Private (Owner/Admin)
const getMostSold = async (req, res) => {
  try {
    const shopId = await getShopIdForRequest(req);
    const data = await Bill.aggregate([
      { $match: { shopId } },
      { $unwind: '$billItems' },
      {
        $group: {
          _id: '$billItems.product',
          name: { $first: '$billItems.name' },
          totalQuantitySold: { $sum: '$billItems.qty' },
          totalRevenue: { $sum: { $multiply: ['$billItems.qty', '$billItems.price'] } },
        },
      },
      { $sort: { totalQuantitySold: -1 } },
      { $limit: 10 },
    ]);
    res.json(data);
  } catch (error) {
    if (error.message === 'shopId is required' || error.message === 'Not authorized for this shop') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Least sold products
// @route   GET /api/analytics/least-sold
// @access  Private (Owner/Admin)
const getLeastSold = async (req, res) => {
  try {
    const shopId = await getShopIdForRequest(req);
    const data = await Bill.aggregate([
      { $match: { shopId } },
      { $unwind: '$billItems' },
      {
        $group: {
          _id: '$billItems.product',
          name: { $first: '$billItems.name' },
          totalQuantitySold: { $sum: '$billItems.qty' },
          totalRevenue: { $sum: { $multiply: ['$billItems.qty', '$billItems.price'] } },
        },
      },
      { $sort: { totalQuantitySold: 1 } },
      { $limit: 10 },
    ]);
    res.json(data);
  } catch (error) {
    if (error.message === 'shopId is required' || error.message === 'Not authorized for this shop') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Daily sales for past 7 days
// @route   GET /api/analytics/daily-sales
// @access  Private (Owner/Admin)
const getDailySales = async (req, res) => {
  try {
    const shopId = await getShopIdForRequest(req);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const data = await Bill.aggregate([
      { $match: { shopId, createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalPrice' },
          bills: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    res.json(data);
  } catch (error) {
    if (error.message === 'shopId is required' || error.message === 'Not authorized for this shop') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Monthly sales for past 12 months
// @route   GET /api/analytics/monthly-sales
// @access  Private (Owner/Admin)
const getMonthlySales = async (req, res) => {
  try {
    const shopId = await getShopIdForRequest(req);
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const data = await Bill.aggregate([
      { $match: { shopId, createdAt: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          revenue: { $sum: '$totalPrice' },
          bills: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    res.json(data);
  } catch (error) {
    if (error.message === 'shopId is required' || error.message === 'Not authorized for this shop') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { getAnalytics, getMostSold, getLeastSold, getDailySales, getMonthlySales };
