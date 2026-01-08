const { prisma } = require('../database/connection')
const winston = require('winston')

// Configure Winston logger
const logger = winston.createLogger({
  level: process.env.AUDIT_LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'pakkadrop-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/audit.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
})

// Log audit events with enhanced detail
const logAuditEvent = async ({
  userId,
  deliveryId,
  action,
  resource,
  resourceId,
  oldValues,
  newValues,
  ipAddress,
  userAgent,
  sessionId,
  requestId
}) => {
  try {
    // Enhanced audit data
    const auditData = {
      userId,
      deliveryId,
      action,
      resource,
      resourceId,
      oldValues: oldValues ? JSON.stringify(oldValues) : null,
      newValues: newValues ? JSON.stringify(newValues) : null,
      ipAddress,
      userAgent,
      sessionId,
      requestId,
      timestamp: new Date(),
      // Add request fingerprint for correlation
      fingerprint: generateRequestFingerprint(ipAddress, userAgent)
    }

    // Log to database
    await prisma.auditLog.create({ data: auditData })

    // Log to Winston with structured data
    logger.info('Audit Event', {
      ...auditData,
      timestamp: new Date().toISOString()
    })

    // Real-time audit monitoring for critical actions
    if (['DELETE', 'ADMIN_ACTION', 'PAYMENT_COMPLETE'].includes(action)) {
      await alertCriticalAuditEvent(auditData)
    }
  } catch (error) {
    logger.error('Failed to log audit event', { error: error.message })
  }
}

// Generate request fingerprint for correlation
const generateRequestFingerprint = (ipAddress, userAgent) => {
  const crypto = require('crypto')
  const data = `${ipAddress}:${userAgent}:${Date.now()}`
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16)
}

// Alert on critical audit events
const alertCriticalAuditEvent = async (auditData) => {
  try {
    logger.warn('🔍 CRITICAL AUDIT EVENT', {
      action: auditData.action,
      resource: auditData.resource,
      userId: auditData.userId,
      ipAddress: auditData.ipAddress,
      timestamp: auditData.timestamp
    })
    
    // In production, send to monitoring systems
    console.warn('🔍 CRITICAL AUDIT:', `${auditData.action} on ${auditData.resource} by user ${auditData.userId}`)
  } catch (error) {
    logger.error('Failed to send critical audit alert', { error: error.message })
  }
}

// Log security events
const logSecurityEvent = async ({
  userId,
  eventType,
  severity = 'medium',
  description,
  ipAddress,
  userAgent,
  metadata
}) => {
  try {
    // Log to database
    const securityEvent = await prisma.securityEvent.create({
      data: {
        userId,
        eventType,
        severity,
        description,
        ipAddress,
        userAgent,
        metadata: metadata ? JSON.stringify(metadata) : null
      }
    })

    // Log to Winston with appropriate level
    const logLevel = severity === 'critical' ? 'error' : 
                    severity === 'high' ? 'warn' : 'info'
    
    logger[logLevel]('Security Event', {
      id: securityEvent.id,
      userId,
      eventType,
      severity,
      description,
      ipAddress,
      userAgent,
      metadata,
      timestamp: new Date().toISOString()
    })

    // Alert on critical events
    if (severity === 'critical') {
      await alertCriticalEvent(securityEvent)
    }

    return securityEvent
  } catch (error) {
    logger.error('Failed to log security event', { error: error.message })
  }
}

// Alert on critical security events
const alertCriticalEvent = async (event) => {
  try {
    // In production, integrate with alerting systems like:
    // - Slack/Discord webhooks
    // - Email alerts
    // - SMS alerts
    // - PagerDuty
    
    logger.error('🚨 CRITICAL SECURITY EVENT', {
      id: event.id,
      eventType: event.eventType,
      description: event.description,
      ipAddress: event.ipAddress,
      timestamp: event.timestamp
    })
    
    // For now, just log. In production, implement actual alerting
    console.error('🚨 CRITICAL SECURITY ALERT:', event.description)
  } catch (error) {
    logger.error('Failed to send critical alert', { error: error.message })
  }
}

// Anomaly detection
const detectAnomalies = async (userId) => {
  try {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    
    // Check for suspicious patterns
    const recentEvents = await prisma.securityEvent.findMany({
      where: {
        userId,
        timestamp: { gte: oneHourAgo }
      },
      orderBy: { timestamp: 'desc' }
    })
    
    const anomalies = []
    
    // Multiple failed logins
    const failedLogins = recentEvents.filter(e => e.eventType === 'FAILED_LOGIN')
    if (failedLogins.length >= 5) {
      anomalies.push({
        type: 'MULTIPLE_FAILED_LOGINS',
        count: failedLogins.length,
        severity: 'high'
      })
    }
    
    // Multiple IP addresses
    const uniqueIPs = new Set(recentEvents.map(e => e.ipAddress))
    if (uniqueIPs.size >= 3) {
      anomalies.push({
        type: 'MULTIPLE_IP_ADDRESSES',
        count: uniqueIPs.size,
        severity: 'medium'
      })
    }
    
    // Rapid API calls
    if (recentEvents.length >= 100) {
      anomalies.push({
        type: 'RAPID_API_CALLS',
        count: recentEvents.length,
        severity: 'high'
      })
    }
    
    // Log anomalies
    for (const anomaly of anomalies) {
      await logSecurityEvent({
        userId,
        eventType: 'SUSPICIOUS_ACTIVITY',
        severity: anomaly.severity,
        description: `Anomaly detected: ${anomaly.type}`,
        metadata: anomaly
      })
    }
    
    return anomalies
  } catch (error) {
    logger.error('Anomaly detection failed', { error: error.message })
    return []
  }
}

// Tamper detection for deliveries
const detectDeliveryTamper = async (deliveryId, newData, oldData) => {
  try {
    const suspiciousChanges = []
    
    // Check for fare manipulation
    if (oldData.totalFare && newData.totalFare !== oldData.totalFare) {
      const difference = Math.abs(newData.totalFare - oldData.totalFare)
      if (difference > oldData.totalFare * 0.1) { // More than 10% change
        suspiciousChanges.push({
          field: 'totalFare',
          oldValue: oldData.totalFare,
          newValue: newData.totalFare,
          difference
        })
      }
    }
    
    // Check for status manipulation
    const validStatusTransitions = {
      'PENDING': ['ACCEPTED', 'CANCELLED'],
      'ACCEPTED': ['PICKED_UP', 'CANCELLED'],
      'PICKED_UP': ['IN_TRANSIT'],
      'IN_TRANSIT': ['DELIVERED'],
      'DELIVERED': [], // Final state
      'CANCELLED': [] // Final state
    }
    
    if (oldData.status && newData.status !== oldData.status) {
      const validTransitions = validStatusTransitions[oldData.status] || []
      if (!validTransitions.includes(newData.status)) {
        suspiciousChanges.push({
          field: 'status',
          oldValue: oldData.status,
          newValue: newData.status,
          reason: 'Invalid status transition'
        })
      }
    }
    
    // Log suspicious changes
    if (suspiciousChanges.length > 0) {
      await logSecurityEvent({
        eventType: 'SUSPICIOUS_ACTIVITY',
        severity: 'high',
        description: 'Delivery data tampering detected',
        metadata: {
          deliveryId,
          suspiciousChanges
        }
      })
    }
    
    return suspiciousChanges
  } catch (error) {
    logger.error('Tamper detection failed', { error: error.message })
    return []
  }
}

// Generate tamper-proof hash
const generateTamperHash = (data) => {
  const crypto = require('crypto')
  const dataString = JSON.stringify(data, Object.keys(data).sort())
  return crypto.createHash('sha256').update(dataString).digest('hex')
}

// Verify tamper-proof hash
const verifyTamperHash = (data, expectedHash) => {
  const actualHash = generateTamperHash(data)
  return actualHash === expectedHash
}

module.exports = {
  logAuditEvent,
  logSecurityEvent,
  detectAnomalies,
  detectDeliveryTamper,
  generateTamperHash,
  verifyTamperHash,
  logger
}