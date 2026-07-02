// ─── middleware/authMiddleware.js ──────────────────────────────────────────────
// Owned by M1 — M2 imports `protect` and `requireAdmin` but never edits this file

const jwt  = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware: Verify JWT Bearer token and attach req.user
 */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized — no token provided',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch fresh user (checks if account still active)
    const user = await User.findById(decoded.id).select('-password');

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or account deactivated',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

/**
 * Middleware: Require admin role (must follow `protect`)
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied — admin only',
    });
  }
  next();
};

/**
 * Optional auth — attaches req.user if token present, but doesn't block
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token   = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user    = await User.findById(decoded.id).select('-password');
      if (user && user.isActive) req.user = user;
    }
  } catch (_) {
    // silent — optional auth never blocks
  }
  next();
};

module.exports = { protect, requireAdmin, optionalAuth };
