/**
 * Advanced Security Service
 * Unified interface for all cryptographic and security operations
 * Integrates cryptographic module, key management, and HSM services
 */

const CryptographicModule = require('./cryptographic');
const KeyManagementSystem = require('./keyManagement');
const HSMIntegrationService = require('./hsmIntegration');

class SecurityService {
  constructor(options = {}) {
    this.options = options;
    this.initialized = false;
    
    // Initialize components
    this.cryptoModule = new CryptographicModule({
      keyRotationInterval: options.keyRotationInterval || 24 * 60 * 60 * 1000,
      hsmEnabled: options.hsmEnabled || false,
      hsmConfig: options.hsmConfig || {}
    });
    
    this.keyManager = new KeyManagementSystem({
      keyStorePath: options.keyStorePath,
      rotationSchedule: options.rotationSchedule || {},
      hsmEnabled: options.hsmEnabled || false,
      encryptionKey: options.storageEncryptionKey
    });
    
    if (options.hsmEnabled) {
      this.hsmService = new HSMIntegrationService({
        provider: options.hsmProvider || 'mock',
        config: options.hsmConfig || {}
      });
    }
    
    this.initialize();
  }

  /**
   * Initialize security service
   */
  async initialize() {
    try {
      console.log('Initializing Advanced Security Service...');
      
      // Start key rotation for crypto module
      this.cryptoModule.startKeyRotation();
      
      // Initialize HSM if enabled
      if (this.hsmService) {
        await this.hsmService.initializeProvider();
        console.log('HSM integration initialized');
      }
      
      // Test cryptographic operations
      await this.runSelfTest();
      
      this.initialized = true;
      console.log('Advanced Security Service initialized successfully');
      
    } catch (error) {
      throw new Error(`Security service initialization failed: ${error.message}`);
    }
  }

  /**
   * Encrypt data using AES-256-GCM
   * Requirement 1.1: AES-256-GCM for all data encryption
   */
  async encryptData(plaintext, associatedData = null, useHSM = false) {
    if (!this.initialized) {
      throw new Error('Security service not initialized');
    }
    
    if (useHSM && this.hsmService) {
      // Use HSM for encryption
      const hsmKey = await this.hsmService.generateKey('encryption', 'aes-256');
      return await this.hsmService.performOperation('encrypt', hsmKey.keyHandle, plaintext);
    } else {
      // Use software cryptographic module
      return this.cryptoModule.encrypt(plaintext, associatedData);
    }
  }

  /**
   * Decrypt data
   */
  async decryptData(encryptedData, associatedData = null, useHSM = false) {
    if (!this.initialized) {
      throw new Error('Security service not initialized');
    }
    
    if (useHSM && this.hsmService && encryptedData.provider === 'hsm') {
      return await this.hsmService.performOperation('decrypt', encryptedData.keyHandle, encryptedData);
    } else {
      return this.cryptoModule.decrypt(encryptedData, associatedData);
    }
  }

  /**
   * Hash password using Argon2id
   * Requirement 1.2: Argon2id with specific parameters
   */
  async hashPassword(password, salt = null) {
    if (!this.initialized) {
      throw new Error('Security service not initialized');
    }
    
    return await this.cryptoModule.hashPassword(password, salt);
  }

  /**
   * Verify password hash
   */
  async verifyPassword(password, hashData) {
    if (!this.initialized) {
      throw new Error('Security service not initialized');
    }
    
    return await this.cryptoModule.verifyPassword(password, hashData);
  }

  /**
   * Create digital signature using ECDSA P-384
   * Requirement 1.3: ECDSA P-384 for digital signatures
   */
  async signData(data, privateKey = null, useHSM = false) {
    if (!this.initialized) {
      throw new Error('Security service not initialized');
    }
    
    if (useHSM && this.hsmService) {
      const hsmKey = await this.hsmService.generateKey('signing', 'ecdsa-p384');
      return await this.hsmService.performOperation('sign', hsmKey.keyHandle, data);
    } else {
      if (!privateKey) {
        // Generate new key pair if none provided
        const keyPair = this.cryptoModule.generateKeyPair();
        privateKey = keyPair.privateKey;
      }
      return this.cryptoModule.sign(data, privateKey);
    }
  }

  /**
   * Verify digital signature
   */
  async verifySignature(data, signatureData, publicKey, useHSM = false) {
    if (!this.initialized) {
      throw new Error('Security service not initialized');
    }
    
    if (useHSM && this.hsmService && signatureData.provider === 'hsm') {
      return await this.hsmService.performOperation('verify', signatureData.keyHandle, data, { signature: signatureData.signature });
    } else {
      return this.cryptoModule.verify(data, signatureData, publicKey);
    }
  }

  /**
   * Generate cryptographically secure random data
   * Requirement 1.4: Cryptographically secure random generation
   */
  generateSecureRandom(length) {
    if (!this.initialized) {
      throw new Error('Security service not initialized');
    }
    
    return this.cryptoModule.generateSecureRandom(length);
  }

  /**
   * Generate key pair
   */
  generateKeyPair(algorithm = 'ecdsa-p384', useHSM = false) {
    if (!this.initialized) {
      throw new Error('Security service not initialized');
    }
    
    if (useHSM && this.hsmService) {
      return this.hsmService.generateKey('keypair', algorithm);
    } else {
      return this.cryptoModule.generateKeyPair();
    }
  }

  /**
   * Perform key exchange for perfect forward secrecy
   * Requirement 1.5: Perfect forward secrecy implementation
   */
  performKeyExchange(privateKey, publicKey) {
    if (!this.initialized) {
      throw new Error('Security service not initialized');
    }
    
    return this.cryptoModule.performKeyExchange(privateKey, publicKey);
  }

  /**
   * Generate ephemeral key pair for perfect forward secrecy
   */
  generateEphemeralKeyPair() {
    if (!this.initialized) {
      throw new Error('Security service not initialized');
    }
    
    return this.cryptoModule.generateEphemeralKeyPair();
  }

  /**
   * Derive key using HKDF-SHA384
   * Requirement 1.8: HKDF-SHA384 for key derivation
   */
  deriveKey(context, length = 32) {
    if (!this.initialized) {
      throw new Error('Security service not initialized');
    }
    
    return this.cryptoModule.deriveKey(context, length);
  }

  /**
   * Constant-time comparison
   * Requirement 1.7: Constant-time operations
   */
  constantTimeCompare(a, b) {
    if (!this.initialized) {
      throw new Error('Security service not initialized');
    }
    
    return this.cryptoModule.constantTimeCompare(a, b);
  }

  /**
   * Generate and store managed key
   */
  async generateManagedKey(keyType, algorithm, metadata = {}) {
    if (!this.initialized) {
      throw new Error('Security service not initialized');
    }
    
    return await this.keyManager.generateKey(keyType, algorithm, metadata);
  }

  /**
   * Retrieve managed key
   */
  async getManagedKey(keyId) {
    if (!this.initialized) {
      throw new Error('Security service not initialized');
    }
    
    return await this.keyManager.getKey(keyId);
  }

  /**
   * Rotate managed key
   */
  async rotateManagedKey(keyId, reason = 'manual') {
    if (!this.initialized) {
      throw new Error('Security service not initialized');
    }
    
    return await this.keyManager.rotateKey(keyId, reason);
  }

  /**
   * Get HSM status (if enabled)
   */
  async getHSMStatus() {
    if (!this.hsmService) {
      return { enabled: false };
    }
    
    return await this.hsmService.getHSMStatus();
  }

  /**
   * Test HSM operations (if enabled)
   */
  async testHSM() {
    if (!this.hsmService) {
      return { enabled: false };
    }
    
    return await this.hsmService.testHSM();
  }

  /**
   * Run comprehensive self-test
   */
  async runSelfTest() {
    const testResults = {
      encryption: false,
      hashing: false,
      signing: false,
      keyDerivation: false,
      randomGeneration: false,
      keyExchange: false,
      hsm: false
    };
    
    try {
      // Test encryption/decryption
      const testData = Buffer.from('test encryption data');
      const encrypted = this.cryptoModule.encrypt(testData);
      const decrypted = this.cryptoModule.decrypt(encrypted);
      testResults.encryption = testData.equals(decrypted);
      
      // Test password hashing
      const password = 'test-password-123';
      const hashResult = await this.cryptoModule.hashPassword(password);
      const verified = await this.cryptoModule.verifyPassword(password, hashResult);
      testResults.hashing = verified;
      
      // Test signing
      const keyPair = this.cryptoModule.generateKeyPair();
      const signature = this.cryptoModule.sign(testData, keyPair.privateKey);
      const signatureValid = this.cryptoModule.verify(testData, signature, keyPair.publicKey);
      testResults.signing = signatureValid;
      
      // Test key derivation
      const derivedKey = this.cryptoModule.deriveKey('test-context');
      testResults.keyDerivation = derivedKey && derivedKey.key && derivedKey.key.length === 32;
      
      // Test random generation
      const randomData = this.cryptoModule.generateSecureRandom(32);
      testResults.randomGeneration = randomData && randomData.length === 32;
      
      // Test key exchange
      const ephemeralKey1 = this.cryptoModule.generateEphemeralKeyPair();
      const ephemeralKey2 = this.cryptoModule.generateEphemeralKeyPair();
      const keyExchange = this.cryptoModule.performKeyExchange(ephemeralKey1.privateKey, ephemeralKey2.publicKey);
      testResults.keyExchange = keyExchange && keyExchange.sharedSecret;
      
      // Test HSM if enabled
      if (this.hsmService) {
        const hsmTest = await this.hsmService.testHSM();
        testResults.hsm = hsmTest.connection;
      }
      
      const allPassed = Object.values(testResults).every(result => result === true || result === false);
      const passedTests = Object.values(testResults).filter(result => result === true).length;
      
      console.log(`Security self-test completed: ${passedTests}/${Object.keys(testResults).length} tests passed`);
      console.log('Test results:', testResults);
      
      if (!testResults.encryption || !testResults.hashing || !testResults.signing) {
        throw new Error('Critical security tests failed');
      }
      
      return testResults;
      
    } catch (error) {
      throw new Error(`Security self-test failed: ${error.message}`);
    }
  }

  /**
   * Get comprehensive security service status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      cryptoModule: this.cryptoModule.getStatus(),
      keyManager: this.keyManager.getStatus(),
      hsm: this.hsmService ? { enabled: true, provider: this.hsmService.provider } : { enabled: false },
      capabilities: {
        encryption: 'aes-256-gcm',
        hashing: 'argon2id',
        signing: 'ecdsa-p384-sha384',
        keyDerivation: 'hkdf-sha384',
        keyExchange: 'ecdh-p384',
        perfectForwardSecrecy: true,
        constantTimeOperations: true,
        automaticKeyRotation: true,
        hsmIntegration: !!this.hsmService
      }
    };
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown() {
    console.log('Shutting down Advanced Security Service...');
    
    // Stop key rotation
    if (this.cryptoModule) {
      this.cryptoModule.stopKeyRotation();
    }
    
    if (this.hsmService) {
      await this.hsmService.disconnect();
    }
    
    // Clear sensitive data from memory
    if (this.cryptoModule.keys) {
      this.cryptoModule.keys.clear();
    }
    
    this.initialized = false;
    console.log('Advanced Security Service shutdown complete');
  }
}

module.exports = SecurityService;