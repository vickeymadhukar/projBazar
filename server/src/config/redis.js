// ─────────────────────────────────────────────────────────────────────────────
//  src/config/redis.js
//  ioredis client — works with local Redis (dev) and Upstash (prod)
// ─────────────────────────────────────────────────────────────────────────────
import Redis from 'ioredis';

let redisClient = null;

/**
 * Creates and returns a singleton ioredis client.
 * Reads REDIS_URL from environment:
 *   - Local dev  : redis://localhost:6379
 *   - Upstash    : rediss://<user>:<pass>@<host>.upstash.io:6380
 */
const getRedisClient = () => {
  if (redisClient) return redisClient;

  redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    // Upstash requires TLS — ioredis handles this automatically when using rediss://
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      if (times > 5) {
        console.error('❌ Redis max retries reached');
        return null; // stop retrying
      }
      return Math.min(times * 200, 2000); // exponential backoff up to 2s
    },
    lazyConnect: true, // don't connect until first command
  });

  redisClient.on('connect', () => console.log('✅ Redis connected'));
  redisClient.on('error', (err) => console.error(`❌ Redis error: ${err.message}`));
  redisClient.on('reconnecting', () => console.log('🔄 Redis reconnecting…'));

  return redisClient;
};

export const createRedisInstance = () => {
  const client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
    retryStrategy: (times) => {
      if (times > 10) {
        return null;
      }
      return Math.min(times * 200, 2000);
    },
  });
  
  client.on('error', (err) => console.error(`❌ Redis Client error: ${err.message}`));
  return client;
};

export const redis = getRedisClient();
export default getRedisClient;
