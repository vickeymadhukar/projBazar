// ─────────────────────────────────────────────────────────────────────────────
//  src/utils/ApiError.js
//  Custom operational error class for consistent API error responses
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ApiError extends the native Error class to carry HTTP status codes
 * and structured data for the global error handler.
 *
 * Usage:
 *   throw new ApiError(404, 'Listing not found');
 *   throw new ApiError(400, 'Validation failed', errors);
 */
class ApiError extends Error {
  /**
   * @param {number}  statusCode  - HTTP status code (400, 401, 403, 404, 500…)
   * @param {string}  message     - Human-readable error message
   * @param {Array}   errors      - Optional array of validation errors or details
   * @param {string}  stack       - Optional pre-built stack trace
   */
  constructor(
    statusCode,
    message = 'Something went wrong',
    errors = [],
    stack = ''
  ) {
    super(message);

    this.statusCode = statusCode;
    this.data       = null;
    this.message    = message;
    this.success    = false;
    this.errors     = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError;
