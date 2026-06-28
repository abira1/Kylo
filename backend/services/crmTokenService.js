/**
 * CRM Token Service
 * 
 * Manages the lifecycle of CRM access and refresh tokens:
 * - Store encrypted refresh tokens
 * - Load and decrypt tokens
 * - Automatically refresh expired access tokens
 * - Handle token revocation
 * 
 * All sensitive operations are encrypted at rest.
 */

const { db } = require('./firebaseService');
const { encrypt, decrypt, isValidMasterKey } = require('../utils/encryption');
const CrmFactory = require('../integrations/CrmFactory');

// Get master key from environment
const MASTER_KEY = process.env.CRM_TOKEN_MASTER_KEY;

// Dedupe concurrent token refreshes per client. Without this, many requests /
// browser tabs hitting an expired token at the same time each fire their own
// refresh, which makes the CRM provider (Zoho) return "too many requests".
const inFlightRefreshes = new Map(); // clientId -> Promise<string>
// After a failed refresh, wait before trying again (avoids rate-limit storms).
const refreshBackoffUntil = new Map(); // clientId -> timestamp(ms)
const REFRESH_BACKOFF_MS = 60 * 1000; // 1 minute

class CrmTokenService {
  /**
   * Initialize service and validate master key
   */
  static initialize() {
    if (!MASTER_KEY || !isValidMasterKey(MASTER_KEY)) {
      console.warn('[CRM_TOKEN_SERVICE] WARNING: CRM_TOKEN_MASTER_KEY not set or invalid. Token encryption disabled.');
      console.warn('[CRM_TOKEN_SERVICE] Set CRM_TOKEN_MASTER_KEY to a 32-byte hex string for production.');
    } else {
      console.log('[CRM_TOKEN_SERVICE] Initialized with valid master key');
    }
  }

  /**
   * Store a new CRM connection with encrypted tokens
   * @param {string} clientId - Client ID
   * @param {string} provider - CRM provider (e.g., 'zoho')
   * @param {Object} tokens - { accessToken, refreshToken, expiresIn, region }
   * @returns {Promise<void>}
   */
  static async storeConnection(clientId, provider, tokens) {
    try {
      console.log(`[CRM_TOKEN_SERVICE] Storing connection for ${provider}`);

      const { accessToken, refreshToken, expiresIn = 3600, region = '.com' } = tokens;

      if (!refreshToken) {
        throw new Error('Refresh token is required');
      }

      // Encrypt refresh token
      const encryptedToken = MASTER_KEY
        ? encrypt(refreshToken, MASTER_KEY)
        : { encrypted: refreshToken, iv: '', authTag: '', salt: '' }; // Fallback if key not set

      // Calculate token expiry time
      const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);

      // Store connection in Firestore
      const connectionData = {
        provider,
        status: 'connected',
        region,
        encryptedRefreshToken: encryptedToken,
        accessToken, // Temporarily store (will be refreshed on next use)
        tokenExpiresAt,
        createdAt: new Date(),
        updatedAt: new Date(),
        errorMessage: null,
        fieldMappings: null, // Will be populated after first schema fetch
      };

      await db.collection('connections').doc(clientId).set(connectionData);

      console.log(`[CRM_TOKEN_SERVICE] Connection stored for ${clientId}/${provider}`);
    } catch (error) {
      console.error('[CRM_TOKEN_SERVICE] Failed to store connection:', error.message);
      throw error;
    }
  }

  /**
   * Load a stored CRM connection
   * @param {string} clientId - Client ID
   * @returns {Promise<Object>} Connection object
   */
  static async loadConnection(clientId) {
    try {
      console.log(`[CRM_TOKEN_SERVICE] Loading connection for ${clientId}`);

      const doc = await db.collection('connections').doc(clientId).get();

      if (!doc.exists) {
        return null;
      }

      const connection = doc.data();

      // Decrypt refresh token if encrypted
      if (connection.encryptedRefreshToken && MASTER_KEY) {
        try {
          const { encrypted, iv, authTag, salt } = connection.encryptedRefreshToken;
          connection.refreshToken = decrypt(encrypted, iv, authTag, salt, MASTER_KEY);
        } catch (decryptError) {
          console.error('[CRM_TOKEN_SERVICE] Failed to decrypt refresh token:', decryptError.message);
          throw new Error('Failed to decrypt stored credentials. Please reconnect.');
        }
      }

      console.log(`[CRM_TOKEN_SERVICE] Connection loaded (provider: ${connection.provider}, status: ${connection.status})`);
      return connection;
    } catch (error) {
      console.error('[CRM_TOKEN_SERVICE] Failed to load connection:', error.message);
      throw error;
    }
  }

  /**
   * Get a valid access token, refreshing if necessary
   * @param {string} clientId - Client ID
   * @returns {Promise<string>} Valid access token
   */
  static async getValidAccessToken(clientId) {
    const connection = await this.loadConnection(clientId);

    if (!connection) {
      throw new Error('No CRM connection found. Please connect a CRM provider.');
    }

    // If the cached access token is still valid, use it — regardless of the
    // stored status. This lets a connection that was flagged 'error' due to a
    // transient hiccup keep working without forcing a reconnect.
    const now = Date.now();
    const buffer = 5 * 60 * 1000; // 5 minute buffer
    const expiresAt = connection.tokenExpiresAt
      ? new Date(connection.tokenExpiresAt).getTime()
      : 0;

    if (connection.accessToken && expiresAt > now + buffer) {
      return connection.accessToken;
    }

    // A refresh is needed. Respect a short backoff after a recent failure so we
    // never hammer the provider's token endpoint (the cause of the rate limit).
    const backoffUntil = refreshBackoffUntil.get(clientId) || 0;
    if (now < backoffUntil) {
      if (connection.accessToken) {
        // Use the existing (soon-to-expire) token rather than refreshing now
        return connection.accessToken;
      }
      throw new Error('CRM token temporarily unavailable due to rate limiting. Please try again shortly.');
    }

    // Collapse concurrent refreshes into a single in-flight request
    if (inFlightRefreshes.has(clientId)) {
      return inFlightRefreshes.get(clientId);
    }

    const refreshPromise = (async () => {
      console.log('[CRM_TOKEN_SERVICE] Access token expired, refreshing...');

      const adapter = CrmFactory.createAdapter(connection.provider, clientId, {
        accessToken: connection.accessToken,
        refreshToken: connection.refreshToken,
        region: connection.region,
        tokenExpiresAt: connection.tokenExpiresAt,
      });

      try {
        const newAccessToken = await adapter.refreshAccessToken();

        await db.collection('connections').doc(clientId).update({
          accessToken: newAccessToken,
          tokenExpiresAt: adapter.config.tokenExpiresAt,
          updatedAt: new Date(),
          status: 'connected', // self-heal: a successful refresh clears 'error'
          errorMessage: null,
        });

        refreshBackoffUntil.delete(clientId);
        console.log('[CRM_TOKEN_SERVICE] Token refreshed successfully');
        return newAccessToken;
      } catch (error) {
        console.error('[CRM_TOKEN_SERVICE] Token refresh failed:', error.message);

        // Back off before the next attempt to avoid rate-limit storms
        refreshBackoffUntil.set(clientId, Date.now() + REFRESH_BACKOFF_MS);

        await db.collection('connections').doc(clientId).update({
          status: 'error',
          errorMessage: error.message,
          updatedAt: new Date(),
        }).catch((updateError) => {
          console.error('[CRM_TOKEN_SERVICE] Failed to update error status:', updateError.message);
        });

        throw error;
      }
    })();

    inFlightRefreshes.set(clientId, refreshPromise);
    try {
      return await refreshPromise;
    } finally {
      inFlightRefreshes.delete(clientId);
    }
  }

  /**
   * Update connection status
   * @param {string} clientId - Client ID
   * @param {string} status - Status ('connected', 'error', 'disconnected')
   * @param {string} errorMessage - Optional error message if status is 'error'
   * @returns {Promise<void>}
   */
  static async updateConnectionStatus(clientId, status, errorMessage = null) {
    try {
      const updateData = {
        status,
        updatedAt: new Date(),
      };

      if (errorMessage) {
        updateData.errorMessage = errorMessage;
      }

      await db.collection('connections').doc(clientId).update(updateData);

      console.log(`[CRM_TOKEN_SERVICE] Connection status updated to: ${status}`);
    } catch (error) {
      console.error('[CRM_TOKEN_SERVICE] Failed to update connection status:', error.message);
      throw error;
    }
  }

  /**
   * Store field mappings from CRM schema
   * @param {string} clientId - Client ID
   * @param {Object} fieldMappings - Field schema from CRM
   * @returns {Promise<void>}
   */
  static async storeFieldMappings(clientId, fieldMappings) {
    try {
      await db.collection('connections').doc(clientId).update({
        fieldMappings,
        updatedAt: new Date(),
      });

      console.log(`[CRM_TOKEN_SERVICE] Stored ${Object.keys(fieldMappings).length} field mappings for ${clientId}`);
    } catch (error) {
      console.error('[CRM_TOKEN_SERVICE] Failed to store field mappings:', error.message);
      throw error;
    }
  }

  /**
   * Remove a CRM connection
   * @param {string} clientId - Client ID
   * @returns {Promise<void>}
   */
  static async removeConnection(clientId) {
    try {
      console.log(`[CRM_TOKEN_SERVICE] Removing connection for ${clientId}`);

      await db.collection('connections').doc(clientId).delete();

      console.log(`[CRM_TOKEN_SERVICE] Connection removed`);
    } catch (error) {
      console.error('[CRM_TOKEN_SERVICE] Failed to remove connection:', error.message);
      throw error;
    }
  }

  /**
   * Get connection status without loading sensitive tokens
   * @param {string} clientId - Client ID
   * @returns {Promise<Object>} Status info
   */
  static async getConnectionStatus(clientId) {
    try {
      const doc = await db.collection('connections').doc(clientId).get();

      if (!doc.exists) {
        return {
          connected: false,
          provider: null,
          status: 'disconnected',
        };
      }

      const data = doc.data();

      return {
        connected: data.status === 'connected',
        provider: data.provider,
        status: data.status,
        region: data.region,
        lastSync: data.lastSync,
        errorMessage: data.errorMessage,
      };
    } catch (error) {
      console.error('[CRM_TOKEN_SERVICE] Failed to get connection status:', error.message);
      throw error;
    }
  }
}

// Initialize on module load
CrmTokenService.initialize();

module.exports = CrmTokenService;
