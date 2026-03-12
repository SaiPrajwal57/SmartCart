const mongoose = require('mongoose');

const billItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Product'
  },
  name:        { type: String, required: true },
  qty:         { type: Number, required: true },
  price:       { type: Number, required: true },
  // pkgQuantity: the packaging size (e.g. 500 for a 500g packet, 1 for a 1kg packet, 0 for base/loose).
  // When > 0, stock is decremented by qty × pkgQuantity instead of just qty.
  pkgQuantity: { type: Number, default: 0 },
});

module.exports = billItemSchema;

