import { createClient } from 'redis';

/**
 * Redis Client Configuration
 * Digunakan untuk pub/sub notifications
 */

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('Redis: Too many reconnection attempts');
        return new Error('Too many retries');
      }
      return retries * 100; // Retry setiap 100ms * retries
    }
  }
});

// Event handlers
redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('Redis: Connecting...');
});

redisClient.on('ready', () => {
  console.log('Redis: Connected and ready');
});

redisClient.on('reconnecting', () => {
  console.log('Redis: Reconnecting...');
});

redisClient.on('end', () => {
  console.log('Redis: Connection closed');
});

/**
 * Connect ke Redis server
 */
export const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  } catch (error) {
    console.error('Failed to connect to Redis:', error.message);
    // Don't throw error, biarkan app tetap jalan tanpa Redis
  }
};

/**
 * Disconnect dari Redis
 */
export const disconnectRedis = async () => {
  try {
    if (redisClient.isOpen) {
      await redisClient.quit();
    }
  } catch (error) {
    console.error('Error disconnecting from Redis:', error.message);
  }
};

export default redisClient;
