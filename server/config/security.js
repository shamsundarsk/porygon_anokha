/**
 * Security Configuration
 * Centralized configuration for all security-related settings
 */

const path = require('path');

const securityConfig = {
  // Cryptographic settings
  crypto: {
    // Key rotation interval (24 hours in milliseconds)
    keyRotationInterval: 24 * 60 * 60 * 1000,
    
    // Argon2id parameters (Requirement 1.2)
    argon2: {
      memoryCost: 32768, // 32MB in KB
      timeCost: 3,       // 3 iterations
      parallelism: 4,    // 4 parallel threads
      hashLength: 32     // 32 byte output
    },
    
    // AES-256-GCM settings (Requirement 1.1)
    aes: {
      algorithm: 'aes-256-gcm',
      keyLength: 32,     // 256 bits
      nonceLength: 12    // 96 bits for GCM
    },
    
    // ECDSA P-384 settings (Requirement 1.3)
    ecdsa: {
      curve: 'secp384r1',
      hashAlgorithm: 'sha384'
    },
    
    // HKDF settings (Requirement 1.8)
    hkdf: {
      algorithm: 'sha384',
      saltLength: 32,
      infoLength: 32
    }
  },
  
  // Key management settings
  keyManagement: {
    keyStorePath: process.env.KEY_STORE_PATH || path.join(process.cwd(), 'keys'),
    storageEncryptionKey: process.env.KEY_STORAGE_MASTER_KEY,
    
    // Key rotation schedules
    rotationSchedule: {
      encryption: '24h',    // Encryption keys rotate every 24 hours
      signing: '30d',       // Signing keys rotate every 30 days
      session: '1h',        // Session keys rotate every hour
      temporary: null       // Temporary keys don't rotate
    },
    
    // Key retention periods
    retention: {
      encryption: 365 * 24 * 60 * 60 * 1000, // 1 year
      signing: 2 * 365 * 24 * 60 * 60 * 1000, // 2 years
      session: 24 * 60 * 60 * 1000,           // 1 day
      temporary: 60 * 60 * 1000               // 1 hour
    }
  },
  
  // HSM configuration
  hsm: {
    enabled: process.env.HSM_ENABLED === 'true',
    provider: process.env.HSM_PROVIDER || 'mock',
    
    // AWS CloudHSM configuration
    aws: {
      clusterId: process.env.AWS_CLOUDHSM_CLUSTER_ID,
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    },
    
    // Azure HSM configuration
    azure: {
      vaultUrl: process.env.AZURE_KEY_VAULT_URL,
      resourceGroup: process.env.AZURE_RESOURCE_GROUP,
      hsmName: process.env.AZURE_HSM_NAME,
      credentials: {
        clientId: process.env.AZURE_CLIENT_ID,
        clientSecret: process.env.AZURE_CLIENT_SECRET,
        tenantId: process.env.AZURE_TENANT_ID
      }
    },
    
    // PKCS#11 configuration
    pkcs11: {
      libraryPath: process.env.PKCS11_LIBRARY_PATH,
      slotId: parseInt(process.env.PKCS11_SLOT_ID) || 0,
      pin: process.env.PKCS11_PIN
    }
  },
  
  // Security service options
  service: {
    selfTestOnStartup: process.env.SECURITY_SELF_TEST !== 'false',
    enableHSMFallback: process.env.HSM_FALLBACK_ENABLED === 'true',
    logLevel: process.env.SECURITY_LOG_LEVEL || 'info',
    
    // Performance settings
    maxConcurrentOperations: parseInt(process.env.MAX_CRYPTO_OPERATIONS) || 100,
    operationTimeout: parseInt(process.env.CRYPTO_OPERATION_TIMEOUT) || 30000, // 30 seconds
    
    // Security hardening
    constantTimeOperations: true,
    secureMemoryClearing: true,
    timingAttackPrevention: true
  },
  
  // Environment-specific overrides
  development: {
    hsm: {
      enabled: false,
      provider: 'mock'
    },
    service: {
      selfTestOnStartup: true,
      logLevel: 'debug'
    }
  },
  
  production: {
    hsm: {
      enabled: true,
      provider: process.env.HSM_PROVIDER || 'aws-cloudhsm'
    },
    service: {
      selfTestOnStartup: true,
      logLevel: 'warn',
      enableHSMFallback: false
    }
  },
  
  test: {
    hsm: {
      enabled: false,
      provider: 'mock'
    },
    service: {
      selfTestOnStartup: false,
      logLevel: 'error'
    },
    crypto: {
      keyRotationInterval: 1000 // 1 second for testing
    }
  }
};

/**
 * Get configuration for current environment
 */
function getSecurityConfig() {
  const env = process.env.NODE_ENV || 'development';
  const baseConfig = { ...securityConfig };
  
  // Apply environment-specific overrides
  if (securityConfig[env]) {
    const envConfig = securityConfig[env];
    
    // Deep merge configuration
    Object.keys(envConfig).forEach(key => {
      if (typeof envConfig[key] === 'object' && !Array.isArray(envConfig[key])) {
        baseConfig[key] = { ...baseConfig[key], ...envConfig[key] };
      } else {
        baseConfig[key] = envConfig[key];
      }
    });
  }
  
  return baseConfig;
}

/**
 * Validate security configuration
 */
function validateSecurityConfig(config) {
  const errors = [];
  
  // Validate required environment variables
  if (config.hsm.enabled) {
    if (!config.keyManagement.storageEncryptionKey) {
      errors.push('KEY_STORAGE_MASTER_KEY environment variable required when HSM is enabled');
    }
    
    switch (config.hsm.provider) {
      case 'aws-cloudhsm':
        if (!config.hsm.aws.clusterId) {
          errors.push('AWS_CLOUDHSM_CLUSTER_ID required for AWS CloudHSM');
        }
        break;
      case 'azure-hsm':
        if (!config.hsm.azure.vaultUrl) {
          errors.push('AZURE_KEY_VAULT_URL required for Azure HSM');
        }
        break;
      case 'pkcs11':
        if (!config.hsm.pkcs11.libraryPath) {
          errors.push('PKCS11_LIBRARY_PATH required for PKCS#11 HSM');
        }
        break;
    }
  }
  
  // Validate cryptographic parameters
  if (config.crypto.argon2.memoryCost < 32768) {
    errors.push('Argon2id memory cost must be at least 32MB (32768 KB)');
  }
  
  if (config.crypto.argon2.timeCost < 3) {
    errors.push('Argon2id time cost must be at least 3 iterations');
  }
  
  if (config.crypto.argon2.parallelism < 4) {
    errors.push('Argon2id parallelism must be at least 4 threads');
  }
  
  if (errors.length > 0) {
    throw new Error(`Security configuration validation failed:\n${errors.join('\n')}`);
  }
  
  return true;
}

/**
 * Initialize security configuration
 */
function initializeSecurityConfig() {
  const config = getSecurityConfig();
  validateSecurityConfig(config);
  
  console.log(`Security configuration initialized for ${process.env.NODE_ENV || 'development'} environment`);
  console.log(`HSM enabled: ${config.hsm.enabled}`);
  console.log(`HSM provider: ${config.hsm.provider}`);
  console.log(`Key rotation interval: ${config.crypto.keyRotationInterval}ms`);
  
  return config;
}

module.exports = {
  getSecurityConfig,
  validateSecurityConfig,
  initializeSecurityConfig,
  securityConfig
};