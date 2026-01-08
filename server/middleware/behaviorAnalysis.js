const { prisma } = require('../database/connection')
const { logSecurityEvent } = require('../services/audit')

// Behavior scoring system
const BEHAVIOR_SCORES = {
  HONEYPOT_ACCESS: 50,
  FAILED_LOGIN: 10,
  RAPID_REQUESTS: 20,
  SUSPICIOUS_USER_AGENT: 15,
  INVALID_INPUT: 5,
  UNAUTHORIZED_ACCESS: 30,
  PAYMENT_FAILURE: 25,
  LOCATION_ANOMALY: 15,
  TIME_MANIPULATION: 20,
  ENUMERATION_ATTEMPT: 25
}

const RISK_THRESHOLDS = {
  LOW: 20,
  MEDIUM: 50,
  HIGH: 100,
  CRITICAL: 200
}

// User behavior tracking
const userBehaviorScores = new Map()

// Analyze and score user behavior
const analyzeBehavior = async (req, res, next) => {
  try {
    const userId = req.user?.userId
    const ipAddress = req.ip
    const identifier = userId || ipAddress

    // Initialize behavior score if not exists
    if (!userBehaviorScores.has(identifier)) {
      userBehaviorScores.set(identifier, {
        score: 0,
        lastActivity: Date.now(),
        flags: [],
        riskLevel: 'LOW'
      })
    }

    const behavior = userBehaviorScores.get(identifier)
    behavior.lastActivity = Date.now()

    // Analyze current request for suspicious patterns
    const suspiciousFlags = await detectSuspiciousPatterns(req)
    
    if (suspiciousFlags.length > 0) {
      // Add flags and update score
      suspiciousFlags.forEach(flag => {
        behavior.flags.push({
          type: flag.type,
          timestamp: Date.now(),
          details: flag.details
        })
        behavior.score += BEHAVIOR_SCORES[flag.type] || 10
      })

      // Update risk level
      behavior.riskLevel = calculateRiskLevel(behavior.score)

      // Log suspicious behavior
      await logSecurityEvent({
        userId,
        eventType: 'SUSPICIOUS_BEHAVIOR',
        severity: behavior.riskLevel.toLowerCase(),
        description: `Suspicious behavior detected: ${suspiciousFlags.map(f => f.type).join(', ')}`,
        ipAddress,
        userAgent: req.get('User-Agent'),
        metadata: {
          flags: suspiciousFlags,
          totalScore: behavior.score,
          riskLevel: behavior.riskLevel
        }
      })

      // Take action based on risk level
      await handleRiskLevel(req, res, behavior, identifier)
    }

    // Decay score over time (reduce by 1 point every minute)
    const timeSinceLastDecay = Date.now() - (behavior.lastDecay || behavior.lastActivity)
    if (timeSinceLastDecay > 60 * 1000) { // 1 minute
      const decayAmount = Math.floor(timeSinceLastDecay / (60 * 1000))
      behavior.score = Math.max(0, behavior.score - decayAmount)
      behavior.lastDecay = Date.now()
      behavior.riskLevel = calculateRiskLevel(behavior.score)
    }

    // Attach behavior info to request
    req.userBehavior = behavior

    next()
  } catch (error) {
    console.error('Behavior analysis error:', error)
    next()
  }
}

// Detect suspicious patterns in request
const detectSuspiciousPatterns = async (req) => {
  const flags = []
  const userAgent = req.get('User-Agent')
  const path = req.path

  // Check for bot-like user agents
  if (!userAgent || /bot|crawler|spider|scraper/i.test(userAgent)) {
    flags.push({
      type: 'SUSPICIOUS_USER_AGENT',
      details: { userAgent }
    })
  }

  // Check for common attack patterns in path
  const attackPatterns = [
    /\.\./,  // Directory traversal
    /union.*select/i,  // SQL injection
    /<script/i,  // XSS
    /javascript:/i,  // XSS
    /eval\(/i,  // Code injection
    /exec\(/i,  // Command injection
    /system\(/i  // Command injection
  ]

  if (attackPatterns.some(pattern => pattern.test(path))) {
    flags.push({
      type: 'ATTACK_PATTERN',
      details: { path, pattern: 'malicious_pattern' }
    })
  }

  // Check for enumeration attempts
  if (path.includes('/api/') && req.method === 'GET') {
    const enumerationPatterns = [
      /\/api\/users\/\d+$/,
      /\/api\/admin/,
      /\/api\/config/,
      /\/api\/debug/
    ]

    if (enumerationPatterns.some(pattern => pattern.test(path))) {
      flags.push({
        type: 'ENUMERATION_ATTEMPT',
        details: { path }
      })
    }
  }

  // Check for suspicious request headers
  const suspiciousHeaders = [
    'x-forwarded-for',
    'x-real-ip',
    'x-originating-ip'
  ]

  const headerFlags = suspiciousHeaders.filter(header => req.headers[header])
  if (headerFlags.length > 1) {
    flags.push({
      type: 'HEADER_MANIPULATION',
      details: { headers: headerFlags }
    })
  }

  // Check for unusual request timing
  if (req.headers['x-timestamp']) {
    const requestTime = parseInt(req.headers['x-timestamp']) * 1000
    const now = Date.now()
    const timeDiff = Math.abs(now - requestTime)

    if (timeDiff > 5 * 60 * 1000) { // More than 5 minutes off
      flags.push({
        type: 'TIME_MANIPULATION',
        details: { timeDiff, requestTime, serverTime: now }
      })
    }
  }

  // Check for suspicious request body patterns
  if (req.body && typeof req.body === 'object') {
    const bodyString = JSON.stringify(req.body).toLowerCase()
    
    if (bodyString.includes('script') || 
        bodyString.includes('javascript') || 
        bodyString.includes('eval(') ||
        bodyString.includes('union select')) {
      flags.push({
        type: 'MALICIOUS_PAYLOAD',
        details: { bodySize: bodyString.length }
      })
    }
  }

  return flags
}

// Calculate risk level based on score
const calculateRiskLevel = (score) => {
  if (score >= RISK_THRESHOLDS.CRITICAL) return 'CRITICAL'
  if (score >= RISK_THRESHOLDS.HIGH) return 'HIGH'
  if (score >= RISK_THRESHOLDS.MEDIUM) return 'MEDIUM'
  return 'LOW'
}

// Handle different risk levels
const handleRiskLevel = async (req, res, behavior, identifier) => {
  const { riskLevel, score } = behavior

  switch (riskLevel) {
    case 'CRITICAL':
      // Block request immediately
      await logSecurityEvent({
        userId: req.user?.userId,
        eventType: 'CRITICAL_RISK_BLOCKED',
        severity: 'critical',
        description: 'Request blocked due to critical risk score',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { score, identifier }
      })
      
      return res.status(429).json({ 
        error: 'Access temporarily restricted due to suspicious activity' 
      })

    case 'HIGH':
      // Add significant delay and enhanced monitoring
      await new Promise(resolve => setTimeout(resolve, 2000)) // 2 second delay
      break

    case 'MEDIUM':
      // Add moderate delay
      await new Promise(resolve => setTimeout(resolve, 500)) // 500ms delay
      break

    case 'LOW':
      // No action needed
      break
  }
}

// Get user risk assessment
const getUserRiskAssessment = (identifier) => {
  const behavior = userBehaviorScores.get(identifier)
  
  if (!behavior) {
    return {
      riskLevel: 'LOW',
      score: 0,
      flags: []
    }
  }

  return {
    riskLevel: behavior.riskLevel,
    score: behavior.score,
    flags: behavior.flags.slice(-10), // Last 10 flags
    lastActivity: behavior.lastActivity
  }
}

// Flag specific suspicious activities
const flagSuspiciousActivity = (identifier, activityType, details = {}) => {
  if (!userBehaviorScores.has(identifier)) {
    userBehaviorScores.set(identifier, {
      score: 0,
      lastActivity: Date.now(),
      flags: [],
      riskLevel: 'LOW'
    })
  }

  const behavior = userBehaviorScores.get(identifier)
  behavior.flags.push({
    type: activityType,
    timestamp: Date.now(),
    details
  })
  
  behavior.score += BEHAVIOR_SCORES[activityType] || 10
  behavior.riskLevel = calculateRiskLevel(behavior.score)
  behavior.lastActivity = Date.now()
}

// Clean up old behavior data
setInterval(() => {
  const now = Date.now()
  const maxAge = 24 * 60 * 60 * 1000 // 24 hours

  for (const [identifier, behavior] of userBehaviorScores.entries()) {
    if (now - behavior.lastActivity > maxAge) {
      userBehaviorScores.delete(identifier)
    } else {
      // Clean old flags
      behavior.flags = behavior.flags.filter(
        flag => now - flag.timestamp < maxAge
      )
    }
  }
}, 60 * 60 * 1000) // Clean up every hour

module.exports = {
  analyzeBehavior,
  getUserRiskAssessment,
  flagSuspiciousActivity,
  BEHAVIOR_SCORES,
  RISK_THRESHOLDS
}