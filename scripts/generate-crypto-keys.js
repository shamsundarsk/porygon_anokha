#!/usr/bin/env node

/**
 * Cryptographic Key Generation Utility
 * Generates secure keys for the advanced security system
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class CryptoKeyGenerator {
  constructor() {
    this.keys = {};
  }

  /**
   * Generate cryptographically secure random key
   */
  generateSecureKey(length) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate all required keys
   */
  generateAllKeys() {
    console.log('Generating cryptographic keys...\n');

    // Master key for cryptographic operations (256 bits)
    this.keys.CRYPTO_MASTER_KEY = this.generateSecureKey(32);
    console.log('✓ Generated CRYPTO_MASTER_KEY (256 bits)');

    // Key storage encryption key (256 bits)
    this.keys.KEY_STORAGE_MASTER_KEY = this.generateSecureKey(32);
    console.log('✓ Generated KEY_STORAGE_MASTER_KEY (256 bits)');

    // JWT secrets (256 bits each)
    this.keys.JWT_SECRET = this.generateSecureKey(32);
    console.log('✓ Generated JWT_SECRET (256 bits)');

    this.keys.JWT_REFRESH_SECRET = this.generateSecureKey(32);
    console.log('✓ Generated JWT_REFRESH_SECRET (256 bits)');

    // General encryption key (256 bits)
    this.keys.ENCRYPTION_KEY = this.generateSecureKey(32);
    console.log('✓ Generated ENCRYPTION_KEY (256 bits)');

    console.log('\nAll cryptographic keys generated successfully!\n');
  }

  /**
   * Display generated keys
   */
  displayKeys() {
    console.log('='.repeat(80));
    console.log('GENERATED CRYPTOGRAPHIC KEYS');
    console.log('='.repeat(80));
    console.log('');
    console.log('Add these to your .env file:');
    console.log('');

    Object.entries(this.keys).forEach(([key, value]) => {
      console.log(`${key}="${value}"`);
    });

    console.log('');
    console.log('='.repeat(80));
    console.log('SECURITY WARNINGS:');
    console.log('='.repeat(80));
    console.log('');
    console.log('1. NEVER commit these keys to version control');
    console.log('2. Store these keys securely (use a password manager)');
    console.log('3. Generate different keys for each environment');
    console.log('4. Rotate keys regularly (every 90 days minimum)');
    console.log('5. Use HSM in production for maximum security');
    console.log('6. Monitor key usage and access logs');
    console.log('7. Have a key recovery plan in case of loss');
    console.log('');
  }

  /**
   * Save keys to a secure file
   */
  saveKeysToFile(filename = '.env.generated') {
    const envContent = Object.entries(this.keys)
      .map(([key, value]) => `${key}="${value}"`)
      .join('\n');

    const header = `# Generated Cryptographic Keys - ${new Date().toISOString()}
# WARNING: Keep these keys secure and never commit to version control
# Generate new keys for each environment (dev/staging/prod)

`;

    const fullContent = header + envContent + '\n';

    fs.writeFileSync(filename, fullContent, { mode: 0o600 });
    console.log(`Keys saved to ${filename} (readable only by owner)`);
  }

  /**
   * Validate key strength
   */
  validateKeys() {
    console.log('Validating key strength...\n');

    Object.entries(this.keys).forEach(([keyName, keyValue]) => {
      const keyBuffer = Buffer.from(keyValue, 'hex');
      const entropy = this.calculateEntropy(keyBuffer);
      
      console.log(`${keyName}:`);
      console.log(`  Length: ${keyValue.length} hex chars (${keyBuffer.length * 8} bits)`);
      console.log(`  Entropy: ${entropy.toFixed(2)} bits`);
      console.log(`  Strength: ${this.getStrengthRating(entropy)}`);
      console.log('');
    });
  }

  /**
   * Calculate Shannon entropy of a buffer
   */
  calculateEntropy(buffer) {
    const frequencies = new Array(256).fill(0);
    
    for (let i = 0; i < buffer.length; i++) {
      frequencies[buffer[i]]++;
    }
    
    let entropy = 0;
    const length = buffer.length;
    
    for (let i = 0; i < 256; i++) {
      if (frequencies[i] > 0) {
        const probability = frequencies[i] / length;
        entropy -= probability * Math.log2(probability);
      }
    }
    
    return entropy * length / 8; // Convert to bits
  }

  /**
   * Get strength rating based on entropy
   */
  getStrengthRating(entropy) {
    if (entropy >= 250) return 'Excellent (Cryptographically Secure)';
    if (entropy >= 200) return 'Very Strong';
    if (entropy >= 150) return 'Strong';
    if (entropy >= 100) return 'Moderate';
    return 'Weak';
  }

  /**
   * Generate test vectors for validation
   */
  generateTestVectors() {
    console.log('Generating test vectors for validation...\n');

    // Test AES-256-GCM encryption
    const testKey = Buffer.from(this.keys.ENCRYPTION_KEY, 'hex');
    const testData = Buffer.from('Hello, World! This is a test message for AES-256-GCM encryption.');
    const nonce = crypto.randomBytes(12);

    const cipher = crypto.createCipher('aes-256-gcm', testKey);
    let ciphertext = cipher.update(testData);
    ciphertext = Buffer.concat([ciphertext, cipher.final()]);
    const authTag = cipher.getAuthTag();

    console.log('AES-256-GCM Test Vector:');
    console.log(`  Key: ${testKey.toString('hex')}`);
    console.log(`  Nonce: ${nonce.toString('hex')}`);
    console.log(`  Plaintext: ${testData.toString()}`);
    console.log(`  Ciphertext: ${ciphertext.toString('hex')}`);
    console.log(`  Auth Tag: ${authTag.toString('hex')}`);
    console.log('');

    // Test HKDF key derivation
    const salt = crypto.randomBytes(32);
    const info = Buffer.from('test-context');
    const derivedKey = crypto.hkdfSync('sha384', testKey, salt, info, 32);

    console.log('HKDF-SHA384 Test Vector:');
    console.log(`  Input Key: ${testKey.toString('hex')}`);
    console.log(`  Salt: ${salt.toString('hex')}`);
    console.log(`  Info: ${info.toString()}`);
    console.log(`  Derived Key: ${derivedKey.toString('hex')}`);
    console.log('');
  }
}

// Main execution
function main() {
  const generator = new CryptoKeyGenerator();

  console.log('Advanced Security System - Cryptographic Key Generator');
  console.log('=====================================================\n');

  try {
    // Generate all keys
    generator.generateAllKeys();

    // Validate key strength
    generator.validateKeys();

    // Generate test vectors
    generator.generateTestVectors();

    // Display keys
    generator.displayKeys();

    // Ask if user wants to save to file
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('Save keys to file? (y/N): ', (answer) => {
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        generator.saveKeysToFile();
        console.log('\nKeys saved successfully!');
      }
      
      console.log('\nKey generation complete. Remember to:');
      console.log('1. Copy the keys to your .env file');
      console.log('2. Delete any temporary key files');
      console.log('3. Never commit keys to version control');
      console.log('4. Use different keys for each environment');
      
      rl.close();
    });

  } catch (error) {
    console.error('Error generating keys:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = CryptoKeyGenerator;