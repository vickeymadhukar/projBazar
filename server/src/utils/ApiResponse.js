// ─────────────────────────────────────────────────────────────────────────────
//  src/utils/ApiResponse.js
//  Standard success response wrapper for all API endpoints
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ApiResponse ensures every success response has the same shape:
 * {
 *   statusCode : number,
 *   data       : any,
 *   message    : string,
 *   success    : boolean
 * }
 *
 * Usage:
 *   res.status(200).json(new ApiResponse(200, user, 'User fetched successfully'));
 *   res.status(201).json(new ApiResponse(201, listing, 'Listing created'));
 */
class ApiResponse {
  /**
   * @param {number} statusCode - HTTP status code (2xx)
   * @param {*}      data       - Response payload
   * @param {string} message    - Human-readable success message
   */
  constructor(statusCode, data, message = 'Success') {
    this.statusCode = statusCode;
    this.data       = data;
    this.message    = message;
    this.success    = statusCode < 400;
  }
}

export default ApiResponse;
