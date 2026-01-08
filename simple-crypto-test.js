const CryptographicModule = require('./server/services/cryptographic');

async function simpleTest() {
  console.log('Testing basic cryptographic operations...');
  
  try {
    const crypto = new CryptographicModule();
    
    // Test encryption
    const testData = Buffer.from('Hello World');
    const encrypted = crypto.encrypt(testData);
    console.log('✓ Encryption successful');
    
    const decrypted = crypto.decrypt(encrypted);
    console.log('✓ Decryption successful:', testData.equals(decrypted));
    
    // Test password hashing
    const password = 'test123';
    const hash = await crypto.hashPassword(password);
    console.log('✓ Password hashing successful');
    
    const verified = await crypto.verifyPassword(password, hash);
    console.log('✓ Password verification successful:', verified);
    
    // Test key generation
    const keyPair = crypto.generateKeyPair();
    console.log('✓ Key pair generation successful');
    
    // Test signing
    const signature = crypto.sign(testData, keyPair.privateKey);
    console.log('✓ Signing successful');
    
    const signatureValid = crypto.verify(testData, signature, keyPair.publicKey);
    console.log('✓ Signature verification successful:', signatureValid);
    
    console.log('All basic tests passed!');
    
  } catch (error) {
    console.error('Test failed:', error.message);
    console.error(error.stack);
  }
}

simpleTest();