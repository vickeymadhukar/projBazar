// ─────────────────────────────────────────────────────────────────────────────
//  src/middleware/role.middleware.js
//  Role-based access control guards
//  Must be used AFTER protect middleware (requires req.user)
// ─────────────────────────────────────────────────────────────────────────────
import { USER_ROLES } from '../constants/index.js';
import ApiError from '../utils/ApiError.js';

/**
 * Generic role guard factory.
 * Usage: router.delete('/listing/:id', protect, requireRole('admin'), handler)
 *
 * @param {...string} roles - Allowed role(s)
 */
export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user) {
    return next(new ApiError(401, 'Authentication required'));
  }

  if (!roles.includes(req.user.role)) {
    return next(
      new ApiError(403, `Access denied. Required role: ${roles.join(' or ')}`)
    );
  }

  next();
};

// ── Convenience guards ────────────────────────────────────────────────────────

/**
 * Allows only users with role === 'admin'
 * Usage: router.get('/admin/users', protect, isAdmin, handler)
 */
export const isAdmin = requireRole(USER_ROLES.ADMIN);

/**
 * Allows users with role === 'seller' OR 'admin'
 * Usage: router.post('/listings', protect, isSeller, handler)
 */
export const isSeller = requireRole(USER_ROLES.SELLER, USER_ROLES.ADMIN);

/**
 * Ensures the authenticated user owns the resource.
 * Call after fetching the resource and attaching it to req.resource.
 * The resource must have a 'seller' or 'owner' field (ObjectId).
 *
 * Usage:
 *   const listing = await Listing.findById(id);
 *   req.resource = listing;
 *   isOwner(req, res, next);
 *
 * @param {string} ownerField - Field on req.resource that holds the owner's ObjectId (default: 'seller')
 */
export const isOwner = (ownerField = 'seller') => (req, _res, next) => {
  if (!req.resource) {
    return next(new ApiError(500, 'req.resource not set before isOwner check'));
  }

  const ownerId = req.resource[ownerField]?.toString();
  const userId  = req.user?._id?.toString();

  if (!userId || ownerId !== userId) {
    return next(new ApiError(403, 'You do not have permission to modify this resource'));
  }

  next();
};
