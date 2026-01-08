const { logAuditEvent, logSecurityEvent } = require('../services/audit')
const { prisma } = require('../database/connection')

// Admin action logging middleware
const logAdminAction = async (req, res, next) => {
  // Only log for admin users
  if (!req.user || req.user.userType !== 'ADMIN') {
    return next()
  }

  const originalJson = res.json
  const startTime = Date.now()

  // Capture request details
  const actionDetails = {
    userId: req.user.userId,
    action: `${req.method} ${req.path}`,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    requestBody: sanitizeRequestBody(req.body),
    query: req.query,
    params: req.params,
    timestamp: new Date(),
    sessionId: req.sessionID || 'unknown'
  }

  // Override res.json to capture response
  res.json = function(data) {
    const endTime = Date.now()
    const duration = endTime - startTime

    // Log the admin action
    logAuditEvent({
      userId: req.user.userId,
      action: 'ADMIN_ACTION',
      resource: 'admin_endpoint',
      resourceId: req.params.id || null,
      oldValues: null,
      newValues: {
        endpoint: req.path,
        method: req.method,
        statusCode: res.statusCode,
        duration,
        requestBody: actionDetails.requestBody,
        responseSize: JSON.stringify(data).length
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      sessionId: actionDetails.sessionId
    })

    // Log critical admin actions separately
    if (isCriticalAdminAction(req)) {
      logSecurityEvent({
        userId: req.user.userId,
        eventType: 'CRITICAL_ADMIN_ACTION',
        severity: 'high',
        description: `Critical admin action: ${req.method} ${req.path}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: {
          ...actionDetails,
          statusCode: res.statusCode,
          duration,
          responseSize: JSON.stringify(data).length
        }
      })
    }

    // Store detailed admin log
    storeAdminActionLog({
      ...actionDetails,
      statusCode: res.statusCode,
      duration,
      responseData: sanitizeResponseData(data),
      success: res.statusCode < 400
    })

    return originalJson.call(this, data)
  }

  next()
}

// Determine if action is critical
const isCriticalAdminAction = (req) => {
  const criticalPatterns = [
    /\/api\/admin\/users\/.*\/delete/,
    /\/api\/admin\/users\/.*\/ban/,
    /\/api\/admin\/system/,
    /\/api\/admin\/config/,
    /\/api\/admin\/security/,
    /\/api\/admin\/payments\/.*\/refund/,
    /\/api\/admin\/deliveries\/.*\/cancel/
  ]

  const criticalMethods = ['DELETE', 'PUT', 'PATCH']
  
  return criticalPatterns.some(pattern => pattern.test(req.path)) ||
         (criticalMethods.includes(req.method) && req.path.includes('/admin/'))
}

// Store detailed admin action log
const storeAdminActionLog = async (actionData) => {
  try {
    await prisma.adminActionLog.create({
      data: {
        userId: actionData.userId,
        action: actionData.action,
        endpoint: actionData.action.split(' ')[1],
        method: actionData.action.split(' ')[0],
        ipAddress: actionData.ipAddress,
        userAgent: actionData.userAgent,
        requestBody: JSON.stringify(actionData.requestBody),
        query: JSON.stringify(actionData.query),
        params: JSON.stringify(actionData.params),
        statusCode: actionData.statusCode,
        duration: actionData.duration,
        responseData: JSON.stringify(actionData.responseData),
        success: actionData.success,
        sessionId: actionData.sessionId,
        timestamp: actionData.timestamp
      }
    })
  } catch (error) {
    console.error('Failed to store admin action log:', error)
  }
}

// Sanitize request body for logging
const sanitizeRequestBody = (body) => {
  if (!body || typeof body !== 'object') return body

  const sanitized = { ...body }
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'pin', 'otp']

  Object.keys(sanitized).forEach(key => {
    const lowerKey = key.toLowerCase()
    if (sensitiveFields.some(field => lowerKey.includes(field))) {
      sanitized[key] = '***REDACTED***'
    }
  })

  return sanitized
}

// Sanitize response data for logging
const sanitizeResponseData = (data) => {
  if (!data || typeof data !== 'object') return data

  // For large responses, only log metadata
  const dataString = JSON.stringify(data)
  if (dataString.length > 10000) {
    return {
      _metadata: {
        type: Array.isArray(data) ? 'array' : 'object',
        size: dataString.length,
        keys: Array.isArray(data) ? data.length : Object.keys(data).length
      }
    }
  }

  return sanitizeRequestBody(data)
}

// Admin session monitoring
const monitorAdminSession = async (req, res, next) => {
  if (!req.user || req.user.userType !== 'ADMIN') {
    return next()
  }

  const userId = req.user.userId
  const sessionKey = `admin_session:${userId}`

  try {
    // Check for concurrent admin sessions
    const activeSessions = await prisma.adminSession.findMany({
      where: {
        userId,
        isActive: true,
        expiresAt: { gt: new Date() }
      }
    })

    // Log if multiple active sessions
    if (activeSessions.length > 1) {
      await logSecurityEvent({
        userId,
        eventType: 'MULTIPLE_ADMIN_SESSIONS',
        severity: 'medium',
        description: 'Multiple active admin sessions detected',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: {
          activeSessionCount: activeSessions.length,
          sessionIds: activeSessions.map(s => s.id)
        }
      })
    }

    // Update current session activity
    await prisma.adminSession.upsert({
      where: { sessionId: req.sessionID || 'unknown' },
      update: {
        lastActivity: new Date(),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      create: {
        sessionId: req.sessionID || 'unknown',
        userId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        isActive: true,
        lastActivity: new Date(),
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000) // 8 hours
      }
    })

    next()
  } catch (error) {
    console.error('Admin session monitoring error:', error)
    next()
  }
}

// Force logout admin user
const forceAdminLogout = async (userId, reason = 'Security measure') => {
  try {
    // Deactivate all admin sessions
    await prisma.adminSession.updateMany({
      where: { userId, isActive: true },
      data: { 
        isActive: false,
        logoutReason: reason,
        logoutAt: new Date()
      }
    })

    // Increment token version to invalidate JWTs
    await prisma.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } }
    })

    await logSecurityEvent({
      userId,
      eventType: 'FORCED_ADMIN_LOGOUT',
      severity: 'high',
      description: `Admin user forcibly logged out: ${reason}`,
      metadata: { reason }
    })

    return true
  } catch (error) {
    console.error('Force admin logout error:', error)
    return false
  }
}

// Get admin activity summary
const getAdminActivitySummary = async (userId, timeframe = '24h') => {
  try {
    const timeframMs = timeframe === '24h' ? 24 * 60 * 60 * 1000 : 
                      timeframe === '7d' ? 7 * 24 * 60 * 60 * 1000 :
                      24 * 60 * 60 * 1000

    const since = new Date(Date.now() - timeframMs)

    const [actions, criticalActions, sessions] = await Promise.all([
      prisma.adminActionLog.count({
        where: { userId, timestamp: { gte: since } }
      }),
      prisma.securityEvent.count({
        where: { 
          userId, 
          eventType: 'CRITICAL_ADMIN_ACTION',
          timestamp: { gte: since }
        }
      }),
      prisma.adminSession.findMany({
        where: { 
          userId, 
          lastActivity: { gte: since }
        },
        select: { ipAddress: true, userAgent: true, lastActivity: true }
      })
    ])

    return {
      totalActions: actions,
      criticalActions,
      uniqueIPs: new Set(sessions.map(s => s.ipAddress)).size,
      uniqueUserAgents: new Set(sessions.map(s => s.userAgent)).size,
      lastActivity: sessions.length > 0 ? 
        Math.max(...sessions.map(s => s.lastActivity.getTime())) : null
    }
  } catch (error) {
    console.error('Admin activity summary error:', error)
    return null
  }
}

module.exports = {
  logAdminAction,
  monitorAdminSession,
  forceAdminLogout,
  getAdminActivitySummary
}