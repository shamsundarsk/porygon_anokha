require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { createServer } = require('http')
const { Server } = require('socket.io')
const { prisma, testConnection } = require('./database/connection')

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3003", "http://localhost:19006"], // Add Expo dev server
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
})

// Make io available globally for routes
global.io = io

// Import routes
const authRoutes = require('./routes/auth')
const userRoutes = require('./routes/users')
const deliveryRoutes = require('./routes/deliveries')
const driverRoutes = require('./routes/drivers')
const adminRoutes = require('./routes/admin')
const customerRoutes = require('./routes/customers')
const mapRoutes = require('./routes/maps')
const paymentRoutes = require('./routes/payments')

// Middleware
app.use(cors({
  origin: ["http://localhost:3005", "http://localhost:19006"],
  credentials: true
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  })
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/deliveries', deliveryRoutes)
app.use('/api/drivers', driverRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/customers', customerRoutes)
app.use('/api/maps', mapRoutes)
app.use('/api/payments', paymentRoutes)

// Socket.io for real-time features
const activeDrivers = new Map() // Store active driver locations
const activeDeliveries = new Map() // Store active delivery tracking

io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`)

  // Driver location updates
  socket.on('driver-location-update', (data) => {
    const { driverId, lat, lng, heading } = data
    activeDrivers.set(driverId, { lat, lng, heading, socketId: socket.id, lastUpdate: Date.now() })
    
    // Broadcast to customers tracking this driver
    socket.broadcast.emit('driver-location', { driverId, lat, lng, heading })
  })

  // Join delivery tracking room
  socket.on('track-delivery', (deliveryId) => {
    socket.join(`delivery-${deliveryId}`)
    console.log(`📍 Tracking delivery: ${deliveryId}`)
  })

  // Delivery status updates
  socket.on('delivery-status-update', (data) => {
    const { deliveryId, status, location } = data
    io.to(`delivery-${deliveryId}`).emit('delivery-update', data)
  })

  // Voice command handling
  socket.on('voice-command', (data) => {
    const { command, userId } = data
    // Process voice command and emit response
    socket.emit('voice-response', { 
      message: `Processed command: ${command}`,
      action: 'navigate' // or other actions
    })
  })

  // Disconnect handling
  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected: ${socket.id}`)
    
    // Remove driver from active list
    for (const [driverId, driverData] of activeDrivers.entries()) {
      if (driverData.socketId === socket.id) {
        activeDrivers.delete(driverId)
        break
      }
    }
  })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err)
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

const PORT = process.env.PORT || 5004

async function startServer() {
  try {
    // Test database connection (skip for now since we don't have a real DB)
    console.log('⚠️  Database connection skipped (using demo mode)')
    
    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 FairLoad server running on port ${PORT}`)
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
      console.log(`📱 Socket.io enabled for real-time features`)
      console.log(`💡 Demo mode - no database required`)
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

startServer()

module.exports = { app, io, activeDrivers, activeDeliveries }