const jwt = require('jsonwebtoken')
const { prisma } = require('../database/connection')
const { logSecurityEvent } = require('../services/audit')

// Socket.IO authentication middleware
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1]
    
    if (!token) {
      await logSecurityEvent({
        eventType: 'UNAUTHORIZED_ACCESS',
        severity: 'medium',
        description: 'Socket connection without token',
        ipAddress: socket.handshake.address,
        userAgent: socket.handshake.headers['user-agent']
      })
      return next(new Error('Authentication required'))
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: 'fairload-api',
      audience: 'fairload-client'
    })
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        userType: true,
        isActive: true,
        isVerified: true,
        tokenVersion: true
      }
    })

    if (!user || !user.isActive) {
      await logSecurityEvent({
        eventType: 'UNAUTHORIZED_ACCESS',
        severity: 'medium',
        description: 'Socket connection with invalid user',
        ipAddress: socket.handshake.address,
        userAgent: socket.handshake.headers['user-agent'],
        metadata: { userId: decoded.userId }
      })
      return next(new Error('Invalid user'))
    }

    // Check token version
    if (decoded.tokenVersion !== user.tokenVersion) {
      await logSecurityEvent({
        eventType: 'TOKEN_MANIPULATION',
        severity: 'high',
        description: 'Socket connection with revoked token',
        ipAddress: socket.handshake.address,
        userAgent: socket.handshake.headers['user-agent'],
        metadata: { userId: user.id }
      })
      return next(new Error('Token revoked'))
    }

    // Attach user to socket
    socket.user = user
    socket.userId = user.id
    socket.userType = user.userType
    
    next()
  } catch (error) {
    await logSecurityEvent({
      eventType: 'TOKEN_MANIPULATION',
      severity: 'high',
      description: 'Socket authentication failed',
      ipAddress: socket.handshake.address,
      userAgent: socket.handshake.headers['user-agent'],
      metadata: { error: error.message }
    })
    
    next(new Error('Authentication failed'))
  }
}

// Role-based socket authorization
const requireSocketRole = (allowedRoles) => {
  return (socket, next) => {
    if (!socket.user || !allowedRoles.includes(socket.userType)) {
      logSecurityEvent({
        userId: socket.userId,
        eventType: 'UNAUTHORIZED_ACCESS',
        severity: 'high',
        description: `Unauthorized socket role access: ${socket.userType}`,
        ipAddress: socket.handshake.address,
        userAgent: socket.handshake.headers['user-agent'],
        metadata: { requiredRoles: allowedRoles }
      })
      return next(new Error('Insufficient permissions'))
    }
    next()
  }
}

// Rate limiting for socket events
const socketRateLimiter = new Map()

const rateLimitSocket = (eventName, maxEvents = 10, windowMs = 60000) => {
  return (socket, next) => {
    const key = `${socket.userId}:${eventName}`
    const now = Date.now()
    
    if (!socketRateLimiter.has(key)) {
      socketRateLimiter.set(key, { count: 1, resetTime: now + windowMs })
      return next()
    }
    
    const limit = socketRateLimiter.get(key)
    
    if (now > limit.resetTime) {
      // Reset window
      limit.count = 1
      limit.resetTime = now + windowMs
      return next()
    }
    
    if (limit.count >= maxEvents) {
      logSecurityEvent({
        userId: socket.userId,
        eventType: 'RATE_LIMIT_EXCEEDED',
        severity: 'medium',
        description: `Socket rate limit exceeded for event: ${eventName}`,
        ipAddress: socket.handshake.address,
        userAgent: socket.handshake.headers['user-agent'],
        metadata: { eventName, count: limit.count, maxEvents }
      })
      return next(new Error('Rate limit exceeded'))
    }
    
    limit.count++
    next()
  }
}

module.exports = {
  authenticateSocket,
  requireSocketRole,
  rateLimitSocket
}