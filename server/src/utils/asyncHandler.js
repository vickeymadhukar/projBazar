// ─────────────────────────────────────────────────────────────────────────────
//  src/utils/asyncHandler.js
//  Wraps async route handlers to eliminate try/catch boilerplate
// ─────────────────────────────────────────────────────────────────────────────

/**
 * asyncHandler wraps an async Express route handler and forwards any
 * rejected promise to Express's next(err) — which triggers the global
 * error middleware in middleware/error.middleware.js.
 *
 * Usage:
 *   router.get('/listing/:id', asyncHandler(async (req, res) => {
 *     const listing = await Listing.findById(req.params.id);
 *     if (!listing) throw new ApiError(404, 'Listing not found');
 *     res.json(new ApiResponse(200, listing));
 *   }));
 *
 * @param {Function} fn - Async Express route handler
 * @returns {Function}  - Express middleware
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
