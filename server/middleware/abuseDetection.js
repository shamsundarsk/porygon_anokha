const { prisma } = require('../database/connection')
const { logSecurityEvent } = require('../services/audit')

// Abuse detection patterns
const ABUSE_PATTERNS = {
  RAPID_REQUESTS: {
    threshold: 100,
    window: 60 * 1000, // 1 minute
    severity: 'high'
  },
  FAILED_LOGINS: {
    threshold: 5,
    window: 15 * 60 * 1000, // 15 minutes
    severity: 'high'
  },
  PAYMENT_FAILURES: {
    threshold: 3,
    window: 60 * 60 * 1000, // 1 hour
    severity: 'critical'
  },
  LOCATION_SPOOFING: {
    threshold: 10,
    window: 5 * 60 * 1000, // 5 minutes
    severity: 'medium'
  },
  SUSPICIOUS_PATTERNS: {
    threshold: 5,
    window: 30 * 60 * 1000, // 30 minutes
    severity: 'medium'
  }
}

// Track user behavior
const behaviorTracker = new Map()

// Main abuse detection middleware
const detectAbuse = async (req, res, next) => {
  try {
    const userId = req.user?.userId
    const ipAddress = req.ip
    const userAgent = req.get('User-Agent')
    const now = Date.now()

    // Track request patterns
    await trackRequestPattern(userId, ipAddress, req.path, now)

    // Check for various abuse patterns
    const abuseDetected = await Promise.all([
      checkRapidRequests(userId, ipAddress, now),
      checkSuspiciousUserAgent(userAgent),
      checkGeolocationAnomalies(userId, ipAddress),
      checkBehaviorAnomalies(userId, req)
    ])

    const detectedAbuse = abuseDetected.filter(Boolean)

    if (detectedAbuse.length > 0) {
      await logSecurityEvent({
        userId,
        eventType: 'ABUSE_DETECTED',
        severity: 'high',
        description: 'Multiple abuse patterns detected',
        ipAddress,
        userAgent,
        metadata: { 
          patterns: detectedAbuse,
          endpoint: req.path,
          method: req.method
        }
      })

      // Apply rate limiting or blocking based on severity
      const highSeverityCount = detectedAbuse.filter(abuse => abuse.severity === 'critical').length
      if (highSeverityCount > 0) {
        return res.status(429).json({ 
          error: 'Suspicious activity detected. Please try again later.' 
        })
      }
    }

    next()
  } catch (error) {
    console.error('Abuse detection error:', error)
    next() // Don't block requests for detection errors
  }
}

// Track request patterns
const trackRequestPattern = async (userId, ipAddress, path, timestamp) => {
  const key = userId || ipAddress
  
  if (!behaviorTracker.has(key)) {
    behaviorTracker.set(key, {
      requests: [],
      failedLogins: [],
      paymentFailures: [],
      suspiciousActivities: []
    })
  }

  const tracker = behaviorTracker.get(key)
  tracker.requests.push({ path, timestamp })

  // Clean old entries
  const oneHourAgo = timestamp - 60 * 60 * 1000
  tracker.requests = tracker.requests.filter(req => req.timestamp > oneHourAgo)
}

// Check for rapid requests
const checkRapidRequests = async (userId, ipAddress, now) => {
  const key = userId || ipAddress
  const tracker = behaviorTracker.get(key)
  
  if (!tracker) return null

  const recentRequests = tracker.requests.filter(
    req => now - req.timestamp < ABUSE_PATTERNS.RAPID_REQUESTS.window
  )

  if (recentRequests.length > ABUSE_PATTERNS.RAPID_REQUESTS.threshold) {
    return {
      type: 'RAPID_REQUESTS',
      count: recentRequests.length,
      threshold: ABUSE_PATTERNS.RAPID_REQUESTS.threshold,
      severity: ABUSE_PATTERNS.RAPID_REQUESTS.severity
    }
  }

  return null
}

// Check for suspicious user agents
const checkSuspiciousUserAgent = async (userAgent) => {
  if (!userAgent) {
    return {
      type: 'MISSING_USER_AGENT',
      severity: 'medium'
    }
  }

  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i,
    /go-http/i
  ]

  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent))
  
  if (isSuspicious) {
    return {
      type: 'SUSPICIOUS_USER_AGENT',
      userAgent,
      severity: 'medium'
    }
  }

  return null
}

// Check for geolocation anomalies
const checkGeolocationAnomalies = async (userId, ipAddress) => {
  if (!userId) return null

  try {
    // Get recent login locations for user
    const recentLogins = await prisma.auditLog.findMany({
      where: {
        userId,
        action: 'LOGIN',
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      select: { ipAddress: true, timestamp: true },
      orderBy: { timestamp: 'desc' },
      take: 10
    })

    if (recentLogins.length < 2) return null

    // Check for rapid location changes (simplified)
    const uniqueIPs = new Set(recentLogins.map(login => login.ipAddress))
    
    if (uniqueIPs.size > 5) {
      return {
        type: 'MULTIPLE_LOCATIONS',
        uniqueLocations: uniqueIPs.size,
        severity: 'medium'
      }
    }

    return null
  } catch (error) {
    console.error('Geolocation check error:', error)
    return null
  }
}

// Check for behavioral anomalies
const checkBehaviorAnomalies = async (userId, req) => {
  if (!userId) return null

  const anomalies = []

  // Check for unusual request patterns
  const key = userId
  const tracker = behaviorTracker.get(key)
  
  if (tracker) {
    const now = Date.now()
    const recentRequests = tracker.requests.filter(
      req => now - req.timestamp < 10 * 60 * 1000 // Last 10 minutes
    )

    // Check for repetitive patterns
    const pathCounts = {}
    recentRequests.forEach(req => {
      pathCounts[req.path] = (pathCounts[req.path] || 0) + 1
    })

    const maxPathCount = Math.max(...Object.values(pathCounts))
    if (maxPathCount > 20) {
      anomalies.push({
        type: 'REPETITIVE_REQUESTS',
        path: Object.keys(pathCounts).find(path => pathCounts[path] === maxPathCount),
        count: maxPathCount,
        severity: 'medium'
      })
    }
  }

  // Check for unusual request timing
  if (req.headers['x-timestamp']) {
    const requestTime = parseInt(req.headers['x-timestamp']) * 1000
    const now = Date.now()
    const timeDiff = Math.abs(now - requestTime)

    if (timeDiff > 5 * 60 * 1000) { // More than 5 minutes off
      anomalies.push({
        type: 'TIME_MANIPULATION',
        timeDiff,
        severity: 'high'
      })
    }
  }

  return anomalies.length > 0 ? anomalies : null
}

// Track failed login attempts
const trackFailedLogin = async (identifier, ipAddress) => {
  const key = identifier || ipAddress
  
  if (!behaviorTracker.has(key)) {
    behaviorTracker.set(key, {
      requests: [],
      failedLogins: [],
      paymentFailures: [],
      suspiciousActivities: []
    })
  }

  const tracker = behaviorTracker.get(key)
  tracker.failedLogins.push({ timestamp: Date.now(), ipAddress })

  // Clean old entries
  const windowStart = Date.now() - ABUSE_PATTERNS.FAILED_LOGINS.window
  tracker.failedLogins = tracker.failedLogins.filter(
    login => login.timestamp > windowStart
  )

  // Check threshold
  if (tracker.failedLogins.length >= ABUSE_PATTERNS.FAILED_LOGINS.threshold) {
    await logSecurityEvent({
      eventType: 'BRUTE_FORCE_ATTEMPT',
      severity: 'critical',
      description: 'Multiple failed login attempts detected',
      ipAddress,
      metadata: { 
        identifier,
        attemptCount: tracker.failedLogins.length,
        timeWindow: ABUSE_PATTERNS.FAILED_LOGINS.window
      }
    })

    return true // Indicates abuse detected
  }

  return false
}

// Track payment failures
const trackPaymentFailure = async (userId, ipAddress, reason) => {
  const key = userId || ipAddress
  
  if (!behaviorTracker.has(key)) {
    behaviorTracker.set(key, {
      requests: [],
      failedLogins: [],
      paymentFailures: [],
      suspiciousActivities: []
    })
  }

  const tracker = behaviorTracker.get(key)
  tracker.paymentFailures.push({ 
    timestamp: Date.now(), 
    ipAddress, 
    reason 
  })

  // Clean old entries
  const windowStart = Date.now() - ABUSE_PATTERNS.PAYMENT_FAILURES.window
  tracker.paymentFailures = tracker.paymentFailures.filter(
    failure => failure.timestamp > windowStart
  )

  // Check threshold
  if (tracker.paymentFailures.length >= ABUSE_PATTERNS.PAYMENT_FAILURES.threshold) {
    await logSecurityEvent({
      userId,
      eventType: 'PAYMENT_ABUSE',
      severity: 'critical',
      description: 'Multiple payment failures detected',
      ipAddress,
      metadata: { 
        failureCount: tracker.paymentFailures.length,
        reasons: tracker.paymentFailures.map(f => f.reason)
      }
    })

    return true
  }

  return false
}

// Clean up old tracking data
setInterval(() => {
  const now = Date.now()
  const maxAge = 60 * 60 * 1000 // 1 hour

  for (const [key, tracker] of behaviorTracker.entries()) {
    // Clean old requests
    tracker.requests = tracker.requests.filter(
      req => now - req.timestamp < maxAge
    )
    
    // Remove empty trackers
    if (tracker.requests.length === 0 && 
        tracker.failedLogins.length === 0 && 
        tracker.paymentFailures.length === 0) {
      behaviorTracker.delete(key)
    }
  }
}, 10 * 60 * 1000) // Clean up every 10 minutes

module.exports = {
  detectAbuse,
  trackFailedLogin,
  trackPaymentFailure,
  ABUSE_PATTERNS
}