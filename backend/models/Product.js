const mongoose = require('mongoose');

const packagingOptionSchema = new mongoose.Schema({
  label:    { type: String, required: true },   // e.g. "1kg packet"
  quantity: { type: Number, default: 0 },       // no longer collected from form
  unit:     { type: String, default: '' },      // no longer collected from form
  price:    { type: Number, required: true },   // e.g. 60
  stock:    { type: Number, default: 0 },       // separate stock count for this packaging
}, { _id: false });

const productSchema = new mongoose.Schema({
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Shop',
  },
  name:        { type: String, required: true },
  category:    { type: String, required: true },
  unitType: {
    type: String,
    enum: ['piece', 'weight', 'volume'],
    default: 'piece',
  },
  price:        { type: Number, required: true, default: 0 }, // base price
  pricePerUnit: { type: Number, default: 0 },                 // alias / convenience
  stock:        { type: Number, required: true, default: 0 },
  description:  { type: String, default: '' },                // now optional
  packagingOptions: { type: [packagingOptionSchema], default: [] },
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
