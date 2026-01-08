/**
 * Security Service Initialization
 * Initializes and configures the advanced security system
 */

const SecurityService = require('./securityService');
const { initializeSecurityConfig } = require('../config/security');

let securityService = null;

/**
 * Initialize the security service
 */
async function initializeSecurity() {
  try {
    console.log('Initializing Advanced Security System...');
    
    // Load and validate security configuration
    const config = initializeSecurityConfig();
    
    // Create security service instance
    securityService = new SecurityService({
      keyRotationInterval: config.crypto.keyRotationInterval,
      keyStorePath: config.keyManagement.keyStorePath,
      rotationSchedule: config.keyManagement.rotationSchedule,
      storageEncryptionKey: config.keyManagement.storageEncryptionKey,
      hsmEnabled: config.hsm.enabled,
      hsmProvider: config.hsm.provider,
      hsmConfig: getHSMConfig(config)
    });
    
    // Initialize the service
    await securityService.initialize();
    
    console.log('Advanced Security System initialized successfully');
    console.log('Security Status:', securityService.getStatus());
    
    return securityService;
    
  } catch (error) {
    console.error('Failed to initialize security system:', error.message);
    throw error;
  }
}

/**
 * Get HSM configuration based on provider
 */
function getHSMConfig(config) {
  if (!config.hsm.enabled) {
    return {};
  }
  
  switch (config.hsm.provider) {
    case 'aws-cloudhsm':
      return {
        clusterId: config.hsm.aws.clusterId,
        region: config.hsm.aws.region,
        credentials: config.hsm.aws.credentials
      };
      
    case 'azure-hsm':
      return {
        vaultUrl: config.hsm.azure.vaultUrl,
        resourceGroup: config.hsm.azure.resourceGroup,
        hsmName: config.hsm.azure.hsmName,
        credentials: config.hsm.azure.credentials
      };
      
    case 'pkcs11':
      return {
        libraryPath: config.hsm.pkcs11.libraryPath,
        slotId: config.hsm.pkcs11.slotId,
        pin: config.hsm.pkcs11.pin
      };
      
    case 'mock':
    default:
      return {};
  }
}

/**
 * Get the initialized security service
 */
function getSecurityService() {
  if (!securityService) {
    throw new Error('Security service not initialized. Call initializeSecurity() first.');
  }
  return securityService;
}

/**
 * Shutdown the security service
 */
async function shutdownSecurity() {
  if (securityService) {
    await securityService.shutdown();
    securityService = null;
    console.log('Security service shutdown complete');
  }
}

/**
 * Health check for security service
 */
async function securityHealthCheck() {
  try {
    if (!securityService) {
      return {
        status: 'error',
        message: 'Security service not initialized'
      };
    }
    
    const status = securityService.getStatus();
    const hsmStatus = await securityService.getHSMStatus();
    
    return {
      status: 'healthy',
      initialized: status.initialized,
      cryptoModule: status.cryptoModule,
      keyManager: status.keyManager,
      hsm: hsmStatus,
      capabilities: status.capabilities
    };
    
  } catch (error) {
    return {
      status: 'error',
      message: error.message
    };
  }
}

/**
 * Express middleware for security service
 */
function securityMiddleware(req, res, next) {
  try {
    req.security = getSecurityService();
    next();
  } catch (error) {
    res.status(500).json({
      error: 'Security service unavailable',
      message: error.message
    });
  }
}

/**
 * Express route for security health check
 */
function securityHealthRoute(req, res) {
  securityHealthCheck()
    .then(health => {
      const statusCode = health.status === 'healthy' ? 200 : 500;
      res.status(statusCode).json(health);
    })
    .catch(error => {
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    });
}

/**
 * Express route for security status
 */
function securityStatusRoute(req, res) {
  try {
    const security = getSecurityService();
    const status = security.getStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({
      error: 'Security service unavailable',
      message: error.message
    });
  }
}

/**
 * Graceful shutdown handler
 */
function setupGracefulShutdown() {
  const shutdown = async (signal) => {
    console.log(`Received ${signal}, shutting down gracefully...`);
    await shutdownSecurity();
    process.exit(0);
  };
  
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGUSR2', () => shutdown('SIGUSR2')); // nodemon restart
}

module.exports = {
  initializeSecurity,
  getSecurityService,
  shutdownSecurity,
  securityHealthCheck,
  securityMiddleware,
  securityHealthRoute,
  securityStatusRoute,
  setupGracefulShutdown
};