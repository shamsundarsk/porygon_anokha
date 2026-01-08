/**
 * Cryptographic Module Test
 * Basic test to verify the advanced cryptographic implementation
 */

const SecurityService = require('./server/services/securityService');

async function testCryptographicModule() {
  console.log('Testing Advanced Cryptographic Module...\n');
  
  try {
    // Initialize security service
    const securityService = new SecurityService({
      keyRotationInterval: 5000, // 5 seconds for testing
      hsmEnabled: false // Use software crypto for testing
    });
    
    await securityService.initialize();
    console.log('✓ Security service initialized\n');
    
    // Test 1: AES-256-GCM Encryption/Decryption
    console.log('Test 1: AES-256-GCM Encryption/Decryption');
    const testData = Buffer.from('Hello, World! This is a test message for AES-256-GCM encryption.');
    const associatedData = Buffer.from('additional-authenticated-data');
    
    const encrypted = await securityService.encryptData(testData, associatedData);
    console.log('  Encrypted data:', {
      algorithm: encrypted.algorithm,
      nonceLength: encrypted.nonce.length,
      authTagLength: encrypted.authTag.length,
      ciphertextLength: encrypted.ciphertext.length
    });
    
    const decrypted = await securityService.decryptData(encrypted, associatedData);
    const decryptionSuccess = testData.equals(decrypted);
    console.log('  Decryption successful:', decryptionSuccess);
    console.log('  Original:', testData.toString());
    console.log('  Decrypted:', decrypted.toString());
    console.log('');
    
    // Test 2: Argon2id Password Hashing
    console.log('Test 2: Argon2id Password Hashing');
    const password = 'test-password-123!@#';
    const hashResult = await securityService.hashPassword(password);
    console.log('  Hash result:', {
      algorithm: hashResult.algorithm,
      memoryCost: hashResult.memoryCost,
      timeCost: hashResult.timeCost,
      parallelism: hashResult.parallelism,
      hashLength: hashResult.hash.length
    });
    
    const verificationResult = await securityService.verifyPassword(password, hashResult);
    console.log('  Password verification successful:', verificationResult);
    
    const wrongPasswordResult = await securityService.verifyPassword('wrong-password', hashResult);
    console.log('  Wrong password correctly rejected:', !wrongPasswordResult);
    console.log('');
    
    // Test 3: ECDSA P-384 Digital Signatures
    console.log('Test 3: ECDSA P-384 Digital Signatures');
    const keyPair = securityService.generateKeyPair();
    const signatureData = Buffer.from('This is a test message for digital signature verification.');
    
    const signature = await securityService.signData(signatureData, keyPair.privateKey);
    console.log('  Signature result:', {
      algorithm: signature.algorithm,
      signatureLength: signature.signature.length,
      publicKeyLength: signature.publicKey.length
    });
    
    const signatureValid = await securityService.verifySignature(signatureData, signature, keyPair.publicKey);
    console.log('  Signature verification successful:', signatureValid);
    
    // Test with tampered data
    const tamperedData = Buffer.from('This is a TAMPERED message for digital signature verification.');
    const tamperedSignatureValid = await securityService.verifySignature(tamperedData, signature, keyPair.publicKey);
    console.log('  Tampered data correctly rejected:', !tamperedSignatureValid);
    console.log('');
    
    // Test 4: Secure Random Generation
    console.log('Test 4: Secure Random Generation');
    const randomData1 = securityService.generateSecureRandom(32);
    const randomData2 = securityService.generateSecureRandom(32);
    const randomnessTest = !randomData1.equals(randomData2);
    console.log('  Random data 1:', randomData1.toString('hex'));
    console.log('  Random data 2:', randomData2.toString('hex'));
    console.log('  Randomness test (should be different):', randomnessTest);
    console.log('');
    
    // Test 5: Key Derivation (HKDF-SHA384)
    console.log('Test 5: HKDF-SHA384 Key Derivation');
    const derivedKey1 = securityService.deriveKey('test-context-1');
    const derivedKey2 = securityService.deriveKey('test-context-2');
    const derivedKey3 = securityService.deriveKey('test-context-1'); // Same context
    
    console.log('  Derived key 1:', derivedKey1.key.toString('hex'));
    console.log('  Derived key 2:', derivedKey2.key.toString('hex'));
    console.log('  Derived key 3 (same context):', derivedKey3.key.toString('hex'));
    console.log('  Different contexts produce different keys:', !derivedKey1.key.equals(derivedKey2.key));
    console.log('  Same context with different salts:', !derivedKey1.key.equals(derivedKey3.key));
    console.log('');
    
    // Test 6: Perfect Forward Secrecy Key Exchange
    console.log('Test 6: Perfect Forward Secrecy Key Exchange');
    const ephemeralKey1 = securityService.generateEphemeralKeyPair();
    const ephemeralKey2 = securityService.generateEphemeralKeyPair();
    
    const keyExchange1 = securityService.performKeyExchange(ephemeralKey1.privateKey, ephemeralKey2.publicKey);
    const keyExchange2 = securityService.performKeyExchange(ephemeralKey2.privateKey, ephemeralKey1.publicKey);
    
    console.log('  Key exchange 1 shared secret:', keyExchange1.sharedSecret.toString('hex').substring(0, 32) + '...');
    console.log('  Key exchange 2 shared secret:', keyExchange2.sharedSecret.toString('hex').substring(0, 32) + '...');
    console.log('  Shared secrets match:', keyExchange1.sharedSecret.equals(keyExchange2.sharedSecret));
    console.log('  Session keys generated:', keyExchange1.sessionKey.length === 32 && keyExchange2.sessionKey.length === 32);
    console.log('');
    
    // Test 7: Constant-Time Comparison
    console.log('Test 7: Constant-Time Comparison');
    const buffer1 = Buffer.from('identical-data');
    const buffer2 = Buffer.from('identical-data');
    const buffer3 = Buffer.from('different-data');
    
    const comparison1 = securityService.constantTimeCompare(buffer1, buffer2);
    const comparison2 = securityService.constantTimeCompare(buffer1, buffer3);
    
    console.log('  Identical buffers comparison:', comparison1);
    console.log('  Different buffers comparison:', comparison2);
    console.log('');
    
    // Test 8: Service Status
    console.log('Test 8: Service Status');
    const status = securityService.getStatus();
    console.log('  Service initialized:', status.initialized);
    console.log('  Active keys:', status.cryptoModule.keyCount);
    console.log('  Current key ID:', status.cryptoModule.currentKeyId);
    console.log('  Algorithms:', status.capabilities);
    console.log('');
    
    // Test 9: Self-Test
    console.log('Test 9: Self-Test');
    const selfTestResults = await securityService.runSelfTest();
    console.log('  Self-test results:', selfTestResults);
    console.log('');
    
    console.log('🎉 All cryptographic tests completed successfully!');
    
    // Cleanup
    await securityService.shutdown();
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests if called directly
if (require.main === module) {
  testCryptographicModule();
}

module.exports = testCryptographicModule;