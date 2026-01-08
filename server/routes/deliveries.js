const express = require('express')
const { prisma } = require('../database/connection')
const { authenticateToken } = require('../middleware/auth')
const { calculateFare, calculateDistance } = require('../services/maps')

const router = express.Router()

// Calculate fare
router.post('/calculate-fare', async (req, res) => {
  try {
    const { pickupLat, pickupLng, deliveryLat, deliveryLng, vehicleType } = req.body
    
    const distance = calculateDistance(pickupLat, pickupLng, deliveryLat, deliveryLng)
    const fareBreakdown = calculateFare(distance, vehicleType)
    
    res.json(fareBreakdown)
  } catch (error) {
    console.error('Fare calculation error:', error)
    res.status(500).json({ error: 'Failed to calculate fare' })
  }
})

// Create delivery
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      pickupAddress, pickupLat, pickupLng,
      deliveryAddress, deliveryLat, deliveryLng,
      packageType, packageWeight, packageValue, packageDescription
    } = req.body

    const distance = calculateDistance(pickupLat, pickupLng, deliveryLat, deliveryLng)
    const fareBreakdown = calculateFare(distance)

    const delivery = await prisma.delivery.create({
      data: {
        orderId: `ORD${Date.now()}`,
        customerId: req.user.userId,
        pickupAddress,
        pickupLat,
        pickupLng,
        deliveryAddress,
        deliveryLat,
        deliveryLng,
        packageType,
        packageWeight,
        packageValue,
        packageDescription,
        ...fareBreakdown
      }
    })

    res.status(201).json(delivery)
  } catch (error) {
    console.error('Delivery creation error:', error)
    res.status(500).json({ error: 'Failed to create delivery' })
  }
})

// Get user's deliveries
router.get('/my-deliveries', authenticateToken, async (req, res) => {
  try {
    const deliveries = await prisma.delivery.findMany({
      where: { customerId: req.user.userId },
      orderBy: { createdAt: 'desc' }
    })

    res.json(deliveries)
  } catch (error) {
    console.error('Get deliveries error:', error)
    res.status(500).json({ error: 'Failed to get deliveries' })
  }
})

module.exports = router