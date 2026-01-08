const crypto = require('crypto')
const { prisma } = require('../database/connection')
const { logSecurityEvent } = require('../services/audit')

// Generate device fingerprint
const generateDeviceFingerprint = (req) => {
  const components = [
    req.get('User-Agent') || '',
    req.get('Accept-Language') || '',
    req.get('Accept-Encoding') || '',
    req.get('Accept') || '',
    req.connection.remoteAddress || req.ip,
    req.get('X-Forwarded-For') || ''
  ]

  const fingerprint = components.join('|')
  return crypto.createHash('sha256').update(fingerprint).digest('hex')
}

// Device binding middleware
const bindDevice = async (req, res, next) => {
  try {
    if (!req.user) {
      return next()
    }

    const userId = req.user.userId
    const ipAddress = req.ip
    const userAgent = req.get('User-Agent')
    const deviceFingerprint = generateDeviceFingerprint(req)

    // Check if this is a new device/IP combination
    const existingBinding = await prisma.deviceBinding.findFirst({
      where: {
        userId,
        OR: [
          { deviceFingerprint },
          { ipAddress }
        ]
      }
    })

    if (!existingBinding) {
      // New device detected
      await logSecurityEvent({
        userId,
        eventType: 'NEW_DEVICE_DETECTED',
        severity: 'medium',
        description: 'User accessing from new device/location',
        ipAddress,
        userAgent,
        metadata: {
          deviceFingerprint,
          isNewDevice: true
        }
      })

      // Create new device binding
      await prisma.deviceBinding.create({
        data: {
          userId,
          deviceFingerprint,
          ipAddress,
          userAgent,
          firstSeen: new Date(),
          lastSeen: new Date(),
          isVerified: false, // Require verification for new devices
          trustScore: 0
        }
      })

      // For high-security operations, require additional verification
      if (isHighSecurityEndpoint(req.path)) {
        return res.status(403).json({
          error: 'New device detected. Additional verification required.',
          requiresVerification: true,
          deviceFingerprint
        })
      }
    } else {
      // Update existing binding
      await prisma.deviceBinding.update({
        where: { id: existingBinding.id },
        data: {
          lastSeen: new Date(),
          accessCount: { increment: 1 },
          trustScore: Math.min(100, existingBinding.trustScore + 1)
        }
      })

      // Check for suspicious changes
      if (existingBinding.userAgent !== userAgent) {
        await logSecurityEvent({
          userId,
          eventType: 'DEVICE_FINGERPRINT_CHANGE',
          severity: 'medium',
          description: 'Device fingerprint changed',
          ipAddress,
          userAgent,
          metadata: {
            oldUserAgent: existingBinding.userAgent,
            newUserAgent: userAgent,
            deviceFingerprint
          }
        })
      }
    }

    // Attach device info to request
    req.deviceInfo = {
      fingerprint: deviceFingerprint,
      isNewDevice: !existingBinding,
      trustScore: existingBinding?.trustScore || 0,
      isVerified: existingBinding?.isVerified || false
    }

    next()
  } catch (error) {
    console.error('Device binding error:', error)
    next()
  }
}

// Check if endpoint requires high security
const isHighSecurityEndpoint = (path) => {
  const highSecurityPaths = [
    '/api/payments',
    '/api/admin',
    '/api/users/delete',
    '/api/auth/change-password',
    '/api/deliveries/cancel'
  ]

  return highSecurityPaths.some(secPath => path.startsWith(secPath))
}

// IP reputation checking
const checkIPReputation = async (req, res, next) => {
  try {
    const ipAddress = req.ip

    // Check internal IP reputation
    const ipReputation = await prisma.ipReputation.findUnique({
      where: { ipAddress }
    })

    if (ipReputation) {
      // Update access count
      await prisma.ipReputation.update({
        where: { ipAddress },
        data: {
          accessCount: { increment: 1 },
          lastSeen: new Date()
        }
      })

      // Check if IP is blocked
      if (ipReputation.isBlocked) {
        await logSecurityEvent({
          eventType: 'BLOCKED_IP_ACCESS',
          severity: 'high',
          description: 'Blocked IP attempted access',
          ipAddress,
          userAgent: req.get('User-Agent'),
          metadata: {
            blockReason: ipReputation.blockReason,
            blockedAt: ipReputation.blockedAt
          }
        })

        return res.status(403).json({ error: 'Access denied' })
      }

      // Check reputation score
      if (ipReputation.reputationScore < -50) {
        await logSecurityEvent({
          eventType: 'LOW_REPUTATION_IP',
          severity: 'medium',
          description: 'Low reputation IP access',
          ipAddress,
          userAgent: req.get('User-Agent'),
          metadata: {
            reputationScore: ipReputation.reputationScore
          }
        })

        // Add delay for low reputation IPs
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      req.ipReputation = ipReputation
    } else {
      // Create new IP reputation entry
      await prisma.ipReputation.create({
        data: {
          ipAddress,
          reputationScore: 0,
          accessCount: 1,
          firstSeen: new Date(),
          lastSeen: new Date(),
          isBlocked: false
        }
      })

      req.ipReputation = { reputationScore: 0, isBlocked: false }
    }

    next()
  } catch (error) {
    console.error('IP reputation check error:', error)
    next()
  }
}

// Update IP reputation based on behavior
const updateIPReputation = async (ipAddress, scoreChange, reason) => {
  try {
    await prisma.ipReputation.upsert({
      where: { ipAddress },
      update: {
        reputationScore: { increment: scoreChange },
        lastIncident: new Date(),
        incidentCount: { increment: scoreChange < 0 ? 1 : 0 }
      },
      create: {
        ipAddress,
        reputationScore: scoreChange,
        accessCount: 1,
        firstSeen: new Date(),
        lastSeen: new Date(),
        lastIncident: scoreChange < 0 ? new Date() : null,
        incidentCount: scoreChange < 0 ? 1 : 0,
        isBlocked: false
      }
    })

    // Auto-block IPs with very low reputation
    if (scoreChange < 0) {
      const reputation = await prisma.ipReputation.findUnique({
        where: { ipAddress }
      })

      if (reputation && reputation.reputationScore < -100) {
        await prisma.ipReputation.update({
          where: { ipAddress },
          data: {
            isBlocked: true,
            blockReason: `Auto-blocked: ${reason}`,
            blockedAt: new Date()
          }
        })

        await logSecurityEvent({
          eventType: 'IP_AUTO_BLOCKED',
          severity: 'high',
          description: 'IP automatically blocked due to low reputation',
          ipAddress,
          metadata: {
            reputationScore: reputation.reputationScore,
            reason
          }
        })
      }
    }
  } catch (error) {
    console.error('IP reputation update error:', error)
  }
}

// Anomaly counter system
const anomalyCounters = new Map()

const trackAnomaly = async (identifier, anomalyType, severity = 'medium') => {
  const key = `${identifier}:${anomalyType}`
  const now = Date.now()
  const windowMs = 60 * 60 * 1000 // 1 hour window

  if (!anomalyCounters.has(key)) {
    anomalyCounters.set(key, {
      count: 1,
      firstOccurrence: now,
      lastOccurrence: now,
      severity
    })
  } else {
    const counter = anomalyCounters.get(key)
    counter.count++
    counter.lastOccurrence = now
    
    // Escalate severity if anomalies are frequent
    if (counter.count > 5) {
      counter.severity = 'high'
    }
    if (counter.count > 10) {
      counter.severity = 'critical'
    }
  }

  const counter = anomalyCounters.get(key)

  // Log significant anomaly patterns
  if (counter.count === 5 || counter.count === 10 || counter.count % 20 === 0) {
    await logSecurityEvent({
      eventType: 'ANOMALY_PATTERN',
      severity: counter.severity,
      description: `Repeated anomaly detected: ${anomalyType}`,
      metadata: {
        identifier,
        anomalyType,
        count: counter.count,
        timespan: now - counter.firstOccurrence,
        frequency: counter.count / ((now - counter.firstOccurrence) / (60 * 1000)) // per minute
      }
    })
  }

  return counter
}

// Get anomaly summary for identifier
const getAnomalySummary = (identifier) => {
  const anomalies = {}
  
  for (const [key, counter] of anomalyCounters.entries()) {
    if (key.startsWith(identifier + ':')) {
      const anomalyType = key.split(':')[1]
      anomalies[anomalyType] = {
        count: counter.count,
        severity: counter.severity,
        firstOccurrence: counter.firstOccurrence,
        lastOccurrence: counter.lastOccurrence
      }
    }
  }

  return anomalies
}

// Clean up old anomaly counters
setInterval(() => {
  const now = Date.now()
  const maxAge = 24 * 60 * 60 * 1000 // 24 hours

  for (const [key, counter] of anomalyCounters.entries()) {
    if (now - counter.lastOccurrence > maxAge) {
      anomalyCounters.delete(key)
    }
  }
}, 60 * 60 * 1000) // Clean up every hour

module.exports = {
  bindDevice,
  checkIPReputation,
  updateIPReputation,
  trackAnomaly,
  getAnomalySummary,
  generateDeviceFingerprint
}