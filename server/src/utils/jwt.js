// ─────────────────────────────────────────────────────────────────────────────
//  src/utils/jwt.js
//  JWT token generation and verification helpers
// ─────────────────────────────────────────────────────────────────────────────
import jwt from 'jsonwebtoken';

const SECRET    = process.env.JWT_SECRET;
const EXPIRES   = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate a signed JWT for a user.
 * Payload only contains the minimum needed to identify + authorise the user.
 * Full user details are fetched from DB using the _id.
 *
 * @param {object} user - Mongoose User document
 * @returns {string} Signed JWT
 */
export const generateToken = (user) => {
  return jwt.sign(
    {
      id:   user._id,
      role: user.role,
    },
    SECRET,
    { expiresIn: EXPIRES }
  );
};

/**
 * Verify a JWT and return its decoded payload.
 * Throws JsonWebTokenError or TokenExpiredError on failure.
 *
 * @param {string} token
 * @returns {object} Decoded payload { id, role, iat, exp }
 */
export const verifyToken = (token) => {
  return jwt.verify(token, SECRET);
};

/**
 * Build the HttpOnly cookie options.
 * Secure flag is set automatically in production.
 *
 * @param {number} maxAgeMs - Cookie lifetime in milliseconds (default: 7 days)
 * @returns {object} Cookie options for res.cookie()
 */
export const cookieOptions = (maxAgeMs = 7 * 24 * 60 * 60 * 1000) => ({
  httpOnly:  true,
  secure:    process.env.NODE_ENV === 'production',
  sameSite:  process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge:    maxAgeMs,
  path:      '/',
});
