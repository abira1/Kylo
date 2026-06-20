/**
 * Redis Client Configuration & Connection
 * 
 * Usage:
 *   const redis = require('./redis-client');
 *   await redis.set('key', 'value', 600);
 *   const value = await redis.get('key');
 * 
 * Supports both real Redis and fakeredis (for testing)
 */

// Try to use fakeredis for development/testing, fallback to real redis
let redis;
let isFakeRedis = false;

try {
  redis = require('fakeredis');
  isFakeRedis = true;
  console.log('[REDIS] Using fakeredis for development/testing');
} catch (err) {
  redis = require('redis');
  console.log('[REDIS] Using real Redis client');
}

// Configuration
const REDIS_CONFIG = isFakeRedis ? {} : {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  db: process.env.REDIS_DB || 0,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  enableReadyCheck: true,
  enableOfflineQueue: true,
  connectTimeout: 10000,
};

// Create client
const client = isFakeRedis 
  ? redis.createClient() 
  : redis.createClient(REDIS_CONFIG);

// Connection state
let isConnected = false;

// Event handlers
client.on('connect', () => {
  console.log(`[REDIS] Connected to ${isFakeRedis ? 'FakeRedis (in-memory, development)' : 'Redis'}`);
  isConnected = true;
});

client.on('ready', () => {
  console.log(`[REDIS] ${isFakeRedis ? 'FakeRedis' : 'Redis'} client ready`);
});

client.on('error', (err) => {
  console.error('[REDIS] Redis error:', err);
  isConnected = false;
});

client.on('end', () => {
  console.log('[REDIS] Redis connection closed');
  isConnected = false;
});

client.on('reconnecting', () => {
  console.log('[REDIS] Redis reconnecting...');
});

/**
 * Wrapper functions to handle redis promises
 */
class RedisWrapper {
  constructor(client) {
    this.client = client;
  }

  /**
   * Set key with optional TTL (time-to-live) in seconds
   * @param {string} key - Cache key
   * @param {*} value - Value to store (will be JSON stringified)
   * @param {number} ttl - Time to live in seconds (optional)
   * @returns {Promise<boolean>} - True if set successfully
   */
  async set(key, value, ttl = null) {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      
      if (ttl) {
        await new Promise((resolve, reject) => {
          this.client.setex(key, ttl, stringValue, (err, reply) => {
            if (err) reject(err);
            else resolve(reply);
          });
        });
      } else {
        await new Promise((resolve, reject) => {
          this.client.set(key, stringValue, (err, reply) => {
            if (err) reject(err);
            else resolve(reply);
          });
        });
      }
      return true;
    } catch (error) {
      console.error(`[REDIS] Error setting key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get value by key
   * @param {string} key - Cache key
   * @returns {Promise<*>} - Cached value or null
   */
  async get(key) {
    try {
      const value = await new Promise((resolve, reject) => {
        this.client.get(key, (err, reply) => {
          if (err) reject(err);
          else resolve(reply);
        });
      });

      if (value === null) {
        return null;
      }

      // Try to parse as JSON, return as-is if not valid JSON
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      console.error(`[REDIS] Error getting key ${key}:`, error);
      return null;
    }
  }

  /**
   * Delete key
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} - True if deleted
   */
  async delete(key) {
    try {
      const result = await new Promise((resolve, reject) => {
        this.client.del(key, (err, reply) => {
          if (err) reject(err);
          else resolve(reply);
        });
      });
      return result > 0;
    } catch (error) {
      console.error(`[REDIS] Error deleting key ${key}:`, error);
      return false;
    }
  }

  /**
   * Check if key exists
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} - True if exists
   */
  async exists(key) {
    try {
      const result = await new Promise((resolve, reject) => {
        this.client.exists(key, (err, reply) => {
          if (err) reject(err);
          else resolve(reply);
        });
      });
      return result === 1;
    } catch (error) {
      console.error(`[REDIS] Error checking key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get remaining TTL for key
   * @param {string} key - Cache key
   * @returns {Promise<number>} - Remaining TTL in seconds (-1 if no TTL, -2 if not exists)
   */
  async ttl(key) {
    try {
      const result = await new Promise((resolve, reject) => {
        this.client.ttl(key, (err, reply) => {
          if (err) reject(err);
          else resolve(reply);
        });
      });
      return result;
    } catch (error) {
      console.error(`[REDIS] Error getting TTL for key ${key}:`, error);
      return -2;
    }
  }

  /**
   * Clear all cache
   * @returns {Promise<boolean>} - True if cleared
   */
  async flushAll() {
    try {
      await new Promise((resolve, reject) => {
        this.client.flushall((err, reply) => {
          if (err) reject(err);
          else resolve(reply);
        });
      });
      console.log('[REDIS] Cache flushed');
      return true;
    } catch (error) {
      console.error('[REDIS] Error flushing cache:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   * @returns {Promise<Object>} - Cache stats
   */
  async stats() {
    try {
      const info = await new Promise((resolve, reject) => {
        this.client.info('stats', (err, reply) => {
          if (err) reject(err);
          else resolve(reply);
        });
      });

      const stats = {};
      info.split('\r\n').forEach(line => {
        const [key, value] = line.split(':');
        if (key && value) stats[key] = value;
      });

      return stats;
    } catch (error) {
      console.error('[REDIS] Error getting stats:', error);
      return {};
    }
  }

  /**
   * Check if Redis is connected
   * @returns {boolean} - Connection status
   */
  isConnected() {
    return isConnected;
  }

  /**
   * Close connection
   */
  close() {
    if (this.client) {
      this.client.quit();
    }
  }
}

// Export wrapped client
const redisWrapper = new RedisWrapper(client);

// Export for use
module.exports = redisWrapper;

// Allow direct client access if needed
module.exports.client = client;

// Export config for reference
module.exports.config = REDIS_CONFIG;

// Self-test on require
if (process.env.NODE_ENV !== 'test') {
  // Try to connect and log status
  setTimeout(() => {
    console.log(`[REDIS] Status: ${isConnected ? '🟢 Connected' : '🔴 Not Connected'}`);
  }, 2000);
}
