// Security Integration - Combines all security middleware
const { authenticateToken, requireRole, forceLogout } = require('./auth')
const { verifyOwnership, requirePermission, contextualAccess } = require('./rbac')
const { validateDeliveryTransition, validatePaymentTransition, ensureIdempotency } = require('./stateMachine')
const { filterResponse, constantTimeResponse, removeServerHeaders, preventEnumeration } = require('./responseFilter')
const { verifyPaymentAmount, preventDuplicatePayment, trackPaymentAttempt } = require('./paymentVerification')
const { strictReplayProtection, standardReplayProtection, paymentReplayProtection } = require('./replayProtection')
const { detectAbuse, trackFailedLogin, trackPaymentFailure } = require('./abuseDetection')
const { analyzeBehavior, flagSuspiciousActivity } = require('./behaviorAnalysis')
const { logAdminAction, monitorAdminSession } = require('./adminAudit')
const { bindDevice, checkIPReputation, updateIPReputation, trackAnomaly } = require('./deviceBinding')
const { 
  authRateLimit, 
  paymentRateLimit, 
  locationRateLimit, 
  uploadRateLimit,
  validateInput,
  validationSchemas
} = require('./security')

// Security middleware chains for different endpoint types

// Authentication endpoints (login, register, password reset)
const authSecurity = [
  removeServerHeaders,
  checkIPReputation,
  authRateLimit,
  validateInput([
    validationSchemas.email,
    validationSchemas.password
  ]),
  detectAbuse,
  analyzeBehavior,
  constantTimeResponse,
  preventEnumeration
]

// Payment endpoints
const paymentSecurity = [
  removeServerHeaders,
  authenticateToken,
  bindDevice,
  checkIPReputation,
  paymentRateLimit,
  ensureIdempotency,
  validateInput([
    validationSchemas.amount,
    validationSchemas.deliveryId
  ]),
  verifyPaymentAmount,
  preventDuplicatePayment,
  trackPaymentAttempt,
  paymentReplayProtection,
  detectAbuse,
  analyzeBehavior,
  filterResponse('payment', 'customer')
]

// Delivery management endpoints
const deliverySecurity = [
  removeServerHeaders,
  authenticateToken,
  bindDevice,
  verifyOwnership('delivery'),
  requirePermission('deliveries', 'update_own'),
  validateDeliveryTransition,
  contextualAccess('delivery_update'),
  standardReplayProtection,
  detectAbuse,
  analyzeBehavior,
  filterResponse('delivery', 'private')
]

// Admin endpoints
const adminSecurity = [
  removeServerHeaders,
  authenticateToken,
  requireRole(['ADMIN']),
  monitorAdminSession,
  logAdminAction,
  bindDevice,
  strictReplayProtection,
  detectAbuse,
  analyzeBehavior,
  filterResponse('user', 'admin')
]

// User profile endpoints
const profileSecurity = [
  removeServerHeaders,
  authenticateToken,
  bindDevice,
  verifyOwnership('user'),
  requirePermission('profile', 'update_own'),
  validateInput([
    validationSchemas.name,
    validationSchemas.phone
  ]),
  standardReplayProtection,
  detectAbuse,
  analyzeBehavior,
  filterResponse('user', 'private')
]

// File upload endpoints
const uploadSecurity = [
  removeServerHeaders,
  authenticateToken,
  bindDevice,
  uploadRateLimit,
  validateInput([validationSchemas.fileUpload]),
  detectAbuse,
  analyzeBehavior
]

// Location update endpoints (for drivers)
const locationSecurity = [
  removeServerHeaders,
  authenticateToken,
  requireRole(['DRIVER']),
  bindDevice,
  locationRateLimit,
  validateInput(validationSchemas.coordinates),
  detectAbuse,
  analyzeBehavior
]

// Public endpoints (no auth required)
const publicSecurity = [
  removeServerHeaders,
  checkIPReputation,
  detectAbuse,
  analyzeBehavior,
  constantTimeResponse,
  preventEnumeration
]

// Security event handlers
const securityEventHandlers = {
  // Handle failed login attempts
  onFailedLogin: async (identifier, ipAddress, reason) => {
    await trackFailedLogin(identifier, ipAddress)
    await updateIPReputation(ipAddress, -10, 'Failed login attempt')
    await trackAnomaly(identifier, 'FAILED_LOGIN', 'medium')
    flagSuspiciousActivity(identifier, 'FAILED_LOGIN', { reason, ipAddress })
  },

  // Handle payment failures
  onPaymentFailure: async (userId, ipAddress, reason) => {
    await trackPaymentFailure(userId, ipAddress, reason)
    await updateIPReputation(ipAddress, -25, 'Payment failure')
    await trackAnomaly(userId, 'PAYMENT_FAILURE', 'high')
    flagSuspiciousActivity(userId, 'PAYMENT_FAILURE', { reason, ipAddress })
  },

  // Handle suspicious activity
  onSuspiciousActivity: async (identifier, activityType, details) => {
    await updateIPReputation(details.ipAddress, -15, activityType)
    await trackAnomaly(identifier, activityType, 'medium')
    flagSuspiciousActivity(identifier, activityType, details)
  },

  // Handle critical security events
  onCriticalEvent: async (userId, eventType, details) => {
    // Force logout user if critical security event
    if (['TOKEN_MANIPULATION', 'PAYMENT_FRAUD', 'ACCOUNT_TAKEOVER'].includes(eventType)) {
      await forceLogout(userId)
    }
    
    await updateIPReputation(details.ipAddress, -50, eventType)
    await trackAnomaly(userId, eventType, 'critical')
    flagSuspiciousActivity(userId, eventType, details)
  }
}

// Security configuration
const securityConfig = {
  // JWT settings
  jwt: {
    expiresIn: process.env.JWT_EXPIRES_IN || '5m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '24h',
    algorithm: 'HS256'
  },

  // Rate limiting settings
  rateLimits: {
    auth: { max: 3, windowMs: 15 * 60 * 1000 },
    payment: { max: 2, windowMs: 60 * 1000 },
    location: { max: 60, windowMs: 60 * 1000 },
    upload: { max: 5, windowMs: 60 * 1000 }
  },

  // Security thresholds
  thresholds: {
    failedLogins: 5,
    paymentFailures: 3,
    rapidRequests: 100,
    reputationBlock: -100
  },

  // Feature flags
  features: {
    deviceBinding: true,
    ipReputation: true,
    behaviorAnalysis: true,
    replayProtection: true,
    abuseDetection: true,
    adminAudit: true
  }
}

// Security health check
const securityHealthCheck = () => {
  const checks = {
    jwtSecret: !!process.env.JWT_SECRET,
    encryptionKey: !!process.env.ENCRYPTION_KEY,
    corsOrigins: !!process.env.ALLOWED_ORIGINS,
    rateLimitStore: !!process.env.REDIS_URL,
    auditLogging: true, // Always enabled
    timestamp: new Date().toISOString()
  }

  const isHealthy = Object.values(checks).every(check => check === true)
  
  return {
    healthy: isHealthy,
    checks,
    score: Object.values(checks).filter(Boolean).length / Object.keys(checks).length * 100
  }
}

module.exports = {
  // Middleware chains
  authSecurity,
  paymentSecurity,
  deliverySecurity,
  adminSecurity,
  profileSecurity,
  uploadSecurity,
  locationSecurity,
  publicSecurity,

  // Event handlers
  securityEventHandlers,

  // Configuration
  securityConfig,

  // Health check
  securityHealthCheck
}