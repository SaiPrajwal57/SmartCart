const Product = require('../models/Product');
const Shop = require('../models/Shop');

// Helper function to resolve and validate shopId
const getShopIdForRequest = async (req) => {
  if (req.user.role === 'staff') {
    return req.user.shopId;
  }
  
  if (req.user.role === 'owner' || req.user.role === 'admin') {
    const shopId = req.method === 'GET' || req.method === 'DELETE' ? (req.query.shopId || req.body.shopId) : req.body.shopId;
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

// @desc    Fetch all products for a given shop
// @route   GET /api/products
// @access  Private
const getProducts = async (req, res) => {
  try {
    const shopId = await getShopIdForRequest(req);
    const products = await Product.find({ shopId });
    res.json(products);
  } catch (error) {
    if (error.message === 'shopId is required' || error.message === 'Not authorized for this shop') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Private
const getProductById = async (req, res) => {
  try {
    const shopId = await getShopIdForRequest(req);
    const product = await Product.findOne({ _id: req.params.id, shopId });
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    if (error.message === 'shopId is required' || error.message === 'Not authorized for this shop') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private
const createProduct = async (req, res) => {
  try {
    const { name, price, pricePerUnit, description, stock, category, unitType, packagingOptions } = req.body;
    const shopId = await getShopIdForRequest(req);

    const product = new Product({
      name,
      price: price || pricePerUnit || 0,
      pricePerUnit: pricePerUnit || price || 0,
      description: description || '',
      stock,
      category,
      unitType: unitType || 'piece',
      packagingOptions: packagingOptions || [],
      shopId,
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    console.error('createProduct error:', error);
    if (error.message === 'shopId is required' || error.message === 'Not authorized for this shop') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private
const updateProduct = async (req, res) => {
  try {
    const { name, price, pricePerUnit, description, stock, category, unitType, packagingOptions } = req.body;
    const shopId = await getShopIdForRequest(req);

    const product = await Product.findOne({ _id: req.params.id, shopId });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (name   !== undefined) product.name   = name;
    if (price  !== undefined) { product.price = price; product.pricePerUnit = pricePerUnit || price; }
    if (pricePerUnit !== undefined) { product.pricePerUnit = pricePerUnit; product.price = price || pricePerUnit; }
    if (description !== undefined) product.description = description;
    if (stock  !== undefined) product.stock  = stock;
    if (category !== undefined) product.category = category;
    if (unitType !== undefined) product.unitType = unitType;
    if (packagingOptions !== undefined) product.packagingOptions = packagingOptions;

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    console.error('updateProduct error:', error);
    if (error.message === 'shopId is required' || error.message === 'Not authorized for this shop') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private
const deleteProduct = async (req, res) => {
  try {
    const shopId = await getShopIdForRequest(req);
    const product = await Product.findOneAndDelete({ _id: req.params.id, shopId });
    if (product) {
      res.json({ message: 'Product removed' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    if (error.message === 'shopId is required' || error.message === 'Not authorized for this shop') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get low stock products (stock < 5)
// @route   GET /api/products/low-stock
// @access  Private
const getLowStockProducts = async (req, res) => {
  try {
    const shopId = await getShopIdForRequest(req);
    const products = await Product.find({ shopId, stock: { $lt: 5 } });
    res.json(products);
  } catch (error) {
    if (error.message === 'shopId is required' || error.message === 'Not authorized for this shop') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct, getLowStockProducts };
