const express = require('express')
const { prisma } = require('../database/connection')
const { authenticateToken } = require('../middleware/auth')
const { calculateFare, calculateDistance } = require('../services/maps')

const router = express.Router()

// Calculate fare
router.post('/calculate-fare', async (req, res) => {
  try {
    const { pickup, dropoff, vehicleType, packageWeight } = req.body

    if (!pickup || !dropoff || !vehicleType) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Calculate distance and duration
    const distanceData = await calculateDistance(pickup, dropoff)
    
    if (!distanceData.success) {
      return res.status(400).json({ error: 'Failed to calculate distance' })
    }

    // Calculate fare based on distance, vehicle type, and package weight
    const fareBreakdown = await calculateFare({
      distance: distanceData.distance,
      duration: distanceData.duration,
      vehicleType,
      packageWeight: packageWeight || 1
    })

    res.json({
      ...fareBreakdown,
      estimatedDistance: distanceData.distance,
      estimatedDuration: distanceData.duration
    })
  } catch (error) {
    console.error('Fare calculation error:', error)
    res.status(500).json({ error: 'Failed to calculate fare' })
  }
})

// Create delivery
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      pickup,
      dropoff,
      package: packageInfo,
      vehicleType,
      businessType,
      scheduledTime,
      customerNotes,
      fareBreakdown
    } = req.body

    // Validate required fields
    if (!pickup || !dropoff || !packageInfo || !vehicleType || !fareBreakdown) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Calculate distance for accurate pricing
    const distanceData = await calculateDistance(pickup, dropoff)

    const delivery = await prisma.delivery.create({
      data: {
        customerId: req.user.userId,
        businessType: businessType || 'B2C',
        
        // Pickup details
        pickupAddress: pickup.address,
        pickupLat: pickup.lat,
        pickupLng: pickup.lng,
        pickupContactName: pickup.contactName,
        pickupContactPhone: pickup.contactPhone,
        pickupInstructions: pickup.instructions,
        
        // Dropoff details
        dropoffAddress: dropoff.address,
        dropoffLat: dropoff.lat,
        dropoffLng: dropoff.lng,
        dropoffContactName: dropoff.contactName,
        dropoffContactPhone: dropoff.contactPhone,
        dropoffInstructions: dropoff.instructions,
        
        // Package details
        packageType: packageInfo.type,
        packageWeight: packageInfo.weight,
        packageDimensions: packageInfo.dimensions,
        packageValue: packageInfo.value,
        packageDescription: packageInfo.description,
        isFragile: packageInfo.fragile || false,
        
        // Pricing
        baseFare: fareBreakdown.baseFare,
        distanceCost: fareBreakdown.distanceCost,
        fuelAdjustment: fareBreakdown.fuelAdjustment,
        tollCharges: fareBreakdown.tollCharges || 0,
        platformCommission: fareBreakdown.platformCommission,
        totalFare: fareBreakdown.totalFare,
        driverEarnings: fareBreakdown.driverEarnings,
        
        // Timing
        scheduledTime: scheduledTime ? new Date(scheduledTime) : null,
        estimatedDistance: distanceData.distance || fareBreakdown.estimatedDistance,
        estimatedDuration: distanceData.duration || fareBreakdown.estimatedDuration,
        
        customerNotes
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            businessType: true
          }
        }
      }
    })

    // Emit to available drivers
    if (global.io) {
      global.io.emit('new-delivery', delivery)
    }

    res.status(201).json(delivery)
  } catch (error) {
    console.error('Delivery creation error:', error)
    res.status(500).json({ error: 'Failed to create delivery' })
  }
})

// Get user's deliveries
router.get('/my-deliveries', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, businessType } = req.query

    const where = { customerId: req.user.userId }
    
    if (status) where.status = status
    if (businessType) where.businessType = businessType

    const deliveries = await prisma.delivery.findMany({
      where,
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
            vehicleType: true,
            vehicleNumber: true,
            rating: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: parseInt(limit)
    })

    const total = await prisma.delivery.count({ where })

    res.json({
      deliveries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Get deliveries error:', error)
    res.status(500).json({ error: 'Failed to fetch deliveries' })
  }
})

// Get current active deliveries
router.get('/current', authenticateToken, async (req, res) => {
  try {
    const deliveries = await prisma.delivery.findMany({
      where: {
        customerId: req.user.userId,
        status: {
          in: ['PENDING', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT']
        }
      },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
            vehicleType: true,
            vehicleNumber: true,
            rating: true,
            currentLat: true,
            currentLng: true
          }
        },
        trackingUpdates: {
          orderBy: { timestamp: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json(deliveries)
  } catch (error) {
    console.error('Get current deliveries error:', error)
    res.status(500).json({ error: 'Failed to fetch current deliveries' })
  }
})

// Get available deliveries for drivers
router.get('/available', authenticateToken, async (req, res) => {
  try {
    const { vehicleType, maxDistance = 10 } = req.query

    // Get driver's current location
    const driver = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { currentLat: true, currentLng: true, vehicleType: true }
    })

    const where = {
      status: 'PENDING',
      driverId: null
    }

    // Filter by vehicle type if specified
    if (vehicleType) {
      // This would need a vehicleType field in delivery model
      // For now, we'll skip this filter
    }

    const deliveries = await prisma.delivery.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            businessType: true,
            rating: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    // Calculate distance from driver's location (if available)
    const deliveriesWithDistance = deliveries.map(delivery => ({
      ...delivery,
      distanceFromDriver: driver.currentLat && driver.currentLng 
        ? calculateDistanceFromCoords(
            driver.currentLat, 
            driver.currentLng, 
            delivery.pickupLat, 
            delivery.pickupLng
          )
        : null
    }))

    res.json(deliveriesWithDistance)
  } catch (error) {
    console.error('Get available deliveries error:', error)
    res.status(500).json({ error: 'Failed to fetch available deliveries' })
  }
})

// Accept delivery (driver)
router.post('/:id/accept', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    // Check if delivery exists and is available
    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: {
        customer: {
          select: { id: true, name: true, phone: true }
        }
      }
    })

    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' })
    }

    if (delivery.status !== 'PENDING') {
      return res.status(400).json({ error: 'Delivery is not available' })
    }

    // Update delivery with driver
    const updatedDelivery = await prisma.delivery.update({
      where: { id },
      data: {
        driverId: req.user.userId,
        status: 'ACCEPTED',
        acceptedAt: new Date()
      },
      include: {
        customer: {
          select: { id: true, name: true, phone: true }
        },
        driver: {
          select: { id: true, name: true, phone: true, vehicleType: true, vehicleNumber: true, rating: true }
        }
      }
    })

    // Create tracking update
    await prisma.trackingUpdate.create({
      data: {
        deliveryId: id,
        lat: delivery.pickupLat,
        lng: delivery.pickupLng,
        status: 'ACCEPTED',
        message: 'Delivery partner assigned'
      }
    })

    // Emit real-time update
    if (global.io) {
      global.io.to(`delivery-${id}`).emit('delivery-update', updatedDelivery)
    }

    res.json(updatedDelivery)
  } catch (error) {
    console.error('Accept delivery error:', error)
    res.status(500).json({ error: 'Failed to accept delivery' })
  }
})

// Update delivery status
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { status, location, notes, waitingTime } = req.body

    const delivery = await prisma.delivery.findUnique({
      where: { id }
    })

    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' })
    }

    // Verify driver owns this delivery
    if (delivery.driverId !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    const updateData = { status }

    // Add timestamp based on status
    if (status === 'PICKED_UP') {
      updateData.pickedUpAt = new Date()
    } else if (status === 'DELIVERED') {
      updateData.deliveredAt = new Date()
      
      // Add waiting time charges if any
      if (waitingTime > 0) {
        const waitingCharges = waitingTime * 2 // ₹2 per minute
        updateData.waitingTime = waitingTime
        updateData.waitingCharges = waitingCharges
        updateData.totalFare = delivery.totalFare + waitingCharges
        updateData.driverEarnings = delivery.driverEarnings + waitingCharges
      }
    }

    if (notes) {
      updateData.driverNotes = notes
    }

    const updatedDelivery = await prisma.delivery.update({
      where: { id },
      data: updateData,
      include: {
        customer: {
          select: { id: true, name: true, phone: true }
        },
        driver: {
          select: { id: true, name: true, phone: true, vehicleType: true, vehicleNumber: true }
        }
      }
    })

    // Create tracking update
    if (location) {
      await prisma.trackingUpdate.create({
        data: {
          deliveryId: id,
          lat: location.lat,
          lng: location.lng,
          status,
          message: getStatusMessage(status)
        }
      })
    }

    // Update driver earnings if delivered
    if (status === 'DELIVERED') {
      await prisma.earning.create({
        data: {
          userId: req.user.userId,
          deliveryId: id,
          amount: updatedDelivery.driverEarnings,
          type: 'DELIVERY',
          description: `Delivery completed: ${id}`
        }
      })

      // Update driver stats
      await prisma.user.update({
        where: { id: req.user.userId },
        data: {
          totalDeliveries: {
            increment: 1
          }
        }
      })
    }

    // Emit real-time update
    if (global.io) {
      global.io.to(`delivery-${id}`).emit('delivery-update', updatedDelivery)
    }

    res.json(updatedDelivery)
  } catch (error) {
    console.error('Update delivery status error:', error)
    res.status(500).json({ error: 'Failed to update delivery status' })
  }
})

// Cancel delivery
router.post('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { reason } = req.body

    const delivery = await prisma.delivery.findUnique({
      where: { id }
    })

    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' })
    }

    // Check if user can cancel (customer or assigned driver)
    if (delivery.customerId !== req.user.userId && delivery.driverId !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    // Check if delivery can be cancelled
    if (['DELIVERED', 'CANCELLED'].includes(delivery.status)) {
      return res.status(400).json({ error: 'Cannot cancel this delivery' })
    }

    const updatedDelivery = await prisma.delivery.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        driverNotes: reason || 'Cancelled by user'
      }
    })

    // Create tracking update
    await prisma.trackingUpdate.create({
      data: {
        deliveryId: id,
        lat: delivery.pickupLat,
        lng: delivery.pickupLng,
        status: 'CANCELLED',
        message: 'Delivery cancelled'
      }
    })

    // Emit real-time update
    if (global.io) {
      global.io.to(`delivery-${id}`).emit('delivery-update', updatedDelivery)
    }

    res.json(updatedDelivery)
  } catch (error) {
    console.error('Cancel delivery error:', error)
    res.status(500).json({ error: 'Failed to cancel delivery' })
  }
})

// Get delivery tracking
router.get('/:id/tracking', async (req, res) => {
  try {
    const { id } = req.params

    const tracking = await prisma.trackingUpdate.findMany({
      where: { deliveryId: id },
      orderBy: { timestamp: 'asc' }
    })

    res.json(tracking)
  } catch (error) {
    console.error('Get tracking error:', error)
    res.status(500).json({ error: 'Failed to fetch tracking' })
  }
})

// Helper functions
function getStatusMessage(status) {
  const messages = {
    'ACCEPTED': 'Delivery partner assigned',
    'PICKED_UP': 'Package picked up',
    'IN_TRANSIT': 'On the way to destination',
    'DELIVERED': 'Package delivered successfully',
    'CANCELLED': 'Delivery cancelled'
  }
  return messages[status] || 'Status updated'
}

function calculateDistanceFromCoords(lat1, lng1, lat2, lng2) {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

module.exports = router