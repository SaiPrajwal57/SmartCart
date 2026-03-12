const mongoose = require('mongoose');
const billItemSchema = require('./BillItem');

const billSchema = new mongoose.Schema({
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Shop'
  },
  billItems: [billItemSchema],
  totalPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  paymentMethod: {
    type: String,
    required: true,
    default: 'Cash'
  },
  isPaid: {
    type: Boolean,
    required: true,
    default: false
  },
  paidAt: {
    type: Date
  }
}, { timestamps: true });

const Bill = mongoose.model('Bill', billSchema);
module.exports = Bill;
