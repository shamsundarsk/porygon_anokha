const express = require('express')
const { prisma } = require('../database/connection')
const { authenticateToken, requireRole } = require('../middleware/auth')
const { verifyOwnership, requirePermission } = require('../middleware/rbac')
const { validateDeliveryTransition } = require('../middleware/stateMachine')
const { calculateFare, calculateDistance } = require('../services/maps')
const { logAuditEvent, logSecurityEvent } = require('../services/audit')

const router = express.Router()

// Calculate fare (public endpoint)
router.post('/calculate-fare', async (req, res) => {
  try {
    const { pickupLat, pickupLng, deliveryLat, deliveryLng, vehicleType } = req.body
    
    // Validate coordinates
    if (!pickupLat || !pickupLng || !deliveryLat || !deliveryLng) {
      return res.status(400).json({ error: 'All coordinates required' })
    }
    
    if (pickupLat < -90 || pickupLat > 90 || deliveryLat < -90 || deliveryLat > 90) {
      return res.status(400).json({ error: 'Invalid latitude' })
    }
    
    if (pickupLng < -180 || pickupLng > 180 || deliveryLng < -180 || deliveryLng > 180) {
      return res.status(400).json({ error: 'Invalid longitude' })
    }
    
    const distance = calculateDistance(pickupLat, pickupLng, deliveryLat, deliveryLng)
    const fareBreakdown = calculateFare(distance, vehicleType)
    
    res.json(fareBreakdown)
  } catch (error) {
    console.error('Fare calculation error:', error)
    res.status(500).json({ error: 'Failed to calculate fare' })
  }
})

// Create delivery (CUSTOMER only)
router.post('/', 
  authenticateToken, 
  requireRole(['CUSTOMER', 'BUSINESS']), 
  async (req, res) => {
    try {
      const {
        pickupAddress, pickupLat, pickupLng,
        deliveryAddress, deliveryLat, deliveryLng,
        packageType, packageWeight, packageValue, packageDescription
      } = req.body

      // Validate required fields
      if (!pickupAddress || !deliveryAddress || !packageType) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      // Validate coordinates
      if (!pickupLat || !pickupLng || !deliveryLat || !deliveryLng) {
        return res.status(400).json({ error: 'Pickup and delivery coordinates required' })
      }

      const distance = calculateDistance(pickupLat, pickupLng, deliveryLat, deliveryLng)
      const fareBreakdown = calculateFare(distance)

      const delivery = await prisma.delivery.create({
        data: {
          orderId: `ORD${Date.now()}${Math.random().toString(36).substr(2, 4)}`,
          customerId: req.user.userId,
          pickupAddress,
          pickupLat,
          pickupLng,
          deliveryAddress,
          deliveryLat,
          deliveryLng,
          packageType,
          packageWeight: packageWeight || 0,
          packageValue: packageValue || 0,
          packageDescription,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          ...fareBreakdown
        }
      })

      await logAuditEvent({
        userId: req.user.userId,
        action: 'CREATE',
        resource: 'delivery',
        resourceId: delivery.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { orderId: delivery.orderId }
      })

      res.status(201).json(delivery)
    } catch (error) {
      console.error('Delivery creation error:', error)
      res.status(500).json({ error: 'Failed to create delivery' })
    }
  }
)

// Get user's deliveries (with proper ownership)
router.get('/my-deliveries', authenticateToken, async (req, res) => {
  try {
    let whereClause = {}
    
    // Filter based on user type and ownership
    switch (req.user.userType) {
      case 'CUSTOMER':
      case 'BUSINESS':
        whereClause.customerId = req.user.userId
        break
      case 'DRIVER':
        whereClause.driverId = req.user.userId
        break
      case 'ADMIN':
        // Admin can see all deliveries
        break
      default:
        return res.status(403).json({ error: 'Invalid user type' })
    }

    const deliveries = await prisma.delivery.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: { id: true, name: true, phone: true }
        },
        driver: {
          select: { id: true, name: true, phone: true, vehicleType: true, vehicleNumber: true }
        }
      }
    })

    res.json(deliveries)
  } catch (error) {
    console.error('Get deliveries error:', error)
    res.status(500).json({ error: 'Failed to get deliveries' })
  }
})

// Get single delivery (with ownership verification)
router.get('/:id', 
  authenticateToken, 
  verifyOwnership('delivery'), 
  async (req, res) => {
    try {
      const delivery = await prisma.delivery.findUnique({
        where: { id: req.params.id },
        include: {
          customer: {
            select: { id: true, name: true, phone: true }
          },
          driver: {
            select: { id: true, name: true, phone: true, vehicleType: true, vehicleNumber: true, rating: true }
          },
          payments: {
            select: { id: true, amount: true, status: true, method: true, createdAt: true }
          }
        }
      })

      if (!delivery) {
        return res.status(404).json({ error: 'Delivery not found' })
      }

      res.json(delivery)
    } catch (error) {
      console.error('Get delivery error:', error)
      res.status(500).json({ error: 'Failed to get delivery' })
    }
  }
)

// ACCEPT DELIVERY (DRIVER only, PENDING -> ACCEPTED)
router.post('/:id/accept', 
  authenticateToken, 
  requireRole(['DRIVER']), 
  async (req, res) => {
    try {
      const deliveryId = req.params.id
      const driverId = req.user.userId

      // Get delivery and verify it's available
      const delivery = await prisma.delivery.findUnique({
        where: { id: deliveryId },
        select: { 
          id: true, 
          status: true, 
          driverId: true,
          pickupLat: true,
          pickupLng: true
        }
      })

      if (!delivery) {
        return res.status(404).json({ error: 'Delivery not found' })
      }

      if (delivery.status !== 'PENDING') {
        await logSecurityEvent({
          userId: driverId,
          eventType: 'INVALID_DELIVERY_ACCEPT',
          severity: 'medium',
          description: `Driver attempted to accept delivery in ${delivery.status} status`,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          metadata: { deliveryId, currentStatus: delivery.status }
        })
        return res.status(400).json({ error: 'Delivery not available for acceptance' })
      }

      if (delivery.driverId && delivery.driverId !== driverId) {
        return res.status(400).json({ error: 'Delivery already assigned to another driver' })
      }

      // TODO: Add GPS verification - driver should be within reasonable distance of pickup
      // const { currentLat, currentLng } = req.body
      // if (calculateDistance(currentLat, currentLng, delivery.pickupLat, delivery.pickupLng) > 5) {
      //   return res.status(400).json({ error: 'You must be within 5km of pickup location' })
      // }

      // Update delivery status and assign driver
      const updatedDelivery = await prisma.delivery.update({
        where: { id: deliveryId },
        data: {
          status: 'ACCEPTED',
          driverId,
          acceptedAt: new Date()
        },
        include: {
          customer: { select: { id: true, name: true, phone: true } }
        }
      })

      await logAuditEvent({
        userId: driverId,
        action: 'UPDATE',
        resource: 'delivery_status',
        resourceId: deliveryId,
        oldValues: { status: 'PENDING', driverId: null },
        newValues: { status: 'ACCEPTED', driverId },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      })

      // Notify customer via socket
      if (global.io) {
        global.io.to(`delivery-${deliveryId}`).emit('delivery-accepted', {
          deliveryId,
          driver: {
            id: driverId,
            name: req.user.name
          }
        })
      }

      res.json(updatedDelivery)
    } catch (error) {
      console.error('Accept delivery error:', error)
      res.status(500).json({ error: 'Failed to accept delivery' })
    }
  }
)

// PICKUP DELIVERY (DRIVER only, ACCEPTED -> PICKED_UP)
router.post('/:id/pickup', 
  authenticateToken, 
  requireRole(['DRIVER']), 
  verifyOwnership('delivery'),
  async (req, res) => {
    try {
      const deliveryId = req.params.id
      const driverId = req.user.userId

      const delivery = await prisma.delivery.findUnique({
        where: { id: deliveryId },
        select: { 
          id: true, 
          status: true, 
          driverId: true,
          pickupLat: true,
          pickupLng: true
        }
      })

      if (delivery.status !== 'ACCEPTED') {
        return res.status(400).json({ error: 'Delivery must be accepted before pickup' })
      }

      if (delivery.driverId !== driverId) {
        return res.status(403).json({ error: 'Not assigned to you' })
      }

      // TODO: Verify driver location at pickup
      // const { currentLat, currentLng } = req.body
      // if (calculateDistance(currentLat, currentLng, delivery.pickupLat, delivery.pickupLng) > 0.1) {
      //   return res.status(400).json({ error: 'You must be at pickup location' })
      // }

      const updatedDelivery = await prisma.delivery.update({
        where: { id: deliveryId },
        data: {
          status: 'PICKED_UP',
          pickedUpAt: new Date()
        }
      })

      await logAuditEvent({
        userId: driverId,
        action: 'UPDATE',
        resource: 'delivery_status',
        resourceId: deliveryId,
        oldValues: { status: 'ACCEPTED' },
        newValues: { status: 'PICKED_UP' },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      })

      // Notify customer
      if (global.io) {
        global.io.to(`delivery-${deliveryId}`).emit('delivery-picked-up', {
          deliveryId,
          timestamp: new Date()
        })
      }

      res.json(updatedDelivery)
    } catch (error) {
      console.error('Pickup delivery error:', error)
      res.status(500).json({ error: 'Failed to pickup delivery' })
    }
  }
)

// START DELIVERY (DRIVER only, PICKED_UP -> IN_TRANSIT)
router.post('/:id/start', 
  authenticateToken, 
  requireRole(['DRIVER']), 
  verifyOwnership('delivery'),
  async (req, res) => {
    try {
      const deliveryId = req.params.id
      const driverId = req.user.userId

      const delivery = await prisma.delivery.findUnique({
        where: { id: deliveryId },
        select: { id: true, status: true, driverId: true }
      })

      if (delivery.status !== 'PICKED_UP') {
        return res.status(400).json({ error: 'Package must be picked up before starting delivery' })
      }

      if (delivery.driverId !== driverId) {
        return res.status(403).json({ error: 'Not assigned to you' })
      }

      const updatedDelivery = await prisma.delivery.update({
        where: { id: deliveryId },
        data: {
          status: 'IN_TRANSIT',
          inTransitAt: new Date()
        }
      })

      await logAuditEvent({
        userId: driverId,
        action: 'UPDATE',
        resource: 'delivery_status',
        resourceId: deliveryId,
        oldValues: { status: 'PICKED_UP' },
        newValues: { status: 'IN_TRANSIT' },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      })

      // Notify customer
      if (global.io) {
        global.io.to(`delivery-${deliveryId}`).emit('delivery-in-transit', {
          deliveryId,
          timestamp: new Date()
        })
      }

      res.json(updatedDelivery)
    } catch (error) {
      console.error('Start delivery error:', error)
      res.status(500).json({ error: 'Failed to start delivery' })
    }
  }
)

// COMPLETE DELIVERY (DRIVER only, IN_TRANSIT -> DELIVERED)
router.post('/:id/complete', 
  authenticateToken, 
  requireRole(['DRIVER']), 
  verifyOwnership('delivery'),
  async (req, res) => {
    try {
      const deliveryId = req.params.id
      const driverId = req.user.userId
      const { deliveryProof, customerSignature } = req.body

      const delivery = await prisma.delivery.findUnique({
        where: { id: deliveryId },
        select: { 
          id: true, 
          status: true, 
          driverId: true,
          deliveryLat: true,
          deliveryLng: true,
          customerId: true
        }
      })

      if (delivery.status !== 'IN_TRANSIT') {
        return res.status(400).json({ error: 'Delivery must be in transit before completion' })
      }

      if (delivery.driverId !== driverId) {
        return res.status(403).json({ error: 'Not assigned to you' })
      }

      // TODO: Verify driver location at delivery address
      // const { currentLat, currentLng } = req.body
      // if (calculateDistance(currentLat, currentLng, delivery.deliveryLat, delivery.deliveryLng) > 0.1) {
      //   return res.status(400).json({ error: 'You must be at delivery location' })
      // }

      const updatedDelivery = await prisma.delivery.update({
        where: { id: deliveryId },
        data: {
          status: 'DELIVERED',
          deliveredAt: new Date(),
          deliveryProof,
          customerSignature
        }
      })

      await logAuditEvent({
        userId: driverId,
        action: 'UPDATE',
        resource: 'delivery_status',
        resourceId: deliveryId,
        oldValues: { status: 'IN_TRANSIT' },
        newValues: { status: 'DELIVERED' },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      })

      // Notify customer
      if (global.io) {
        global.io.to(`delivery-${deliveryId}`).emit('delivery-completed', {
          deliveryId,
          timestamp: new Date(),
          deliveryProof
        })
      }

      res.json(updatedDelivery)
    } catch (error) {
      console.error('Complete delivery error:', error)
      res.status(500).json({ error: 'Failed to complete delivery' })
    }
  }
)

// CANCEL DELIVERY (CUSTOMER/DRIVER/ADMIN, various states -> CANCELLED)
router.post('/:id/cancel', 
  authenticateToken, 
  verifyOwnership('delivery'),
  async (req, res) => {
    try {
      const deliveryId = req.params.id
      const userId = req.user.userId
      const userType = req.user.userType
      const { reason } = req.body

      const delivery = await prisma.delivery.findUnique({
        where: { id: deliveryId },
        select: { 
          id: true, 
          status: true, 
          customerId: true,
          driverId: true
        }
      })

      // Check if cancellation is allowed based on status and user
      const allowedCancellations = {
        'PENDING': ['CUSTOMER', 'BUSINESS', 'ADMIN'],
        'ACCEPTED': ['CUSTOMER', 'BUSINESS', 'DRIVER', 'ADMIN'],
        'PICKED_UP': ['ADMIN'], // Only admin can cancel after pickup
        'IN_TRANSIT': ['ADMIN'],
        'DELIVERED': [], // Cannot cancel delivered
        'CANCELLED': [] // Already cancelled
      }

      const allowedRoles = allowedCancellations[delivery.status] || []
      
      if (!allowedRoles.includes(userType)) {
        await logSecurityEvent({
          userId,
          eventType: 'UNAUTHORIZED_CANCELLATION',
          severity: 'medium',
          description: `${userType} attempted to cancel delivery in ${delivery.status} status`,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          metadata: { deliveryId, status: delivery.status }
        })
        return res.status(403).json({ error: 'Cannot cancel delivery at this stage' })
      }

      const updatedDelivery = await prisma.delivery.update({
        where: { id: deliveryId },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancellationReason: reason,
          cancelledBy: userId
        }
      })

      await logAuditEvent({
        userId,
        action: 'UPDATE',
        resource: 'delivery_status',
        resourceId: deliveryId,
        oldValues: { status: delivery.status },
        newValues: { status: 'CANCELLED' },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { reason }
      })

      // Notify relevant parties
      if (global.io) {
        global.io.to(`delivery-${deliveryId}`).emit('delivery-cancelled', {
          deliveryId,
          reason,
          cancelledBy: userType,
          timestamp: new Date()
        })
      }

      res.json(updatedDelivery)
    } catch (error) {
      console.error('Cancel delivery error:', error)
      res.status(500).json({ error: 'Failed to cancel delivery' })
    }
  }
)

module.exports = router