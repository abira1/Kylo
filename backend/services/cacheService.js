/**
 * Cache Service - High-level caching layer
 * 
 * Provides semantic caching for:
 * - Sessions (5-10 min TTL)
 * - OTP lookups (5 min TTL)
 * - User profiles (1 hour TTL)
 * - Step prompts (24 hour TTL)
 * - User preferences (1 day TTL)
 * 
 * Usage:
 *   const cache = require('./cacheService');
 *   await cache.setSession(sessionId, sessionData);
 *   const session = await cache.getSession(sessionId);
 */

const redis = require('../redis-client');

// Cache key prefixes
const PREFIXES = {
  SESSION: 'session:',
  OTP: 'otp:',
  USER: 'user:',
  STEP_PROMPT: 'step-prompt:',
  USER_PREF: 'user-pref:',
  WEBHOOK_CACHE: 'webhook:',
};

// TTL constants (in seconds)
const TTL = {
  SESSION: 600, // 10 minutes
  SESSION_SHORT: 300, // 5 minutes
  OTP: 300, // 5 minutes
  USER: 3600, // 1 hour
  STEP_PROMPT: 86400, // 24 hours
  USER_PREF: 86400, // 24 hours
  WEBHOOK_CACHE: 300, // 5 minutes
};

// Cache statistics
let cacheStats = {
  hits: 0,
  misses: 0,
  sets: 0,
  deletes: 0,
};

/**
 * Session Caching
 */
const sessionCache = {
  /**
   * Cache a session
   * @param {string} sessionId - Session ID
   * @param {Object} sessionData - Session data
   * @returns {Promise<boolean>}
   */
  async set(sessionId, sessionData) {
    const key = `${PREFIXES.SESSION}${sessionId}`;
    const success = await redis.set(key, sessionData, TTL.SESSION);
    if (success) cacheStats.sets++;
    return success;
  },

  /**
   * Get cached session
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object|null>}
   */
  async get(sessionId) {
    const key = `${PREFIXES.SESSION}${sessionId}`;
    const data = await redis.get(key);
    if (data) cacheStats.hits++;
    else cacheStats.misses++;
    return data;
  },

  /**
   * Update cached session (refresh TTL)
   * @param {string} sessionId - Session ID
   * @param {Object} sessionData - Updated data
   * @returns {Promise<boolean>}
   */
  async update(sessionId, sessionData) {
    return this.set(sessionId, sessionData);
  },

  /**
   * Delete cached session
   * @param {string} sessionId - Session ID
   * @returns {Promise<boolean>}
   */
  async delete(sessionId) {
    const key = `${PREFIXES.SESSION}${sessionId}`;
    const success = await redis.delete(key);
    if (success) cacheStats.deletes++;
    return success;
  },

  /**
   * Check if session is cached
   * @param {string} sessionId - Session ID
   * @returns {Promise<boolean>}
   */
  async exists(sessionId) {
    const key = `${PREFIXES.SESSION}${sessionId}`;
    return await redis.exists(key);
  },
};

/**
 * OTP Caching
 */
const otpCache = {
  /**
   * Cache OTP attempts for a phone number
   * @param {string} phoneNumber - Phone number
   * @param {Object} otpData - OTP data (code, hash, attempts, etc)
   * @returns {Promise<boolean>}
   */
  async set(phoneNumber, otpData) {
    const key = `${PREFIXES.OTP}${phoneNumber}`;
    const success = await redis.set(key, otpData, TTL.OTP);
    if (success) cacheStats.sets++;
    return success;
  },

  /**
   * Get cached OTP data
   * @param {string} phoneNumber - Phone number
   * @returns {Promise<Object|null>}
   */
  async get(phoneNumber) {
    const key = `${PREFIXES.OTP}${phoneNumber}`;
    const data = await redis.get(key);
    if (data) cacheStats.hits++;
    else cacheStats.misses++;
    return data;
  },

  /**
   * Delete OTP cache
   * @param {string} phoneNumber - Phone number
   * @returns {Promise<boolean>}
   */
  async delete(phoneNumber) {
    const key = `${PREFIXES.OTP}${phoneNumber}`;
    const success = await redis.delete(key);
    if (success) cacheStats.deletes++;
    return success;
  },
};

/**
 * User Profile Caching
 */
const userCache = {
  /**
   * Cache user profile
   * @param {string} userId - User ID
   * @param {Object} userData - User data
   * @returns {Promise<boolean>}
   */
  async set(userId, userData) {
    const key = `${PREFIXES.USER}${userId}`;
    const success = await redis.set(key, userData, TTL.USER);
    if (success) cacheStats.sets++;
    return success;
  },

  /**
   * Get cached user profile
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>}
   */
  async get(userId) {
    const key = `${PREFIXES.USER}${userId}`;
    const data = await redis.get(key);
    if (data) cacheStats.hits++;
    else cacheStats.misses++;
    return data;
  },

  /**
   * Delete user cache
   * @param {string} userId - User ID
   * @returns {Promise<boolean>}
   */
  async delete(userId) {
    const key = `${PREFIXES.USER}${userId}`;
    const success = await redis.delete(key);
    if (success) cacheStats.deletes++;
    return success;
  },
};

/**
 * Step Prompt Caching
 */
const stepPromptCache = {
  /**
   * Cache step prompt (long TTL)
   * @param {number} step - Step number
   * @param {string} language - Language code
   * @param {string} promptText - Prompt text
   * @returns {Promise<boolean>}
   */
  async set(step, language, promptText) {
    const key = `${PREFIXES.STEP_PROMPT}${step}:${language}`;
    const success = await redis.set(key, { step, language, prompt: promptText }, TTL.STEP_PROMPT);
    if (success) cacheStats.sets++;
    return success;
  },

  /**
   * Get cached step prompt
   * @param {number} step - Step number
   * @param {string} language - Language code
   * @returns {Promise<string|null>}
   */
  async get(step, language) {
    const key = `${PREFIXES.STEP_PROMPT}${step}:${language}`;
    const data = await redis.get(key);
    if (data) {
      cacheStats.hits++;
      return data.prompt;
    }
    cacheStats.misses++;
    return null;
  },
};

/**
 * Webhook Message Cache (temporary, 5 min TTL)
 */
const webhookCache = {
  /**
   * Cache recent webhook message for deduplication
   * @param {string} messageId - WhatsApp message ID
   * @param {Object} messageData - Message data
   * @returns {Promise<boolean>}
   */
  async set(messageId, messageData) {
    const key = `${PREFIXES.WEBHOOK_CACHE}${messageId}`;
    const success = await redis.set(key, messageData, TTL.WEBHOOK_CACHE);
    if (success) cacheStats.sets++;
    return success;
  },

  /**
   * Check if message already processed
   * @param {string} messageId - WhatsApp message ID
   * @returns {Promise<boolean>}
   */
  async exists(messageId) {
    const key = `${PREFIXES.WEBHOOK_CACHE}${messageId}`;
    const result = await redis.exists(key);
    if (result) cacheStats.hits++;
    else cacheStats.misses++;
    return result;
  },
};

/**
 * Cache Management
 */
const management = {
  /**
   * Get cache statistics
   * @returns {Object}
   */
  getStats() {
    const total = cacheStats.hits + cacheStats.misses;
    const hitRate = total > 0 ? ((cacheStats.hits / total) * 100).toFixed(2) : 0;
    
    return {
      ...cacheStats,
      total,
      hitRate: `${hitRate}%`,
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Reset statistics
   */
  resetStats() {
    cacheStats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
    };
  },

  /**
   * Get connection status
   * @returns {string}
   */
  getStatus() {
    return redis.isConnected() ? 'connected' : 'disconnected';
  },

  /**
   * Get cache health info
   * @returns {Promise<Object>}
   */
  async getHealth() {
    return {
      status: this.getStatus(),
      stats: this.getStats(),
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Clear all cache
   * @returns {Promise<boolean>}
   */
  async clearAll() {
    const success = await redis.flushAll();
    if (success) {
      this.resetStats();
    }
    return success;
  },
};

/**
 * Composite Methods
 */
const composite = {
  /**
   * Cache-aside pattern: try cache first, then fallback
   * @param {string} key - Cache key
   * @param {Function} fetchFn - Function to fetch data if not cached
   * @param {number} ttl - TTL in seconds
   * @returns {Promise<*>}
   */
  async getOrFetch(key, fetchFn, ttl = TTL.SESSION) {
    // Try cache first
    const cached = await redis.get(key);
    if (cached) {
      cacheStats.hits++;
      return cached;
    }

    cacheStats.misses++;

    // Fetch data
    const data = await fetchFn();

    // Cache result
    if (data) {
      await redis.set(key, data, ttl);
      cacheStats.sets++;
    }

    return data;
  },

  /**
   * Invalidate session and related caches
   * @param {string} sessionId - Session ID
   * @param {string} phoneNumber - Phone number (optional)
   * @returns {Promise<number>} - Number of caches invalidated
   */
  async invalidateSession(sessionId, phoneNumber = null) {
    let count = 0;

    // Delete session cache
    if (await sessionCache.delete(sessionId)) count++;

    // Delete OTP cache if phone provided
    if (phoneNumber && (await otpCache.delete(phoneNumber))) count++;

    return count;
  },
};

// Export public API
module.exports = {
  session: sessionCache,
  otp: otpCache,
  user: userCache,
  stepPrompt: stepPromptCache,
  webhook: webhookCache,
  management,
  composite,
  TTL,
  PREFIXES,
};
