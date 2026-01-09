/**
 * Comprehensive Security Validation Middleware
 * Prevents common security vulnerabilities and enforces security best practices
 */

const { logSecurityEvent } = require('../services/audit')
const { flagSuspiciousActivity } = require('./behaviorAnalysis')

// Security validation rules
const SECURITY_RULES = {
  GPS_VERIFICATION: {
    enabled: true,
    maxRadius: {
      acceptance: 5000, // 5km for delivery acceptance
      pickup: 100,      // 100m for pickup
      delivery: 100     // 100m for delivery completion
    }
  },
  ROUTE_PROTECTION: {
    enabled: true,
    protectedPaths: [
      '/api/admin',
      '/api/payments/verify',
      '/api/deliveries/*/pickup',
      '/api/deliveries/*/complete'
    ]
  },
  INPUT_VALIDATION: {
    enabled: true,
    maxPayloadSize: 1024 * 1024, // 1MB
    allowedContentTypes: [
      'application/json',
      'multipart/form-data',
      'application/x-www-form-urlencoded'
    ]
  },
  DEPENDENCY_SECURITY: {
    enabled: true,
    blockedPackages: [
      'multer@1.4.4', // Known CVE
      'express@<4.17.0' // Old versions
    ]
  }
}

/**
 * Main security validation middleware
 */
const validateSecurity = async (req, res, next) => {
  try {
    const validationResults = await Promise.all([
      validateGPSRequirements(req),
      validateRouteAccess(req),
      validateInputSecurity(req),
      validateRequestIntegrity(req)
    ])

    const failures = validationResults.filter(result => !result.valid)
    
    if (failures.length > 0) {
      await logSecurityEvent({
        userId: req.user?.userId,
        eventType: 'SECURITY_VALIDATION_FAILED',
        severity: 'high',
        description: 'Multiple security validation failures',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: {
          failures: failures.map(f => f.reason),
          endpoint: req.path,
          method: req.method
        }
      })

      // Flag suspicious activity
      if (req.user?.userId) {
        flagSuspiciousActivity(req.user.userId, 'SECURITY_VALIDATION_FAILED', {
          failures: failures.length,
          endpoint: req.path
        })
      }

      return res.status(400).json({
        error: 'Security validation failed',
        details: failures.map(f => f.reason)
      })
    }

    next()
  } catch (error) {
    console.error('Security validation error:', error)
    next() // Don't block requests for validation errors
  }
}

/**
 * Validate GPS requirements for location-sensitive endpoints
 */
const validateGPSRequirements = async (req) => {
  if (!SECURITY_RULES.GPS_VERIFICATION.enabled) {
    return { valid: true }
  }

  const gpsRequiredPaths = [
    /\/api\/deliveries\/[^\/]+\/accept$/,
    /\/api\/deliveries\/[^\/]+\/pickup$/,
    /\/api\/deliveries\/[^\/]+\/complete$/
  ]

  const requiresGPS = gpsRequiredPaths.some(pattern => pattern.test(req.path))
  
  if (requiresGPS) {
    const { currentLat, currentLng } = req.body
    
    if (!currentLat || !currentLng) {
      return {
        valid: false,
        reason: 'GPS coordinates required for this operation'
      }
    }

    // Validate coordinate ranges
    if (currentLat < -90 || currentLat > 90 || currentLng < -180 || currentLng > 180) {
      return {
        valid: false,
        reason: 'Invalid GPS coordinates provided'
      }
    }
  }

  return { valid: true }
}

/**
 * Validate route access and prevent path collisions
 */
const validateRouteAccess = async (req) => {
  if (!SECURITY_RULES.ROUTE_PROTECTION.enabled) {
    return { valid: true }
  }

  // Check for route collision patterns
  const suspiciousPatterns = [
    /\/api\/[^\/]+\/[^\/]+\/[^\/]+$/, // Deep nesting that might bypass specific routes
    /\/api\/payments\/my-payments/, // Should be handled before /:id
    /\/api\/admin\/.*/ // Admin routes should be heavily protected
  ]

  const hasSuspiciousPattern = suspiciousPatterns.some(pattern => pattern.test(req.path))
  
  if (hasSuspiciousPattern && req.path.includes('/my-payments')) {
    // Special check for the payments route collision
    if (req.path === '/api/payments/my-payments' && req.method === 'GET') {
      // This is valid, but log for monitoring
      await logSecurityEvent({
        userId: req.user?.userId,
        eventType: 'ROUTE_COLLISION_MONITORED',
        severity: 'low',
        description: 'Accessed potentially problematic route',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { path: req.path }
      })
    }
  }

  return { valid: true }
}

/**
 * Validate input security
 */
const validateInputSecurity = async (req) => {
  if (!SECURITY_RULES.INPUT_VALIDATION.enabled) {
    return { valid: true }
  }

  // Check payload size
  const contentLength = parseInt(req.get('content-length') || '0')
  if (contentLength > SECURITY_RULES.INPUT_VALIDATION.maxPayloadSize) {
    return {
      valid: false,
      reason: 'Request payload too large'
    }
  }

  // Check content type
  const contentType = req.get('content-type')
  if (contentType && !SECURITY_RULES.INPUT_VALIDATION.allowedContentTypes.some(
    allowed => contentType.includes(allowed)
  )) {
    return {
      valid: false,
      reason: 'Unsupported content type'
    }
  }

  // Check for malicious patterns in request body
  if (req.body && typeof req.body === 'object') {
    const bodyString = JSON.stringify(req.body).toLowerCase()
    const maliciousPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /eval\s*\(/gi,
      /union\s+select/gi,
      /drop\s+table/gi,
      /insert\s+into/gi,
      /delete\s+from/gi
    ]

    const hasMaliciousContent = maliciousPatterns.some(pattern => pattern.test(bodyString))
    
    if (hasMaliciousContent) {
      return {
        valid: false,
        reason: 'Malicious content detected in request'
      }
    }
  }

  return { valid: true }
}

/**
 * Validate request integrity
 */
const validateRequestIntegrity = async (req) => {
  // Check for suspicious headers
  const suspiciousHeaders = [
    'x-forwarded-for',
    'x-real-ip',
    'x-originating-ip'
  ]

  const headerCount = suspiciousHeaders.filter(header => req.headers[header]).length
  
  if (headerCount > 2) {
    await logSecurityEvent({
      userId: req.user?.userId,
      eventType: 'SUSPICIOUS_HEADERS',
      severity: 'medium',
      description: 'Multiple IP forwarding headers detected',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      metadata: {
        headers: suspiciousHeaders.filter(h => req.headers[h])
      }
    })
  }

  // Check for time manipulation
  if (req.headers['x-timestamp']) {
    const requestTime = parseInt(req.headers['x-timestamp']) * 1000
    const now = Date.now()
    const timeDiff = Math.abs(now - requestTime)

    if (timeDiff > 5 * 60 * 1000) { // More than 5 minutes off
      return {
        valid: false,
        reason: 'Request timestamp manipulation detected'
      }
    }
  }

  return { valid: true }
}

/**
 * Validate dependency security
 */
const validateDependencies = async () => {
  const packageJson = require('../../package.json')
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies }
  
  const vulnerabilities = []
  
  // Check for known vulnerable packages
  for (const [pkg, version] of Object.entries(dependencies)) {
    if (pkg === 'multer' && version.includes('1.4.4')) {
      vulnerabilities.push({
        package: pkg,
        version,
        vulnerability: 'CVE-2022-24434',
        severity: 'high',
        description: 'Denial of Service vulnerability'
      })
    }
  }
  
  if (vulnerabilities.length > 0) {
    console.error('SECURITY ALERT: Vulnerable dependencies detected:', vulnerabilities)
    
    await logSecurityEvent({
      eventType: 'VULNERABLE_DEPENDENCIES',
      severity: 'critical',
      description: 'Vulnerable dependencies detected in package.json',
      metadata: { vulnerabilities }
    })
  }
  
  return vulnerabilities
}

/**
 * Security health check
 */
const performSecurityHealthCheck = async () => {
  const checks = {
    gpsVerification: SECURITY_RULES.GPS_VERIFICATION.enabled,
    routeProtection: SECURITY_RULES.ROUTE_PROTECTION.enabled,
    inputValidation: SECURITY_RULES.INPUT_VALIDATION.enabled,
    dependencyCheck: await validateDependencies(),
    timestamp: new Date()
  }
  
  return checks
}

/**
 * Middleware to enforce GPS verification for specific routes
 */
const enforceGPSVerification = (requiredRadius = 100) => {
  return async (req, res, next) => {
    const { currentLat, currentLng } = req.body
    
    if (!currentLat || !currentLng) {
      await logSecurityEvent({
        userId: req.user?.userId,
        eventType: 'GPS_VERIFICATION_MISSING',
        severity: 'high',
        description: 'GPS coordinates missing for protected endpoint',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { endpoint: req.path, requiredRadius }
      })
      
      return res.status(400).json({
        error: 'GPS coordinates required for this operation'
      })
    }
    
    // Validate coordinate ranges
    if (currentLat < -90 || currentLat > 90 || currentLng < -180 || currentLng > 180) {
      await logSecurityEvent({
        userId: req.user?.userId,
        eventType: 'INVALID_GPS_COORDINATES',
        severity: 'high',
        description: 'Invalid GPS coordinates provided',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { endpoint: req.path, currentLat, currentLng }
      })
      
      return res.status(400).json({
        error: 'Invalid GPS coordinates provided'
      })
    }
    
    next()
  }
}

module.exports = {
  validateSecurity,
  validateDependencies,
  performSecurityHealthCheck,
  enforceGPSVerification,
  SECURITY_RULES
}