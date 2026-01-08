const express = require('express')
const { prisma } = require('../database/connection')
const { authenticateToken, requireRole } = require('../middleware/auth')

const router = express.Router()

// Get driver dashboard data
router.get('/dashboard', authenticateToken, requireRole(['DRIVER']), async (req, res) => {
  try {
    const driver = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        isOnline: true,
        rating: true,
        totalDeliveries: true,
        completionRate: true,
        onTimeRate: true
      }
    })

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' })
    }

    // Get current delivery
    const currentDelivery = await prisma.delivery.findFirst({
      where: {
        driverId: req.user.userId,
        status: {
          in: ['ACCEPTED', 'PICKED_UP', 'IN_TRANSIT']
        }
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      }
    })

    // Get earnings
    const earnings = await prisma.earning.groupBy({
      by: ['date'],
      where: {
        userId: req.user.userId,
        type: 'DELIVERY'
      },
      _sum: {
        amount: true
      }
    })

    // Calculate earnings by period
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const thisWeekStart = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000))
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const earningsData = {
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      total: 0
    }

    earnings.forEach(earning => {
      const earningDate = new Date(earning.date)
      const amount = earning._sum.amount || 0
      
      earningsData.total += amount
      
      if (earningDate >= today) {
        earningsData.today += amount
      }
      if (earningDate >= thisWeekStart) {
        earningsData.thisWeek += amount
      }
      if (earningDate >= thisMonthStart) {
        earningsData.thisMonth += amount
      }
    })

    // Calculate average delivery time
    const completedDeliveries = await prisma.delivery.findMany({
      where: {
        driverId: req.user.userId,
        status: 'DELIVERED',
        actualDuration: { not: null }
      },
      select: {
        actualDuration: true
      }
    })

    const avgDeliveryTime = completedDeliveries.length > 0
      ? completedDeliveries.reduce((sum, d) => sum + d.actualDuration, 0) / completedDeliveries.length
      : 0

    const stats = {
      totalDeliveries: driver.totalDeliveries,
      rating: driver.rating,
      completionRate: driver.completionRate,
      onTimeRate: driver.onTimeRate,
      avgDeliveryTime: Math.round(avgDeliveryTime)
    }

    res.json({
      stats,
      earnings: earningsData,
      currentDelivery,
      isOnline: driver.isOnline
    })
  } catch (error) {
    console.error('Get driver dashboard error:', error)
    res.status(500).json({ error: 'Failed to fetch dashboard data' })
  }
})

// Toggle online/offline status
router.post('/toggle-status', authenticateToken, requireRole(['DRIVER']), async (req, res) => {
  try {
    const driver = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { isOnline: true }
    })

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' })
    }

    const updatedDriver = await prisma.user.update({
      where: { id: req.user.userId },
      data: { isOnline: !driver.isOnline },
      select: { isOnline: true }
    })

    res.json({ isOnline: updatedDriver.isOnline })
  } catch (error) {
    console.error('Toggle status error:', error)
    res.status(500).json({ error: 'Failed to toggle status' })
  }
})

// Update driver location
router.post('/location', authenticateToken, requireRole(['DRIVER']), async (req, res) => {
  try {
    const { lat, lng } = req.body

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' })
    }

    await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        currentLat: lat,
        currentLng: lng
      }
    })

    res.json({ message: 'Location updated successfully' })
  } catch (error) {
    console.error('Update location error:', error)
    res.status(500).json({ error: 'Failed to update location' })
  }
})

// Get driver earnings
router.get('/earnings', authenticateToken, requireRole(['DRIVER']), async (req, res) => {
  try {
    const { period = '30' } = req.query
    const days = parseInt(period)
    
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const earnings = await prisma.earning.findMany({
      where: {
        userId: req.user.userId,
        date: {
          gte: startDate
        }
      },
      include: {
        delivery: {
          select: {
            id: true,
            pickupAddress: true,
            dropoffAddress: true,
            status: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    })

    const totalEarnings = earnings.reduce((sum, earning) => sum + earning.amount, 0)
    const avgDailyEarnings = totalEarnings / days

    res.json({
      earnings,
      summary: {
        total: totalEarnings,
        avgDaily: Math.round(avgDailyEarnings),
        period: `${days} days`
      }
    })
  } catch (error) {
    console.error('Get earnings error:', error)
    res.status(500).json({ error: 'Failed to fetch earnings' })
  }
})

// Get driver delivery history
router.get('/deliveries', authenticateToken, requireRole(['DRIVER']), async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query

    const where = { driverId: req.user.userId }
    if (status) {
      where.status = status
    }

    const deliveries = await prisma.delivery.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true
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
    console.error('Get driver deliveries error:', error)
    res.status(500).json({ error: 'Failed to fetch deliveries' })
  }
})

// Get driver performance metrics
router.get('/performance', authenticateToken, requireRole(['DRIVER']), async (req, res) => {
  try {
    const { period = '30' } = req.query
    const days = parseInt(period)
    
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const deliveries = await prisma.delivery.findMany({
      where: {
        driverId: req.user.userId,
        createdAt: {
          gte: startDate
        }
      },
      select: {
        status: true,
        estimatedDuration: true,
        actualDuration: true,
        createdAt: true,
        deliveredAt: true
      }
    })

    const totalDeliveries = deliveries.length
    const completedDeliveries = deliveries.filter(d => d.status === 'DELIVERED')
    const cancelledDeliveries = deliveries.filter(d => d.status === 'CANCELLED')

    const completionRate = totalDeliveries > 0 
      ? (completedDeliveries.length / totalDeliveries) * 100 
      : 0

    const onTimeDeliveries = completedDeliveries.filter(d => 
      d.actualDuration && d.estimatedDuration && 
      d.actualDuration <= d.estimatedDuration * 1.2
    )

    const onTimeRate = completedDeliveries.length > 0
      ? (onTimeDeliveries.length / completedDeliveries.length) * 100
      : 0

    const avgDeliveryTime = completedDeliveries.length > 0
      ? completedDeliveries.reduce((sum, d) => sum + (d.actualDuration || d.estimatedDuration), 0) / completedDeliveries.length
      : 0

    res.json({
      period: `${days} days`,
      metrics: {
        totalDeliveries,
        completedDeliveries: completedDeliveries.length,
        cancelledDeliveries: cancelledDeliveries.length,
        completionRate: Math.round(completionRate),
        onTimeRate: Math.round(onTimeRate),
        avgDeliveryTime: Math.round(avgDeliveryTime)
      }
    })
  } catch (error) {
    console.error('Get performance metrics error:', error)
    res.status(500).json({ error: 'Failed to fetch performance metrics' })
  }
})

module.exports = router