const admin = require('firebase-admin');
const crypto = require('crypto');

const db = admin.firestore();

// Encryption key from environment
const ENCRYPTION_KEY = process.env.WHATSAPP_ENCRYPTION_KEY || 'default-dev-key-32-chars-minimum!'; // Must be 32 chars
const ENCRYPTION_IV_LENGTH = 16;

function encrypt(text) {
  if (!text) return '';
  const iv = crypto.randomBytes(ENCRYPTION_IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text) {
  if (!text) return '';
  const parts = text.split(':');
  const iv = Buffer.from(parts.shift(), 'hex');
  const encrypted = parts.join(':');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

class WhatsAppConfigService {
  /**
   * Save WhatsApp configuration for a client
   */
  static async saveConfig(clientId, config) {
    if (!clientId || !config) throw new Error('Missing clientId or config');

    const configRef = db.collection('whatsappConfigs').doc(clientId);
    
    // Encrypt sensitive fields
    const encryptedConfig = {
      phoneNumberId: config.phoneNumberId,
      businessAccountId: config.businessAccountId,
      webhookVerifyToken: encrypt(config.webhookVerifyToken),
      apiAccessToken: encrypt(config.apiAccessToken),
      isConnected: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await configRef.set(encryptedConfig, { merge: true });
    console.log(`[WhatsApp] Config saved for client: ${clientId}`);
    return { success: true, message: 'Configuration saved' };
  }

  /**
   * Get WhatsApp configuration for a client
   */
  static async getConfig(clientId) {
    if (!clientId) throw new Error('Missing clientId');

    const configRef = db.collection('whatsappConfigs').doc(clientId);
    const doc = await configRef.get();

    if (!doc.exists) {
      return null;
    }

    const config = doc.data();
    
    // Decrypt sensitive fields for internal use only
    return {
      phoneNumberId: config.phoneNumberId,
      businessAccountId: config.businessAccountId,
      webhookVerifyToken: decrypt(config.webhookVerifyToken),
      apiAccessToken: decrypt(config.apiAccessToken),
      isConnected: config.isConnected,
      createdAt: config.createdAt?.toDate?.(),
      updatedAt: config.updatedAt?.toDate?.(),
    };
  }

  /**
   * Test WhatsApp connection by validating API
   */
  static async testConnection(clientId, config) {
    if (!clientId || !config) throw new Error('Missing clientId or config');

    try {
      const apiToken = config.apiAccessToken;
      const phoneNumberId = config.phoneNumberId;

      // Test API call to Meta
      const response = await fetch(
        `https://graph.instagram.com/v18.0/${phoneNumberId}?fields=display_phone_number&access_token=${apiToken}`,
        { method: 'GET' }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'API validation failed');
      }

      // If successful, mark as connected
      await this.saveConfig(clientId, {
        ...config,
        isConnected: true,
      });

      return { success: true, message: 'Connection verified' };
    } catch (error) {
      console.error('[WhatsApp] Connection test failed:', error.message);
      throw error;
    }
  }

  /**
   * Mark config as disconnected (on error)
   */
  static async setDisconnected(clientId) {
    await db.collection('whatsappConfigs').doc(clientId).update({
      isConnected: false,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  /**
   * Get decrypted config for API calls (internal use only)
   */
  static async getDecryptedConfig(clientId) {
    return this.getConfig(clientId);
  }
}

module.exports = WhatsAppConfigService;
