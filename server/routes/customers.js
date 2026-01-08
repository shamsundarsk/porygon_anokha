const express = require('express')
const { prisma } = require('../database/connection')
const { authenticateToken, requireRole } = require('../middleware/auth')

const router = express.Router()

// Get customer stats
router.get('/stats', authenticateToken, requireRole(['CUSTOMER', 'ENTERPRISE']), async (req, res) => {
  try {
    const deliveries = await prisma.delivery.findMany({
      where: { customerId: req.user.userId },
      select: {
        status: true,
        totalFare: true,
        createdAt: true,
        deliveredAt: true,
        estimatedDuration: true,
        actualDuration: true
      }
    })

    const completedDeliveries = deliveries.filter(d => d.status === 'DELIVERED')
    const totalSpent = completedDeliveries.reduce((sum, d) => sum + d.totalFare, 0)
    
    // Calculate on-time delivery rate
    const onTimeDeliveries = completedDeliveries.filter(d => 
      d.actualDuration && d.estimatedDuration && 
      d.actualDuration <= d.estimatedDuration * 1.2 // 20% tolerance
    )
    
    const onTimeRate = completedDeliveries.length > 0 
      ? (onTimeDeliveries.length / completedDeliveries.length) * 100 
      : 0

    // Calculate average delivery time
    const avgDeliveryTime = completedDeliveries.length > 0
      ? completedDeliveries.reduce((sum, d) => sum + (d.actualDuration || d.estimatedDuration), 0) / completedDeliveries.length
      : 0

    const stats = {
      totalDeliveries: deliveries.length,
      completedDeliveries: completedDeliveries.length,
      totalSpent: Math.round(totalSpent),
      avgRating: 4.5, // This would come from reviews
      onTimeDeliveryRate: Math.round(onTimeRate),
      avgDeliveryTime: Math.round(avgDeliveryTime)
    }

    res.json(stats)
  } catch (error) {
    console.error('Get customer stats error:', error)
    res.status(500).json({ error: 'Failed to fetch customer stats' })
  }
})

// Get customer analytics
router.get('/analytics', authenticateToken, requireRole(['CUSTOMER', 'ENTERPRISE']), async (req, res) => {
  try {
    const { period = '30' } = req.query
    const days = parseInt(period)
    
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const deliveries = await prisma.delivery.findMany({
      where: {
        customerId: req.user.userId,
        createdAt: {
          gte: startDate
        }
      },
      select: {
        status: true,
        totalFare: true,
        createdAt: true,
        businessType: true,
        packageType: true,
        estimatedDistance: true
      }
    })

    // Group by date
    const dailyStats = {}
    deliveries.forEach(delivery => {
      const date = delivery.createdAt.toISOString().split('T')[0]
      if (!dailyStats[date]) {
        dailyStats[date] = {
          deliveries: 0,
          spent: 0,
          distance: 0
        }
      }
      dailyStats[date].deliveries++
      dailyStats[date].spent += delivery.totalFare
      dailyStats[date].distance += delivery.estimatedDistance
    })

    // Package type breakdown
    const packageTypes = {}
    deliveries.forEach(delivery => {
      packageTypes[delivery.packageType] = (packageTypes[delivery.packageType] || 0) + 1
    })

    // Business type breakdown
    const businessTypes = {}
    deliveries.forEach(delivery => {
      businessTypes[delivery.businessType] = (businessTypes[delivery.businessType] || 0) + 1
    })

    const analytics = {
      period: `${days} days`,
      totalDeliveries: deliveries.length,
      totalSpent: deliveries.reduce((sum, d) => sum + d.totalFare, 0),
      avgOrderValue: deliveries.length > 0 ? deliveries.reduce((sum, d) => sum + d.totalFare, 0) / deliveries.length : 0,
      dailyStats,
      packageTypes,
      businessTypes
    }

    res.json(analytics)
  } catch (error) {
    console.error('Get customer analytics error:', error)
    res.status(500).json({ error: 'Failed to fetch customer analytics' })
  }
})

module.exports = router