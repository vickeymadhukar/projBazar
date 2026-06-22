// ─────────────────────────────────────────────────────────────────────────────
//  src/middleware/rateLimit.middleware.js
//  Custom Redis-backed sliding window rate limiter
// ─────────────────────────────────────────────────────────────────────────────
import { redis } from '../config/redis.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * redisRateLimiter — rate limit requests using Redis INCR + EXPIRE
 *
 * @param {string} keyPrefix - Unique namespace prefix (e.g. 'follow', 'comment')
 * @param {number} limit - Maximum requests allowed in the window
 * @param {number} windowSecs - Expiry duration of the window in seconds
 */
export const redisRateLimiter = (keyPrefix, limit, windowSecs) => {
  return asyncHandler(async (req, res, next) => {
    // 1. Identify requester: prioritize logged-in User ID, fallback to IP address
    const identifier = req.user ? req.user._id.toString() : req.ip;
    const redisKey = `ratelimit:${keyPrefix}:${identifier}`;

    // 2. Increment request count in Redis
    const currentCount = await redis.incr(redisKey);

    // 3. If it's a new window, set the TTL/expiry
    if (currentCount === 1) {
      await redis.expire(redisKey, windowSecs);
    }

    // 4. Retrieve remaining TTL for reset header
    const ttl = await redis.ttl(redisKey);
    const resetTimeSecs = ttl > 0 ? ttl : 0;

    // 5. Expose standard rate limit headers
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - currentCount));
    res.setHeader('X-RateLimit-Reset', resetTimeSecs);

    // 6. Block request if count exceeds limit
    if (currentCount > limit) {
      throw new ApiError(
        429,
        `Too many operations for "${keyPrefix}". Please try again in ${resetTimeSecs} seconds.`
      );
    }

    next();
  });
};
