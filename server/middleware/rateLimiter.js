const rateLimit = require('express-rate-limit');

// Rate limiter for Auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs for auth routes
  message: {
    success: false,
    message: 'Too many auth requests from this IP, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for Order creation
const orderCreationLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Limit each user/IP to 10 requests per minute
  keyGenerator: (req) => {
    // Limit by user ID if authenticated, else fallback to IP
    return req.user ? req.user._id.toString() : req.ip;
  },
  message: {
    success: false,
    message: 'Too many order requests. Please wait a minute before trying again.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  authLimiter,
  orderCreationLimiter
};
