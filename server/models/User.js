// ─── models/User.js ───────────────────────────────────────────────────────────
// Schema owned by M1 — M2 reads only (for order userId, review userId, analytics)

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const addressSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  phone:    { type: String, required: true },
  street:   { type: String, required: true },
  city:     { type: String, required: true },
  state:    { type: String, required: true },
  pincode:  { type: String, required: true },
  isDefault: { type: Boolean, default: false },
}, { _id: true });

const userSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true, index: true },
  password:  { type: String, select: false },
  role:      { type: String, enum: ['student', 'faculty', 'admin'], default: 'student' },
  googleId:  { type: String, sparse: true },
  addresses: [addressSchema],
  avatar:    { type: String, default: '' },
  phone:     { type: String, default: '' },
  isActive:  { type: Boolean, default: true },
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Virtual: initials for avatar fallback
userSchema.virtual('initials').get(function () {
  return this.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
});

module.exports = mongoose.model('User', userSchema);
