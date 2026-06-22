// ─────────────────────────────────────────────────────────────────────────────
//  src/config/passport.js
//  Passport.js Google OAuth 2.0 strategy
//
//  Flow:
//    GET /api/auth/google → passport.authenticate('google') → Google consent
//    GET /api/auth/google/callback → passport.authenticate callback
//    → findOrCreate User → generateToken → set HttpOnly cookie → redirect
// ─────────────────────────────────────────────────────────────────────────────
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.model.js';

const configurePassport = () => {
  passport.use(
    new GoogleStrategy(
      {
        clientID:     process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:  process.env.GOOGLE_CALLBACK_URL ||
                      'http://localhost:5000/api/auth/google/callback',
        scope: ['profile', 'email'],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email     = profile.emails?.[0]?.value;
          const googleId  = profile.id;
          const name      = profile.displayName;
          const avatar    = profile.photos?.[0]?.value || null;

          if (!email) {
            return done(new Error('Google account has no email address'), null);
          }

          // Try to find by googleId first, then by email (for existing email users)
          let user = await User.findOne({ googleId });

          if (!user) {
            // Check if an email-registered user exists — link accounts
            user = await User.findOne({ email });

            if (user) {
              // Link Google to existing email account
              user.googleId = googleId;
              if (!user.avatar) user.avatar = avatar;
              await user.save();
            } else {
              // Brand new user — create account
              user = await User.create({
                googleId,
                name,
                email,
                avatar,
                // No password — Google users authenticate via OAuth
              });
            }
          }

          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );

  // We are NOT using sessions (stateless JWT auth)
  // These are required by Passport but unused in stateless mode
  passport.serializeUser((user, done) => done(null, user._id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });

  console.log('✅ Passport Google Strategy configured');
};

export default configurePassport;
