// ─── routes/authRoutes.js ─────────────────────────────────────────────────────
// M1 Owned — Authentication Routing (Register, Login, Me, and Google OAuth)

const router   = require('express').Router();
const passport = require('passport');
const validate = require('../middleware/validate');
const { protect, requireAdmin } = require('../middleware/authMiddleware');
const { registerSchema, loginSchema } = require('../validators/authValidator');
const {
  register,
  login,
  getMe,
  googleCallback,
  addAddress,
  getAllUsers,
  unrestrictUser,
} = require('../controllers/authController');

// Local auth routes
router.post('/register', validate(registerSchema), register);
router.post('/login',    validate(loginSchema),    login);

// Google OAuth routes
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=google_auth_failed`,
  }),
  googleCallback
);

// Profile endpoint
router.get('/me', protect, getMe);

// Address endpoint
router.post('/address', protect, addAddress);

// Admin-only route to list all users
router.get('/admin/users', protect, requireAdmin, getAllUsers);

// Admin-only route to unrestrict a user
router.put('/admin/users/:id/unrestrict', protect, requireAdmin, unrestrictUser);

module.exports = router;
