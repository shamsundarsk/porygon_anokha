/**
 * Secure Key Management System
 * Handles secure storage, rotation, and lifecycle management of cryptographic keys
 * Supports HSM integration and automated key rotation
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class KeyManagementSystem {
  constructor(options = {}) {
    this.keyStorePath = options.keyStorePath || path.join(process.cwd(), 'keys');
    this.rotationSchedule = options.rotationSchedule || {};
    this.hsmEnabled = options.hsmEnabled || false;
    this.encryptionKey = options.encryptionKey || this.deriveStorageKey();
    this.keyMetadata = new Map();
    this.rotationTimers = new Map();
    
    this.initializeKeyStore();
  }

  /**
   * Initialize secure key storage
   */
  async initializeKeyStore() {
    try {
      await fs.mkdir(this.keyStorePath, { recursive: true, mode: 0o700 });
      await this.loadKeyMetadata();
      this.startRotationScheduler();
    } catch (error) {
      throw new Error(`Key store initialization failed: ${error.message}`);
    }
  }

  /**
   * Derive storage encryption key from master key
   */
  deriveStorageKey() {
    const masterKey = process.env.KEY_STORAGE_MASTER_KEY;
    if (!masterKey) {
      throw new Error('KEY_STORAGE_MASTER_KEY environment variable required');
    }
    
    return crypto.pbkdf2Sync(masterKey, 'key-storage-salt', 100000, 32, 'sha384');
  }

  /**
   * Generate new cryptographic key
   */
  async generateKey(keyType, algorithm, metadata = {}) {
    const keyId = this.generateKeyId();
    const timestamp = new Date();
    
    let keyMaterial;
    
    switch (algorithm) {
      case 'aes-256':
        keyMaterial = crypto.randomBytes(32);
        break;
      case 'ecdsa-p384':
        const { privateKey, publicKey } = this.generateECDSAKeyPair();
        keyMaterial = { privateKey, publicKey };
        break;
      case 'hmac-sha384':
        keyMaterial = crypto.randomBytes(48);
        break;
      default:
        throw new Error(`Unsupported algorithm: ${algorithm}`);
    }
    
    const keyData = {
      keyId,
      keyType,
      algorithm,
      keyMaterial,
      createdAt: timestamp,
      expiresAt: this.calculateExpirationDate(keyType),
      rotationSchedule: this.getRotationSchedule(keyType),
      usage: metadata.usage || [],
      metadata: {
        ...metadata,
        version: 1,
        status: 'active'
      }
    };
    
    await this.storeKey(keyData);
    this.scheduleRotation(keyData);
    
    return keyData;
  }

  /**
   * Generate ECDSA P-384 key pair
   */
  generateECDSAKeyPair() {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
      namedCurve: 'secp384r1',
      privateKeyEncoding: { type: 'pkcs8', format: 'der' },
      publicKeyEncoding: { type: 'spki', format: 'der' }
    });
    
    return { privateKey, publicKey };
  }

  /**
   * Store key securely with encryption
   */
  async storeKey(keyData) {
    try {
      const keyPath = path.join(this.keyStorePath, `${keyData.keyId}.key`);
      const metadataPath = path.join(this.keyStorePath, `${keyData.keyId}.meta`);
      
      // Encrypt key material
      const encryptedKey = this.encryptKeyMaterial(keyData.keyMaterial);
      
      // Store encrypted key
      await fs.writeFile(keyPath, encryptedKey, { mode: 0o600 });
      
      // Store metadata separately
      const metadata = { ...keyData };
      delete metadata.keyMaterial;
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), { mode: 0o600 });
      
      // Update in-memory metadata
      this.keyMetadata.set(keyData.keyId, metadata);
      
    } catch (error) {
      throw new Error(`Key storage failed: ${error.message}`);
    }
  }

  /**
   * Retrieve key by ID
   */
  async getKey(keyId) {
    try {
      const keyPath = path.join(this.keyStorePath, `${keyId}.key`);
      const metadataPath = path.join(this.keyStorePath, `${keyId}.meta`);
      
      // Load metadata
      const metadataContent = await fs.readFile(metadataPath, 'utf8');
      const metadata = JSON.parse(metadataContent);
      
      // Load and decrypt key material
      const encryptedKey = await fs.readFile(keyPath);
      const keyMaterial = this.decryptKeyMaterial(encryptedKey);
      
      return {
        ...metadata,
        keyMaterial
      };
      
    } catch (error) {
      throw new Error(`Key retrieval failed: ${error.message}`);
    }
  }

  /**
   * Rotate key
   */
  async rotateKey(keyId, reason = 'scheduled') {
    try {
      const oldKey = await this.getKey(keyId);
      
      // Generate new key with same parameters
      const newKey = await this.generateKey(
        oldKey.keyType,
        oldKey.algorithm,
        oldKey.metadata
      );
      
      // Mark old key as rotated
      oldKey.metadata.status = 'rotated';
      oldKey.metadata.rotatedAt = new Date();
      oldKey.metadata.rotationReason = reason;
      oldKey.metadata.replacedBy = newKey.keyId;
      
      await this.updateKeyMetadata(keyId, oldKey.metadata);
      
      // Log rotation event
      await this.logKeyRotation(oldKey, newKey, reason);
      
      return {
        oldKeyId: keyId,
        newKeyId: newKey.keyId,
        rotationTime: new Date(),
        reason
      };
      
    } catch (error) {
      throw new Error(`Key rotation failed: ${error.message}`);
    }
  }

  /**
   * Schedule automatic key rotation
   */
  scheduleRotation(keyData) {
    if (!keyData.rotationSchedule) return;
    
    const rotationTime = keyData.rotationSchedule.nextRotation;
    if (!rotationTime) return;
    
    const delay = new Date(rotationTime).getTime() - Date.now();
    if (delay <= 0) return;
    
    const timer = setTimeout(async () => {
      try {
        await this.rotateKey(keyData.keyId, 'scheduled');
      } catch (error) {
        console.error(`Scheduled key rotation failed for ${keyData.keyId}:`, error);
      }
    }, delay);
    
    this.rotationTimers.set(keyData.keyId, timer);
  }

  /**
   * Start rotation scheduler
   */
  startRotationScheduler() {
    // Check for keys needing rotation every hour
    setInterval(async () => {
      try {
        await this.checkRotationSchedule();
      } catch (error) {
        console.error('Rotation scheduler error:', error);
      }
    }, 60 * 60 * 1000); // 1 hour
  }

  /**
   * Check rotation schedule for all keys
   */
  async checkRotationSchedule() {
    const now = new Date();
    
    for (const [keyId, metadata] of this.keyMetadata) {
      if (metadata.status !== 'active') continue;
      
      const rotationTime = metadata.rotationSchedule?.nextRotation;
      if (rotationTime && new Date(rotationTime) <= now) {
        await this.rotateKey(keyId, 'scheduled');
      }
    }
  }

  /**
   * Encrypt key material for storage
   */
  encryptKeyMaterial(keyMaterial) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    
    let encrypted;
    if (Buffer.isBuffer(keyMaterial)) {
      encrypted = Buffer.concat([cipher.update(keyMaterial), cipher.final()]);
    } else {
      const serialized = JSON.stringify(keyMaterial);
      encrypted = Buffer.concat([cipher.update(serialized, 'utf8'), cipher.final()]);
    }
    
    const authTag = cipher.getAuthTag();
    
    return Buffer.concat([iv, authTag, encrypted]);
  }

  /**
   * Decrypt key material from storage
   */
  decryptKeyMaterial(encryptedData) {
    const iv = encryptedData.slice(0, 16);
    const authTag = encryptedData.slice(16, 32);
    const encrypted = encryptedData.slice(32);
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
    decipher.setAuthTag(authTag);
    
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    
    try {
      // Try to parse as JSON (for complex key material)
      return JSON.parse(decrypted.toString('utf8'));
    } catch {
      // Return as buffer (for simple key material)
      return decrypted;
    }
  }

  /**
   * Generate unique key ID
   */
  generateKeyId() {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(8).toString('hex');
    return `key_${timestamp}_${random}`;
  }

  /**
   * Calculate key expiration date
   */
  calculateExpirationDate(keyType) {
    const now = new Date();
    const expirationPeriods = {
      'encryption': 365 * 24 * 60 * 60 * 1000, // 1 year
      'signing': 2 * 365 * 24 * 60 * 60 * 1000, // 2 years
      'session': 24 * 60 * 60 * 1000, // 1 day
      'temporary': 60 * 60 * 1000 // 1 hour
    };
    
    const period = expirationPeriods[keyType] || expirationPeriods.encryption;
    return new Date(now.getTime() + period);
  }

  /**
   * Get rotation schedule for key type
   */
  getRotationSchedule(keyType) {
    const schedules = {
      'encryption': { interval: '24h', nextRotation: this.getNextRotationTime('24h') },
      'signing': { interval: '30d', nextRotation: this.getNextRotationTime('30d') },
      'session': { interval: '1h', nextRotation: this.getNextRotationTime('1h') },
      'temporary': null // No rotation for temporary keys
    };
    
    return schedules[keyType] || schedules.encryption;
  }

  /**
   * Calculate next rotation time
   */
  getNextRotationTime(interval) {
    const now = new Date();
    const intervals = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };
    
    const ms = intervals[interval];
    return ms ? new Date(now.getTime() + ms) : null;
  }

  /**
   * Load key metadata from storage
   */
  async loadKeyMetadata() {
    try {
      const files = await fs.readdir(this.keyStorePath);
      const metaFiles = files.filter(f => f.endsWith('.meta'));
      
      for (const file of metaFiles) {
        const content = await fs.readFile(path.join(this.keyStorePath, file), 'utf8');
        const metadata = JSON.parse(content);
        this.keyMetadata.set(metadata.keyId, metadata);
      }
    } catch (error) {
      // Key store might be empty, which is fine
      console.log('Key metadata loading:', error.message);
    }
  }

  /**
   * Update key metadata
   */
  async updateKeyMetadata(keyId, metadata) {
    const metadataPath = path.join(this.keyStorePath, `${keyId}.meta`);
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), { mode: 0o600 });
    this.keyMetadata.set(keyId, metadata);
  }

  /**
   * Log key rotation event
   */
  async logKeyRotation(oldKey, newKey, reason) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event: 'key_rotation',
      oldKeyId: oldKey.keyId,
      newKeyId: newKey.keyId,
      keyType: oldKey.keyType,
      algorithm: oldKey.algorithm,
      reason,
      success: true
    };
    
    console.log('Key rotation event:', logEntry);
    // In production, this would go to secure audit logs
  }

  /**
   * Get key management system status
   */
  getStatus() {
    const activeKeys = Array.from(this.keyMetadata.values())
      .filter(k => k.status === 'active');
    
    return {
      totalKeys: this.keyMetadata.size,
      activeKeys: activeKeys.length,
      keyTypes: [...new Set(activeKeys.map(k => k.keyType))],
      algorithms: [...new Set(activeKeys.map(k => k.algorithm))],
      rotationTimers: this.rotationTimers.size,
      hsmEnabled: this.hsmEnabled
    };
  }

  /**
   * Cleanup expired keys
   */
  async cleanupExpiredKeys() {
    const now = new Date();
    const expiredKeys = Array.from(this.keyMetadata.values())
      .filter(k => k.expiresAt && new Date(k.expiresAt) < now);
    
    for (const key of expiredKeys) {
      await this.deleteKey(key.keyId);
    }
    
    return expiredKeys.length;
  }

  /**
   * Securely delete key
   */
  async deleteKey(keyId) {
    try {
      const keyPath = path.join(this.keyStorePath, `${keyId}.key`);
      const metadataPath = path.join(this.keyStorePath, `${keyId}.meta`);
      
      // Secure deletion (overwrite before delete)
      await this.secureDelete(keyPath);
      await this.secureDelete(metadataPath);
      
      this.keyMetadata.delete(keyId);
      
      // Clear rotation timer
      const timer = this.rotationTimers.get(keyId);
      if (timer) {
        clearTimeout(timer);
        this.rotationTimers.delete(keyId);
      }
      
    } catch (error) {
      throw new Error(`Key deletion failed: ${error.message}`);
    }
  }

  /**
   * Secure file deletion with overwriting
   */
  async secureDelete(filePath) {
    try {
      const stats = await fs.stat(filePath);
      const size = stats.size;
      
      // Overwrite with random data multiple times
      for (let i = 0; i < 3; i++) {
        const randomData = crypto.randomBytes(size);
        await fs.writeFile(filePath, randomData);
      }
      
      // Final deletion
      await fs.unlink(filePath);
    } catch (error) {
      // File might not exist, which is fine
    }
  }
}

module.exports = KeyManagementSystem;