// ─────────────────────────────────────────────────────────────────────────────
//  src/middleware/error.middleware.js
//  Global Express error handler — MUST be registered last in app.js
// ─────────────────────────────────────────────────────────────────────────────
import ApiError from '../utils/ApiError.js';

/**
 * globalErrorHandler catches all errors forwarded via next(err).
 * It normalises different error types into a consistent JSON response shape.
 *
 * Error types handled:
 *   - ApiError          : our own operational errors (known status codes)
 *   - Mongoose errors   : CastError (invalid ObjectId), ValidationError, duplicate key
 *   - Auth0/JWT errors  : express-oauth2-jwt-bearer throws these
 *   - Generic Error     : everything else → 500
 */
// eslint-disable-next-line no-unused-vars
const globalErrorHandler = (err, req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message    = err.message    || 'Internal Server Error';
  let errors     = err.errors     || [];

  // ── Mongoose: invalid ObjectId (e.g. /listings/not-a-valid-id) ───────────
  if (err.name === 'CastError') {
    statusCode = 400;
    message    = `Invalid ${err.path}: ${err.value}`;
  }

  // ── Mongoose: schema validation failed ───────────────────────────────────
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message    = 'Validation Error';
    errors     = Object.values(err.errors).map((e) => ({
      field:   e.path,
      message: e.message,
    }));
  }

  // ── MongoDB: duplicate key (e.g. duplicate email or auth0Id) ─────────────
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message    = `Duplicate value for field: ${field}`;
  }

  // ── Auth0 / express-oauth2-jwt-bearer errors ──────────────────────────────
  if (err.status === 401 || err.name === 'UnauthorizedError') {
    statusCode = 401;
    message    = 'Invalid or expired token';
  }

  // ── Log stack trace in development ───────────────────────────────────────
  if (process.env.NODE_ENV === 'development') {
    console.error(`[ERROR] ${statusCode} — ${message}`);
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success:    false,
    statusCode,
    message,
    errors,
    // Only expose stack in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export default globalErrorHandler;
