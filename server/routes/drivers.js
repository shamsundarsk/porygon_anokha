const express = require('express')
const { prisma } = require('../database/connection')
const { authenticateToken, requireRole } = require('../middleware/auth')
const { verifyOwnership, requirePermission } = require('../middleware/rbac')
const { logAuditEvent, logSecurityEvent } = require('../services/audit')

const router = express.Router()

// Driver dashboard - STRICT role verification
router.get('/dashboard', 
  authenticateToken, 
  requireRole(['DRIVER']), 
  async (req, res) => {
    try {
      const driverId = req.user.userId

      // Get driver stats from database
      const driver = await prisma.user.findUnique({
        where: { id: driverId },
        select: {
          id: true,
          name: true,
          rating: true,
          totalRatings: true,
          completedDeliveries: true,
          isOnline: true,
          vehicleType: true,
          vehicleNumber: true,
          isVerified: true
        }
      })

      if (!driver) {
        return res.status(404).json({ error: 'Driver profile not found' })
      }

      // Get earnings for this driver
      const earnings = await prisma.earning.aggregate({
        where: { driverId },
        _sum: { amount: true }
      })

      // Get active deliveries count
      const activeDeliveries = await prisma.delivery.count({
        where: {
          driverId,
          status: { in: ['ACCEPTED', 'PICKED_UP', 'IN_TRANSIT'] }
        }
      })

      // Get today's deliveries
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const todayDeliveries = await prisma.delivery.count({
        where: {
          driverId,
          deliveredAt: { gte: today }
        }
      })

      const stats = {
        totalEarnings: earnings._sum.amount || 0,
        totalDeliveries: driver.completedDeliveries,
        todayDeliveries,
        activeDeliveries,
        rating: driver.rating,
        totalRatings: driver.totalRatings,
        isOnline: driver.isOnline,
        isVerified: driver.isVerified,
        vehicleType: driver.vehicleType,
        vehicleNumber: driver.vehicleNumber
      }

      res.json(stats)
    } catch (error) {
      console.error('Driver dashboard error:', error)
      res.status(500).json({ error: 'Failed to get dashboard data' })
    }
  }
)

// Get available deliveries for driver
router.get('/available-deliveries', 
  authenticateToken, 
  requireRole(['DRIVER']), 
  async (req, res) => {
    try {
      const driverId = req.user.userId

      // Only show PENDING deliveries that are not assigned
      const availableDeliveries = await prisma.delivery.findMany({
        where: {
          status: 'PENDING',
          driverId: null
        },
        orderBy: { createdAt: 'desc' },
        take: 20, // Limit to 20 most recent
        select: {
          id: true,
          orderId: true,
          pickupAddress: true,
          deliveryAddress: true,
          packageType: true,
          packageWeight: true,
          totalFare: true,
          driverEarnings: true,
          estimatedDistance: true,
          estimatedDuration: true,
          createdAt: true,
          customer: {
            select: { name: true, rating: true }
          }
        }
      })

      res.json(availableDeliveries)
    } catch (error) {
      console.error('Get available deliveries error:', error)
      res.status(500).json({ error: 'Failed to get available deliveries' })
    }
  }
)

// Update driver online status
router.post('/status', 
  authenticateToken, 
  requireRole(['DRIVER']), 
  async (req, res) => {
    try {
      const driverId = req.user.userId
      const { isOnline, currentLat, currentLng } = req.body

      if (typeof isOnline !== 'boolean') {
        return res.status(400).json({ error: 'isOnline must be boolean' })
      }

      // Validate coordinates if going online
      if (isOnline && (!currentLat || !currentLng)) {
        return res.status(400).json({ error: 'Location required to go online' })
      }

      if (isOnline && (currentLat < -90 || currentLat > 90 || currentLng < -180 || currentLng > 180)) {
        return res.status(400).json({ error: 'Invalid coordinates' })
      }

      const updateData = {
        isOnline,
        lastSeen: new Date()
      }

      if (isOnline) {
        updateData.currentLat = currentLat
        updateData.currentLng = currentLng
      }

      const updatedDriver = await prisma.user.update({
        where: { id: driverId },
        data: updateData,
        select: {
          id: true,
          isOnline: true,
          currentLat: true,
          currentLng: true,
          lastSeen: true
        }
      })

      await logAuditEvent({
        userId: driverId,
        action: 'UPDATE',
        resource: 'driver_status',
        resourceId: driverId,
        oldValues: { isOnline: !isOnline },
        newValues: { isOnline },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      })

      res.json(updatedDriver)
    } catch (error) {
      console.error('Update driver status error:', error)
      res.status(500).json({ error: 'Failed to update status' })
    }
  }
)

// Get driver profile (own profile only)
router.get('/profile', 
  authenticateToken, 
  requireRole(['DRIVER']), 
  async (req, res) => {
    try {
      const driverId = req.user.userId

      const driver = await prisma.user.findUnique({
        where: { id: driverId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          vehicleType: true,
          vehicleNumber: true,
          licenseNumber: true,
          rating: true,
          totalRatings: true,
          completedDeliveries: true,
          isVerified: true,
          isOnline: true,
          createdAt: true
        }
      })

      if (!driver) {
        return res.status(404).json({ error: 'Driver profile not found' })
      }

      res.json(driver)
    } catch (error) {
      console.error('Get driver profile error:', error)
      res.status(500).json({ error: 'Failed to get profile' })
    }
  }
)

// Update driver profile (own profile only)
router.put('/profile', 
  authenticateToken, 
  requireRole(['DRIVER']), 
  async (req, res) => {
    try {
      const driverId = req.user.userId
      const { name, phone, vehicleType, vehicleNumber, licenseNumber } = req.body

      // Validate required fields
      if (!name || !phone) {
        return res.status(400).json({ error: 'Name and phone are required' })
      }

      // Validate vehicle info for drivers
      if (!vehicleType || !vehicleNumber) {
        return res.status(400).json({ error: 'Vehicle type and number are required for drivers' })
      }

      const allowedVehicleTypes = ['BIKE', 'AUTO', 'MINI_TRUCK', 'PICKUP']
      if (!allowedVehicleTypes.includes(vehicleType)) {
        return res.status(400).json({ error: 'Invalid vehicle type' })
      }

      // Check if phone is already taken by another user
      const existingUser = await prisma.user.findFirst({
        where: {
          phone,
          id: { not: driverId }
        }
      })

      if (existingUser) {
        return res.status(400).json({ error: 'Phone number already in use' })
      }

      const updatedDriver = await prisma.user.update({
        where: { id: driverId },
        data: {
          name,
          phone,
          vehicleType,
          vehicleNumber,
          licenseNumber
        },
        select: {
          id: true,
          name: true,
          phone: true,
          vehicleType: true,
          vehicleNumber: true,
          licenseNumber: true,
          updatedAt: true
        }
      })

      await logAuditEvent({
        userId: driverId,
        action: 'UPDATE',
        resource: 'driver_profile',
        resourceId: driverId,
        newValues: { name, phone, vehicleType, vehicleNumber },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      })

      res.json(updatedDriver)
    } catch (error) {
      console.error('Update driver profile error:', error)
      res.status(500).json({ error: 'Failed to update profile' })
    }
  }
)

module.exports = router