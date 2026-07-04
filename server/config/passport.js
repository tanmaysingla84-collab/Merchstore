// ─── config/passport.js ──────────────────────────────────────────────────────
// M1 Owned — Passport Google OAuth 2.0 Strategy Configuration
// Only allows Geeta University email domains

const passport       = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User           = require('../models/User');

const GU_DOMAINS = ['@geeta.ac.in', '@geetauniversity.ac.in', '@geetauniversity.edu.in', '@geeta.edu'];
const isGUEmail  = (email) => email && GU_DOMAINS.some(d => email.toLowerCase().endsWith(d));

passport.use(
  new GoogleStrategy(
    {
      clientID:     process.env.GOOGLE_CLIENT_ID     || 'dummy_id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy_secret',
      callbackURL:  process.env.GOOGLE_CALLBACK_URL  || 'http://localhost:5000/api/auth/google/callback',
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error('Google OAuth failed: No email returned from provider'), null);
        }

        // ── DOMAIN RESTRICTION ──────────────────────────────────────────────
        if (!isGUEmail(email)) {
          return done(null, false, {
            message: 'Access denied. Only Geeta University email accounts (@geeta.ac.in / @geetauniversity.ac.in / @geetauniversity.edu.in / @geeta.edu) are permitted.',
          });
        }

        // 1. Find user by googleId
        let user = await User.findOne({ googleId: profile.id });
        if (user) {
          return done(null, user);
        }

        // 2. Or find user by email and associate googleId
        user = await User.findOne({ email });
        if (user) {
          user.googleId = profile.id;
          if (!user.avatar && profile.photos?.[0]?.value) {
            user.avatar = profile.photos[0].value;
          }
          await user.save();
          return done(null, user);
        }

        // 3. Register new user from Google profile
        user = await User.create({
          name:     profile.displayName || `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim() || 'GU Student',
          email,
          googleId: profile.id,
          avatar:   profile.photos?.[0]?.value || '',
          role:     'student',
        });

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// No session serialization needed — we use stateless JWTs.
