const Bill = require('../models/Bill');
const Product = require('../models/Product');
const Shop = require('../models/Shop');

// Helper function to resolve and validate shopId
const getShopIdForRequest = async (req) => {
  if (req.user.role === 'staff') {
    return req.user.shopId;
  }
  
  if (req.user.role === 'owner' || req.user.role === 'admin') {
    const shopId = req.method === 'GET' ? (req.query.shopId || req.body.shopId) : req.body.shopId;
    if (!shopId) {
      throw new Error('shopId is required');
    }
    
    if (req.user.role === 'owner') {
      const shop = await Shop.findOne({ _id: shopId, ownerId: req.user._id });
      if (!shop) {
        throw new Error('Not authorized for this shop');
      }
    }
    return shopId;
  }
  
  throw new Error('Unauthorized role');
};

// @desc    Create new bill & update inventory stock
// @route   POST /api/bills
// @access  Private
const addBillItems = async (req, res) => {
  try {
    const { billItems, paymentMethod, totalPrice } = req.body;
    const shopId = await getShopIdForRequest(req);

    if (!billItems || billItems.length === 0) {
      return res.status(400).json({ message: 'No bill items' });
    }

    // ── Stock validation: reject the entire bill if any item exceeds stock ──
    for (const item of billItems) {
      const product = await Product.findOne({ _id: item.product, shopId });
      if (!product) {
        return res.status(404).json({ message: `Product not found or doesn't belong to this shop: ${item.name}` });
      }

      if (item.packageLabel) {
        const pkg = product.packagingOptions.find(p => p.label === item.packageLabel);
        if (!pkg) {
          return res.status(400).json({ message: `Packaging "${item.packageLabel}" not found for ${product.name}` });
        }
        if (item.qty > (pkg.stock ?? 0)) {
          return res.status(400).json({
            message: `Insufficient stock for ${product.name} (${item.packageLabel}): only ${pkg.stock ?? 0} available, requested ${item.qty}`,
          });
        }
      } else {
        if (item.qty > product.stock) {
          return res.status(400).json({
            message: `Insufficient stock for ${product.name}: only ${product.stock} available, requested ${item.qty}`,
          });
        }
      }
    }

    const bill = new Bill({
      billItems,
      shopId,
      paymentMethod,
      totalPrice,
      isPaid: true,
      paidAt: new Date(),
    });

    const createdBill = await bill.save();

    // Inventory Management: Update Stock
    for (const item of billItems) {
      const product = await Product.findOne({ _id: item.product, shopId });
      if (!product) continue;

      if (item.packageLabel) {
        // ── Packaged sale: deduct from that packaging option's own stock ──
        const pkgIdx = product.packagingOptions.findIndex(p => p.label === item.packageLabel);
        if (pkgIdx !== -1) {
          product.packagingOptions[pkgIdx].stock = Math.max(
            0,
            product.packagingOptions[pkgIdx].stock - item.qty
          );
          // Tell Mongoose the subdocument array was modified
          product.markModified('packagingOptions');
        }
      } else {
        // ── Loose sale: deduct directly from base product stock ──
        product.stock = Math.max(0, product.stock - item.qty);
      }

      await product.save();
    }

    res.status(201).json(createdBill);
  } catch (error) {
    console.error('addBillItems error:', error);
    if (error.message === 'shopId is required' || error.message === 'Not authorized for this shop') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get all bills for the shop
// @route   GET /api/bills
// @access  Private
const getBills = async (req, res) => {
  try {
    const shopId = await getShopIdForRequest(req);
    const bills = await Bill.find({ shopId })
      .sort({ createdAt: -1 })
      .lean();
    res.json(bills);
  } catch (error) {
    if (error.message === 'shopId is required' || error.message === 'Not authorized for this shop') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get bill by ID
// @route   GET /api/bills/:id
// @access  Private
const getBillById = async (req, res) => {
  try {
    const shopId = await getShopIdForRequest(req);
    const bill = await Bill.findOne({ _id: req.params.id, shopId });
    if (bill) {
      res.json(bill);
    } else {
      res.status(404).json({ message: 'Bill not found' });
    }
  } catch (error) {
    if (error.message === 'shopId is required' || error.message === 'Not authorized for this shop') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { addBillItems, getBills, getBillById };
