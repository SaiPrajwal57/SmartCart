const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['admin', 'owner', 'staff'],
    default: 'staff',
  },
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop'
  },
  // isAdmin is kept for backward compat with existing middleware
  isAdmin:  { type: Boolean, required: true, default: false },
  // Shop profile (legacy, should probably be moved to Shop model but kept for now)
  shopName: { type: String, default: '' },
  address:  { type: String, default: '' },
  phone:    { type: String, default: '' },
  // Password reset
  resetPasswordToken:  { type: String },
  resetPasswordExpire: { type: Date },
}, { timestamps: true });

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre('save', async function () {
  // Keep role and isAdmin in sync
  if (this.isModified('role')) {
    this.isAdmin = this.role === 'admin';
  } else if (this.isModified('isAdmin')) {
    this.role = this.isAdmin ? 'admin' : 'owner';
  }

  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);
module.exports = User;
