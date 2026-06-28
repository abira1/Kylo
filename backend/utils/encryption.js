/**
 * Token Encryption Utility
 * 
 * Encrypts and decrypts sensitive tokens using AES-256-GCM.
 * Master key should be a 32-byte hex string from environment.
 * 
 * Usage:
 *   const encrypted = encrypt(token, masterKey);
 *   const decrypted = decrypt(encrypted.encrypted, encrypted.iv, encrypted.authTag, encrypted.salt, masterKey);
 */

const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const SALT_LENGTH = 16; // 128 bits
const IV_LENGTH = 12; // 96 bits (recommended for GCM)
const TAG_LENGTH = 16; // 128 bits

/**
 * Encrypt a sensitive token using AES-256-GCM
 * @param {string} token - Plain text token to encrypt
 * @param {string} masterKey - 32-byte hex string master key
 * @returns {Object} { encrypted, iv, authTag, salt } - all base64 encoded
 */
function encrypt(token, masterKey) {
  try {
    if (!token || !masterKey) {
      throw new Error('Token and master key must be provided');
    }

    // Convert master key from hex to buffer
    const key = Buffer.from(masterKey, 'hex');
    if (key.length !== 32) {
      throw new Error('Master key must be 32 bytes (64 hex characters)');
    }

    // Generate random salt and derive key
    const salt = crypto.randomBytes(SALT_LENGTH);
    const derivedKey = crypto.pbkdf2Sync(key, salt, 100000, 32, 'sha256');

    // Generate random IV
    const iv = crypto.randomBytes(IV_LENGTH);

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv);

    // Encrypt token
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    console.log('[ENCRYPTION] Token encrypted successfully');

    return {
      encrypted: Buffer.from(encrypted, 'hex').toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      salt: salt.toString('base64'),
    };
  } catch (error) {
    console.error('[ENCRYPTION] Encryption failed:', error.message);
    throw error;
  }
}

/**
 * Decrypt an encrypted token
 * @param {string} encrypted - Base64 encoded encrypted data
 * @param {string} iv - Base64 encoded initialization vector
 * @param {string} authTag - Base64 encoded authentication tag
 * @param {string} salt - Base64 encoded salt
 * @param {string} masterKey - 32-byte hex string master key (same as encryption)
 * @returns {string} Decrypted plain text token
 */
function decrypt(encrypted, iv, authTag, salt, masterKey) {
  try {
    if (!encrypted || !iv || !authTag || !salt || !masterKey) {
      throw new Error('All encryption components and master key must be provided');
    }

    // Convert master key from hex to buffer
    const key = Buffer.from(masterKey, 'hex');
    if (key.length !== 32) {
      throw new Error('Master key must be 32 bytes (64 hex characters)');
    }

    // Convert from base64 to buffer
    const encryptedBuffer = Buffer.from(encrypted, 'base64');
    const ivBuffer = Buffer.from(iv, 'base64');
    const authTagBuffer = Buffer.from(authTag, 'base64');
    const saltBuffer = Buffer.from(salt, 'base64');

    // Derive key using same salt and algorithm
    const derivedKey = crypto.pbkdf2Sync(key, saltBuffer, 100000, 32, 'sha256');

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, ivBuffer);
    decipher.setAuthTag(authTagBuffer);

    // Decrypt token
    let decrypted = decipher.update(encryptedBuffer);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    console.log('[ENCRYPTION] Token decrypted successfully');

    return decrypted.toString('utf8');
  } catch (error) {
    console.error('[ENCRYPTION] Decryption failed:', error.message);
    throw new Error('Token decryption failed. Token may be corrupted or master key incorrect.');
  }
}

/**
 * Generate a random master key
 * @returns {string} 32-byte hex string suitable for use as master key
 */
function generateMasterKey() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Validate a master key format
 * @param {string} masterKey - Hex string to validate
 * @returns {boolean} True if valid 32-byte hex string
 */
function isValidMasterKey(masterKey) {
  if (!masterKey || typeof masterKey !== 'string') return false;
  if (masterKey.length !== 64) return false; // 32 bytes = 64 hex chars
  return /^[0-9a-fA-F]{64}$/.test(masterKey);
}

module.exports = {
  encrypt,
  decrypt,
  generateMasterKey,
  isValidMasterKey,
};
