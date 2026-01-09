require('dotenv').config()
const express = require('express')
const { createServer } = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const morgan = require('morgan')

// Import security middleware
const {
  securityHeaders,
  globalRateLimit,
  speedLimiter,
  sanitizeRequest,
  corsOptions,
  hpp
} = require('./middleware/security')

// Import environment validation
const { validateEnvironment } = require('./config/environment')

// Import database connection
const { prisma } = require('./database/connection')

// Import socket authentication
const { authenticateSocket, rateLimitSocket } = require('./middleware/socketAuth')

// Import audit logging
const { logAuditEvent, logSecurityEvent, logger } = require('./services/audit')

// Validate environment variables on startup
const env = validateEnvironment()

const app = express()
const server = createServer(app)

// Socket.IO with security
const io = new Server(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling'],
  allowEIO3: false, // Disable Engine.IO v3 for security
  pingTimeout: 60000,
  pingInterval: 25000
})

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1)

// Security middleware (order matters!)
app.use(securityHeaders)
app.use(hpp) // HTTP Parameter Pollution protection
app.use(sanitizeRequest)
app.use(globalRateLimit)
app.use(speedLimiter)

// CORS
app.use(cors(corsOptions))

// Request logging
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}))

// Body parsing with size limits
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    // Store raw body for webhook verification
    req.rawBody = buf
  }
}))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '2.0.0'
  })
})

// Import routes
const authRoutes = require('./routes/auth')
const userRoutes = require('./routes/users')
const deliveryRoutes = require('./routes/deliveries')
const driverRoutes = require('./routes/drivers')
const adminRoutes = require('./routes/admin')
const customerRoutes = require('./routes/customers')
const mapRoutes = require('./routes/maps')
const paymentRoutes = require('./routes/payments')
const securityRoutes = require('./routes/security')

// Import additional security middleware
const { detectAbuse } = require('./middleware/abuseDetection')
const { analyzeBehavior } = require('./middleware/behaviorAnalysis')
const { validateSecurity } = require('./middleware/securityValidation')

// Apply security middleware globally
app.use(detectAbuse)
app.use(analyzeBehavior)
app.use(validateSecurity)

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/deliveries', deliveryRoutes)
app.use('/api/drivers', driverRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/customers', customerRoutes)
app.use('/api/maps', mapRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/security', securityRoutes)

// Honeypot routes (add before other routes)
const honeypotRoutes = [
  '/admin', '/wp-admin', '/phpmyadmin', '/.env', '/config',
  '/administrator', '/admin.php', '/wp-login.php', '/login.php',
  '/xmlrpc.php', '/wp-config.php', '/database.sql', '/backup.sql',
  '/api/admin', '/api/config', '/api/debug', '/debug',
  '/.git/config', '/server-status', '/server-info'
]

honeypotRoutes.forEach(route => {
  app.get(route, async (req, res) => {
    await logSecurityEvent({
      eventType: 'HONEYPOT_ACCESS',
      severity: 'high',
      description: `Honeypot endpoint accessed: ${req.method} ${req.path}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      metadata: { 
        endpoint: req.path,
        method: req.method,
        headers: req.headers,
        query: req.query
      }
    })
    
    // Store honeypot access in database
    try {
      await prisma.honeypotLog.create({
        data: {
          endpoint: req.path,
          method: req.method,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          headers: JSON.stringify(req.headers),
          query: JSON.stringify(req.query)
        }
      })
    } catch (error) {
      console.error('Honeypot logging error:', error)
    }
    
    // Return realistic-looking error to not reveal it's a honeypot
    res.status(404).json({ error: 'Not found' })
  })

  // Also handle POST requests to honeypots
  app.post(route, async (req, res) => {
    await logSecurityEvent({
      eventType: 'HONEYPOT_ACCESS',
      severity: 'critical',
      description: `Honeypot POST attempt: ${req.method} ${req.path}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      metadata: { 
        endpoint: req.path,
        method: req.method,
        headers: req.headers,
        body: req.body
      }
    })
    
    res.status(404).json({ error: 'Not found' })
  })
})

// Socket.IO with authentication and security
io.use(authenticateSocket)

// Store active connections securely with user binding
const activeDrivers = new Map()
const activeDeliveries = new Map()
const userSockets = new Map()

io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.userId} (${socket.userType})`)
  
  // Store user socket mapping with security context
  userSockets.set(socket.userId, {
    socketId: socket.id,
    userType: socket.userType,
    connectedAt: socket.connectionTime,
    ipAddress: socket.ipAddress
  })
  
  // Log connection with full context
  logAuditEvent({
    userId: socket.userId,
    action: 'CREATE',
    resource: 'socket_connection',
    ipAddress: socket.ipAddress,
    userAgent: socket.userAgent,
    metadata: { userType: socket.userType }
  })

  // DRIVER LOCATION UPDATES - Strict role and assignment verification
  socket.on('driver-location-update', rateLimitSocket('driver-location-update', 60, 60000), async (data) => {
    // STRICT: Only drivers can send location updates
    if (socket.userType !== 'DRIVER') {
      await logSecurityEvent({
        userId: socket.userId,
        eventType: 'UNAUTHORIZED_SOCKET_EVENT',
        severity: 'high',
        description: 'Non-driver attempted location update',
        ipAddress: socket.ipAddress,
        userAgent: socket.userAgent,
        metadata: { userType: socket.userType }
      })
      return socket.emit('error', { message: 'Unauthorized: Only drivers can update location' })
    }

    const { lat, lng, heading, deliveryId } = data
    
    // Validate coordinates strictly
    if (!lat || !lng || typeof lat !== 'number' || typeof lng !== 'number') {
      return socket.emit('error', { message: 'Invalid coordinates format' })
    }
    
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      await logSecurityEvent({
        userId: socket.userId,
        eventType: 'INVALID_LOCATION_DATA',
        severity: 'medium',
        description: 'Driver sent invalid coordinates',
        ipAddress: socket.ipAddress,
        userAgent: socket.userAgent,
        metadata: { lat, lng }
      })
      return socket.emit('error', { message: 'Invalid coordinates range' })
    }

    // If deliveryId provided, verify driver is assigned to this delivery
    if (deliveryId) {
      const delivery = await prisma.delivery.findUnique({
        where: { id: deliveryId },
        select: { driverId: true, status: true }
      })

      if (!delivery || delivery.driverId !== socket.userId) {
        await logSecurityEvent({
          userId: socket.userId,
          eventType: 'UNAUTHORIZED_DELIVERY_UPDATE',
          severity: 'high',
          description: 'Driver attempted location update for unassigned delivery',
          ipAddress: socket.ipAddress,
          userAgent: socket.userAgent,
          metadata: { deliveryId, assignedDriver: delivery?.driverId }
        })
        return socket.emit('error', { message: 'Not assigned to this delivery' })
      }

      // Only allow location updates for active deliveries
      const activeStatuses = ['ACCEPTED', 'PICKED_UP', 'IN_TRANSIT']
      if (!activeStatuses.includes(delivery.status)) {
        return socket.emit('error', { message: 'Cannot update location for inactive delivery' })
      }
    }

    // Store driver location securely
    activeDrivers.set(socket.userId, { 
      lat, 
      lng, 
      heading, 
      socketId: socket.id, 
      lastUpdate: Date.now(),
      deliveryId,
      verified: true
    })
    
    // Update database
    await prisma.user.update({
      where: { id: socket.userId },
      data: { 
        currentLat: lat, 
        currentLng: lng,
        lastSeen: new Date()
      }
    })

    // Only broadcast to customers tracking this specific delivery
    if (deliveryId) {
      socket.to(`delivery-${deliveryId}`).emit('driver-location', { 
        driverId: socket.userId, 
        lat, 
        lng, 
        heading,
        timestamp: new Date()
      })
    }
  })

  // JOIN DELIVERY TRACKING - Strict ownership verification
  socket.on('track-delivery', rateLimitSocket('track-delivery', 10, 60000), async (deliveryId) => {
    try {
      if (!deliveryId || typeof deliveryId !== 'string') {
        return socket.emit('error', { message: 'Invalid delivery ID' })
      }

      // Verify user can track this delivery - STRICT ownership check
      const delivery = await prisma.delivery.findUnique({
        where: { id: deliveryId },
        select: { 
          id: true,
          customerId: true, 
          driverId: true,
          status: true
        }
      })

      if (!delivery) {
        return socket.emit('error', { message: 'Delivery not found' })
      }

      // STRICT: Only customer, assigned driver, or admin can track
      const canTrack = delivery.customerId === socket.userId || 
                      delivery.driverId === socket.userId || 
                      socket.userType === 'ADMIN'

      if (!canTrack) {
        await logSecurityEvent({
          userId: socket.userId,
          eventType: 'UNAUTHORIZED_DELIVERY_TRACKING',
          severity: 'high',
          description: 'Unauthorized delivery tracking attempt',
          ipAddress: socket.ipAddress,
          userAgent: socket.userAgent,
          metadata: { 
            deliveryId,
            customerId: delivery.customerId,
            driverId: delivery.driverId,
            userType: socket.userType
          }
        })
        return socket.emit('error', { message: 'Unauthorized: Cannot track this delivery' })
      }

      // Join room for this specific delivery
      socket.join(`delivery-${deliveryId}`)
      console.log(`📍 User ${socket.userId} (${socket.userType}) tracking delivery: ${deliveryId}`)
      
      // Send current delivery status
      socket.emit('delivery-status', {
        deliveryId,
        status: delivery.status,
        timestamp: new Date()
      })
      
    } catch (error) {
      console.error('Track delivery error:', error)
      socket.emit('error', { message: 'Failed to join tracking' })
    }
  })

  // LEAVE DELIVERY TRACKING
  socket.on('stop-tracking', async (deliveryId) => {
    if (deliveryId) {
      socket.leave(`delivery-${deliveryId}`)
      console.log(`📍 User ${socket.userId} stopped tracking delivery: ${deliveryId}`)
    }
  })

  // Handle disconnection with cleanup
  socket.on('disconnect', async (reason) => {
    console.log(`❌ User disconnected: ${socket.userId} (${reason})`)
    
    // Clean up active driver location
    if (socket.userType === 'DRIVER') {
      activeDrivers.delete(socket.userId)
      
      // Update driver offline status
      try {
        await prisma.user.update({
          where: { id: socket.userId },
          data: { isOnline: false, lastSeen: new Date() }
        })
      } catch (error) {
        console.error('Error updating driver offline status:', error)
      }
    }
    
    // Remove from user socket mapping
    userSockets.delete(socket.userId)
    
    await logAuditEvent({
      userId: socket.userId,
      action: 'DELETE',
      resource: 'socket_connection',
      ipAddress: socket.ipAddress,
      userAgent: socket.userAgent,
      metadata: { 
        reason,
        userType: socket.userType,
        connectionDuration: Date.now() - socket.connectionTime.getTime()
      }
    })
  })

  // Handle socket errors
  socket.on('error', async (error) => {
    await logSecurityEvent({
      userId: socket.userId,
      eventType: 'SOCKET_ERROR',
      severity: 'medium',
      description: 'Socket error occurred',
      ipAddress: socket.ipAddress,
      userAgent: socket.userAgent,
      metadata: { error: error.message }
    })
  })
})

// Global error handler
app.use((error, req, res, next) => {
  logger.error('Unhandled error:', error)
  
  // Don't expose error details in production
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  res.status(error.status || 500).json({
    error: isDevelopment ? error.message : 'Internal server error',
    ...(isDevelopment && { stack: error.stack })
  })
})

// 404 handler
app.use('*', (req, res) => {
  logSecurityEvent({
    eventType: 'SUSPICIOUS_ACTIVITY',
    severity: 'low',
    description: `404 - Route not found: ${req.method} ${req.originalUrl}`,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  })
  
  res.status(404).json({ error: 'Route not found' })
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully')
  
  // Close server
  server.close(() => {
    console.log('HTTP server closed')
    
    // Close database connection
    prisma.$disconnect().then(() => {
      console.log('Database connection closed')
      process.exit(0)
    })
  })
})

// Start server
const PORT = process.env.PORT || 5004

async function startServer() {
  try {
    // Test database connection (skip for now since we don't have a real DB)
    console.log('⚠️  Database connection skipped (using demo mode)')
    
    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 PakkaDrop server running on port ${PORT}`)
      console.log(`🔒 Security measures active`)
      console.log(`📊 Environment: ${process.env.NODE_ENV}`)
      console.log(`📱 Socket.io enabled with authentication`)
      console.log(`💡 Demo mode - no database required`)
      
      // Log server start
      logger.info('Server started', {
        port: PORT,
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      })
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

startServer()

// Make io available globally for route handlers
global.io = io

module.exports = { app, server, io, activeDrivers, activeDeliveries }