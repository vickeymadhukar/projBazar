// ─────────────────────────────────────────────────────────────────────────────
//  src/routes/auth.routes.js
//  Auth endpoints: Register · Login · Google OAuth · Logout · Profile
// ─────────────────────────────────────────────────────────────────────────────
import { Router }   from 'express';
import passport     from 'passport';
import {
  register,
  login,
  googleCallback,
  logout,
  getMe,
  updateProfile,
  uploadAvatar,
  changePassword,
} from '../controllers/auth.controller.js';
import { protect }           from '../middleware/auth.middleware.js';
import { uploadSingleImage } from '../middleware/upload.middleware.js';

const router = Router();

// ── Email / Password ──────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Body: { name, email, password }
 * Creates a new user account, sets HttpOnly cookie, returns user profile
 */
router.post('/register', register);

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Verifies credentials, sets HttpOnly cookie, returns user profile
 */
router.post('/login', login);

/**
 * POST /api/auth/logout
 * Clears the auth cookie
 */
router.post('/logout', logout);

// ── Google OAuth ──────────────────────────────────────────────────────────────

/**
 * GET /api/auth/google
 * Initiates Google OAuth — redirects user to Google consent screen
 */
router.get(
  '/google',
  passport.authenticate('google', {
    scope:   ['profile', 'email'],
    session: false,  // we use stateless JWT, not sessions
  })
);

/**
 * GET /api/auth/google/callback
 * Google redirects here after user grants permission
 * Passport verifies and calls GoogleStrategy → sets cookie → redirects to frontend
 */
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session:      false,
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=google_auth_failed`,
  }),
  googleCallback
);

// ── Protected: require valid JWT cookie ──────────────────────────────────────

/**
 * GET /api/auth/me
 * Returns the currently authenticated user's full profile
 * Used by frontend on app load to restore auth state
 */
router.get('/me', protect, getMe);

/**
 * PUT /api/auth/profile
 * Body: { name?, bio?, institution? }
 * Updates user profile fields
 */
router.put('/profile', protect, updateProfile);

/**
 * POST /api/auth/avatar
 * Multipart: field 'avatar' (image file)
 * Uploads to Cloudinary, updates user.avatar
 */
router.post('/avatar', protect, uploadSingleImage, uploadAvatar);

/**
 * PUT /api/auth/change-password
 * Body: { currentPassword, newPassword }
 * Email users only — Google users cannot set password here
 */
router.put('/change-password', protect, changePassword);

export default router;
