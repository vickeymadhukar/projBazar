// ─────────────────────────────────────────────────────────────────────────────
//  src/services/pubsub.service.js
//  Redis Pub/Sub Event Broker — dispatches cross-service system events
// ─────────────────────────────────────────────────────────────────────────────
import { redis, createRedisInstance } from '../config/redis.js';
import { handleSystemEvent } from './notification.service.js';

let subscriber = null;
const CHANNEL_NAME = 'projbazaar-system-events';

/**
 * initPubSub — initializes the subscription connection and registers listeners
 */
export const initPubSub = () => {
  if (subscriber) return;

  try {
    subscriber = createRedisInstance();
    
    subscriber.subscribe(CHANNEL_NAME, (err, count) => {
      if (err) {
        console.error('❌ Failed to subscribe to Redis system events channel:', err.message);
        subscriber = null;
        return;
      }
      console.log(`✅ Redis Pub/Sub Subscribed successfully. Channel count: ${count}`);
    });

    subscriber.on('message', async (channel, message) => {
      if (channel === CHANNEL_NAME) {
        try {
          const payload = JSON.parse(message);
          if (payload && payload.event) {
            await handleSystemEvent(payload.event, payload.data);
          }
        } catch (err) {
          console.error('❌ Failed to parse or handle Redis Pub/Sub payload:', err.message);
        }
      }
    });

    subscriber.on('error', (err) => {
      console.error('❌ Pub/Sub Subscriber error:', err.message);
    });

  } catch (err) {
    console.error('❌ Failed to initialize Redis Pub/Sub system:', err.message);
    subscriber = null;
  }
};

/**
 * publishEvent — publishes an event payload to the system channel
 * @param {string} event - event identifier
 * @param {object} data - event arguments
 */
export const publishEvent = async (event, data) => {
  try {
    const payload = JSON.stringify({ event, data });
    await redis.publish(CHANNEL_NAME, payload);
    console.log(`📤 [Pub/Sub Broker] Event "${event}" published to Redis`);
  } catch (err) {
    console.error(`❌ Failed to publish event "${event}" to Redis:`, err.message);
  }
};
