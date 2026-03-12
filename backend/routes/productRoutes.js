const express = require('express');
const router = express.Router();
const { getProducts, getProductById, createProduct, updateProduct, deleteProduct, getLowStockProducts } = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');

// IMPORTANT: /low-stock must be defined BEFORE /:id to avoid being caught by the param route
router.get('/low-stock', protect, getLowStockProducts);

router.route('/').get(protect, getProducts).post(protect, createProduct);
router.route('/:id')
  .get(protect, getProductById)
  .put(protect, updateProduct)
  .delete(protect, deleteProduct);

module.exports = router;
