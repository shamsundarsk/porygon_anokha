const admin = require('firebase-admin')
const { prisma } = require('../database/connection')
const { logSecurityEvent } = require('../services/audit')

// Initialize Firebase Admin with fallback for development
let firebaseAdminInitialized = false
try {
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
        })
      })
    }
    firebaseAdminInitialized = true
    console.log('✅ Firebase Admin SDK initialized for sockets')
  } else {
    console.log('⚠️  Firebase Admin SDK not configured - using fallback authentication')
  }
} catch (error) {
  console.log('⚠️  Firebase Admin SDK initialization failed - using fallback:', error.message)
}

// Socket.IO authentication middleware with Firebase and fallback
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1]
    
    if (!token) {
      await logSecurityEvent({
        eventType: 'UNAUTHORIZED_SOCKET_ACCESS',
        severity: 'medium',
        description: 'Socket connection without token',
        ipAddress: socket.handshake.address,
        userAgent: socket.handshake.headers['user-agent']
      })
      return next(new Error('Authentication required'))
    }

    let firebaseUid = null
    let userEmail = null

    // Try Firebase Admin SDK verification first (if available)
    if (firebaseAdminInitialized) {
      try {
        const decodedToken = await admin.auth().verifyIdToken(token)
        firebaseUid = decodedToken.uid
        userEmail = decodedToken.email
      } catch (firebaseError) {
        console.log('Firebase socket verification failed:', firebaseError.message)
      }
    }

    // Fallback token parsing for development (not secure for production)
    if (!firebaseUid) {
      try {
        const tokenParts = token.split('.')
        if (tokenParts.length === 3) {
          const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString())
          firebaseUid = payload.user_id || payload.sub
          userEmail = payload.email
        }
      } catch (tokenError) {
        await logSecurityEvent({
          eventType: 'INVALID_TOKEN_FORMAT',
          severity: 'high',
          description: 'Invalid socket token format',
          ipAddress: socket.handshake.address,
          userAgent: socket.handshake.headers['user-agent']
        })
        return next(new Error('Invalid token format'))
      }
    }

    if (!firebaseUid) {
      return next(new Error('Token verification failed'))
    }

    // Try to get user from Supabase database (with fallback for demo mode)
    let user = null
    try {
      const { supabase } = require('../config/supabase')
      const { data, error } = await supabase
        .from('users')
        .select('id, email, name, user_type, is_active, is_verified, firebase_uid')
        .eq('firebase_uid', firebaseUid)
        .single()

      if (!error && data) {
        user = {
          id: data.id,
          email: data.email,
          name: data.name,
          userType: data.user_type,
          isActive: data.is_active,
          isVerified: data.is_verified,
          tokenVersion: 1
        }
      }
    } catch (supabaseError) {
      console.log('Supabase socket connection failed, using demo mode:', supabaseError.message)
    }

    // If no user found in database, create a demo user for development
    if (!user) {
      console.log('Creating demo socket user for Firebase UID:', firebaseUid)
      user = {
        id: firebaseUid,
        email: userEmail || 'demo@example.com',
        name: userEmail?.split('@')[0] || 'Demo User',
        userType: 'CUSTOMER',
        isActive: true,
        isVerified: true,
        tokenVersion: 1
      }
    }

    if (!user.isActive) {
      await logSecurityEvent({
        eventType: 'UNAUTHORIZED_SOCKET_ACCESS',
        severity: 'high',
        description: 'Socket connection with inactive user',
        ipAddress: socket.handshake.address,
        userAgent: socket.handshake.headers['user-agent'],
        metadata: { firebaseUid }
      })
      return next(new Error('Invalid or inactive user'))
    }

    // Attach user to socket with security context
    socket.user = user
    socket.userId = user.id
    socket.userType = user.userType
    socket.firebaseUid = firebaseUid
    socket.connectionTime = new Date()
    socket.ipAddress = socket.handshake.address
    socket.userAgent = socket.handshake.headers['user-agent']
    
    next()
  } catch (error) {
    await logSecurityEvent({
      eventType: 'SOCKET_AUTH_ERROR',
      severity: 'high',
      description: 'Socket authentication failed',
      ipAddress: socket.handshake.address,
      userAgent: socket.handshake.headers['user-agent'],
      metadata: { error: error.message }
    })
    
    next(new Error('Authentication failed'))
  }
}

// Enhanced role-based socket authorization with event-specific permissions
const requireSocketRole = (allowedRoles, eventName = null) => {
  return async (socket, next) => {
    if (!socket.user || !allowedRoles.includes(socket.userType)) {
      await logSecurityEvent({
        userId: socket.userId,
        eventType: 'UNAUTHORIZED_SOCKET_ACCESS',
        severity: 'high',
        description: `Unauthorized socket ${eventName ? 'event' : 'role'} access: ${socket.userType}`,
        ipAddress: socket.handshake.address,
        userAgent: socket.handshake.headers['user-agent'],
        metadata: { 
          requiredRoles: allowedRoles,
          eventName,
          userType: socket.userType
        }
      })
      return next(new Error('Insufficient permissions'))
    }
    next()
  }
}

// Event-specific authorization
const authorizeSocketEvent = (eventName) => {
  const eventPermissions = {
    'driver-location-update': ['DRIVER'],
    'track-delivery': ['CUSTOMER', 'DRIVER', 'BUSINESS', 'ADMIN'],
    'delivery-status-update': ['DRIVER', 'ADMIN'],
    'customer-message': ['CUSTOMER', 'BUSINESS'],
    'driver-message': ['DRIVER'],
    'admin-broadcast': ['ADMIN'],
    'payment-update': ['CUSTOMER', 'ADMIN']
  }

  return async (socket, data, next) => {
    const allowedRoles = eventPermissions[eventName] || []
    
    if (!allowedRoles.includes(socket.userType)) {
      await logSecurityEvent({
        userId: socket.userId,
        eventType: 'UNAUTHORIZED_SOCKET_EVENT',
        severity: 'high',
        description: `Unauthorized socket event: ${eventName}`,
        ipAddress: socket.handshake.address,
        userAgent: socket.handshake.headers['user-agent'],
        metadata: { 
          eventName,
          userType: socket.userType,
          allowedRoles
        }
      })
      return socket.emit('error', { message: 'Unauthorized event' })
    }

    // Additional context-specific checks
    if (eventName === 'track-delivery' && data.deliveryId) {
      const hasAccess = await verifyDeliveryAccess(socket.userId, socket.userType, data.deliveryId)
      if (!hasAccess) {
        await logSecurityEvent({
          userId: socket.userId,
          eventType: 'UNAUTHORIZED_DELIVERY_ACCESS',
          severity: 'high',
          description: 'Unauthorized delivery tracking attempt',
          ipAddress: socket.handshake.address,
          userAgent: socket.handshake.headers['user-agent'],
          metadata: { deliveryId: data.deliveryId }
        })
        return socket.emit('error', { message: 'Unauthorized delivery access' })
      }
    }

    next()
  }
}

// Verify delivery access for socket events - STRICT OWNERSHIP
const verifyDeliveryAccess = async (userId, userType, deliveryId) => {
  try {
    if (userType === 'ADMIN') return true

    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      select: { customerId: true, driverId: true }
    })

    if (!delivery) return false

    // STRICT: Only customer or assigned driver can access
    return delivery.customerId === userId || delivery.driverId === userId
  } catch (error) {
    console.error('Delivery access verification error:', error)
    return false
  }
}

// Enhanced rate limiting for socket events with per-user tracking
const socketRateLimiter = new Map()

const rateLimitSocket = (eventName, maxEvents = 10, windowMs = 60000) => {
  return async (socket, data, next) => {
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
      await logSecurityEvent({
        userId: socket.userId,
        eventType: 'SOCKET_RATE_LIMIT_EXCEEDED',
        severity: 'medium',
        description: `Socket rate limit exceeded for event: ${eventName}`,
        ipAddress: socket.handshake.address,
        userAgent: socket.handshake.headers['user-agent'],
        metadata: { eventName, count: limit.count, maxEvents }
      })
      return socket.emit('error', { message: 'Rate limit exceeded' })
    }
    
    limit.count++
    next()
  }
}

// Clean up rate limiter periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, limit] of socketRateLimiter.entries()) {
    if (now > limit.resetTime) {
      socketRateLimiter.delete(key)
    }
  }
}, 5 * 60 * 1000) // Clean up every 5 minutes

module.exports = {
  authenticateSocket,
  requireSocketRole,
  rateLimitSocket,
  authorizeSocketEvent,
  verifyDeliveryAccess
}