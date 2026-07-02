// ─── utils/generateToken.js ──────────────────────────────────────────────────
// M1 Owned — Sign JWT tokens containing user details

const jwt = require('jsonwebtoken');

/**
 * Sign a stateless JWT for a user
 * @param {Object} user - User document or payload containing _id, email, and role
 * @returns {string} Signed JWT
 */
const generateToken = (user) => {
  const payload = {
    id:    user._id.toString(),
    email: user.email,
    role:  user.role,
  };

  const secret  = process.env.JWT_SECRET || 'fallback_secret_min_32_chars';
  const expires = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(payload, secret, { expiresIn: expires });
};

module.exports = generateToken;
