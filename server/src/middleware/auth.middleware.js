// ─────────────────────────────────────────────────────────────────────────────
//  src/middleware/auth.middleware.js
//  JWT authentication via HttpOnly Cookie
//
//  Flow:
//    1. Read 'token' from req.cookies (set by login / Google callback)
//    2. Verify JWT with jsonwebtoken
//    3. Fetch user from MongoDB (ensures user still exists and is up-to-date)
//    4. Attach to req.user
// ─────────────────────────────────────────────────────────────────────────────
import { verifyToken } from '../utils/jwt.js';
import User            from '../models/User.model.js';
import ApiError        from '../utils/ApiError.js';
import asyncHandler    from '../utils/asyncHandler.js';

/**
 * protect — verifies JWT from HttpOnly cookie and attaches req.user
 *
 * Usage:
 *   router.get('/me', protect, handler)
 *   router.post('/listings', protect, isSeller, handler)
 */
export const protect = asyncHandler(async (req, _res, next) => {
  // Read token from HttpOnly cookie
  const token = req.cookies?.token;

  if (!token) {
    throw new ApiError(401, 'Not authenticated. Please log in.');
  }

  // Verify signature and expiry
  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Session expired. Please log in again.');
    }
    throw new ApiError(401, 'Invalid token. Please log in again.');
  }

  // Fetch fresh user from DB (catches deleted users, role changes, etc.)
  const user = await User.findById(decoded.id).select('-password');

  if (!user) {
    throw new ApiError(401, 'User no longer exists.');
  }

  req.user = user;
  next();
});

/**
 * optionalAuth — same as protect but does NOT throw if no token.
 * Use for public routes that show different content when logged in.
 * e.g. listing detail page (show "Connect with Seller" only if logged in)
 */
export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const token = req.cookies?.token;
  if (!token) return next();

  try {
    const decoded = verifyToken(token);
    const user    = await User.findById(decoded.id).select('-password');
    if (user) req.user = user;
  } catch {
    // Silently ignore invalid/expired token for optional auth
  }

  next();
});
