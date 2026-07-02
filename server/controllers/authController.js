// ─── controllers/authController.js ───────────────────────────────────────────
// M1 Owned — Authentication Controller (Local Signup/Login & Google OAuth Callback)

const User           = require('../models/User');
const generateToken  = require('../utils/generateToken');
const { asyncHandler } = require('../middleware/errorHandler');

const formatUserResponse = (user) => ({
  _id:       user._id,
  name:      user.name,
  email:     user.email,
  role:      user.role,
  phone:     user.phone || '',
  avatar:    user.avatar || '',
  addresses: user.addresses || [],
});

/**
 * POST /api/auth/register
 * Register a new user locally
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, role } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(409).json({
      success: false,
      message: 'User already exists with this email address',
    });
  }

  // Create user (password will be hashed in pre-save hook)
  const user = await User.create({
    name,
    email,
    password,
    phone,
    role: role || 'student',
  });

  const token = generateToken(user);

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: {
      token,
      user: formatUserResponse(user),
    },
  });
});

/**
 * POST /api/auth/login
 * Log in a user locally
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Explicitly select password since it has select: false by default
  const user = await User.findOne({ email }).select('+password');
  if (!user || !user.isActive) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
  }

  const token = generateToken(user);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      token,
      user: formatUserResponse(user),
    },
  });
});

/**
 * GET /api/auth/me
 * Get current authenticated user profile
 */
const getMe = asyncHandler(async (req, res) => {
  // req.user is attached by protect middleware
  res.status(200).json({
    success: true,
    data: formatUserResponse(req.user),
  });
});

/**
 * GET /api/auth/google/callback (Internal redirect handler)
 * Called by passport after Google OAuth login succeeds
 */
const googleCallback = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Google authentication failed',
    });
  }

  const token     = generateToken(req.user);
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  // Redirect to frontend with JWT token in query parameter
  res.redirect(`${clientUrl}/oauth-success?token=${token}`);
});

/**
 * POST /api/auth/address
 * Add a new address for the current user
 */
const addAddress = asyncHandler(async (req, res) => {
  const { fullName, phone, street, city, state, pincode, isDefault } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  // Handle frontend sending combined address or structured address
  let parsedFullName = fullName || user.name;
  let parsedPhone = phone || user.phone;
  let parsedStreet = street;

  if (!fullName && street && street.includes(' (Ph: ')) {
     const parts = street.split(', ');
     const namePhonePart = parts.pop();
     parsedStreet = parts.join(', ');
     const namePhoneMatch = namePhonePart.match(/(.+) \(Ph: (.+)\)/);
     if (namePhoneMatch) {
         parsedFullName = namePhoneMatch[1];
         parsedPhone = namePhoneMatch[2];
     }
  }

  const newAddress = { 
    fullName: parsedFullName || 'User', 
    phone: parsedPhone || '0000000000', 
    street: parsedStreet, 
    city, 
    state, 
    pincode, 
    isDefault: isDefault || false 
  };

  if (isDefault || !user.addresses || user.addresses.length === 0) {
    if (user.addresses) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }
    newAddress.isDefault = true;
  }

  if (!user.addresses) user.addresses = [];
  user.addresses.push(newAddress);
  
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Address added successfully',
    addresses: user.addresses
  });
});

module.exports = {
  register,
  login,
  getMe,
  googleCallback,
  addAddress,
};
