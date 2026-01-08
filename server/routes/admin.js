const express = require('express')
const { prisma } = require('../database/connection')
const { authenticateToken, requireRole } = require('../middleware/auth')

const router = express.Router()

// Get admin dashboard stats
router.get('/stats', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const totalUsers = await prisma.user.count()
    const activeDrivers = await prisma.user.count({
      where: {
        userType: 'DRIVER',
        isOnline: true
      }
    })
    
    const totalDeliveries = await prisma.delivery.count()
    const completedDeliveries = await prisma.delivery.count({
      where: { status: 'DELIVERED' }
    })
    
    const revenue = await prisma.delivery.aggregate({
      where: { status: 'DELIVERED' },
      _sum: { platformCommission: true }
    })

    const completionRate = totalDeliveries > 0 
      ? Math.round((completedDeliveries / totalDeliveries) * 100)
      : 0

    const stats = {
      totalUsers,
      activeDrivers,
      totalDeliveries,
      revenue: revenue._sum.platformCommission || 0,
      completionRate,
      avgRating: 4.3 // This would come from reviews
    }

    res.json(stats)
  } catch (error) {
    console.error('Get admin stats error:', error)
    res.status(500).json({ error: 'Failed to fetch admin stats' })
  }
})

// Get all deliveries for admin
router.get('/deliveries', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query

    const where = {}
    if (status) where.status = status

    const deliveries = await prisma.delivery.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        driver: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            vehicleType: true,
            vehicleNumber: true
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
    console.error('Get admin deliveries error:', error)
    res.status(500).json({ error: 'Failed to fetch deliveries' })
  }
})

// Get disputes
router.get('/disputes', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query

    const where = {}
    if (status) where.status = status

    const disputes = await prisma.dispute.findMany({
      where,
      include: {
        delivery: {
          select: {
            id: true,
            pickupAddress: true,
            dropoffAddress: true
          }
        },
        reporter: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: parseInt(limit)
    })

    const total = await prisma.dispute.count({ where })

    res.json({
      disputes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Get disputes error:', error)
    res.status(500).json({ error: 'Failed to fetch disputes' })
  }
})

// Get driver applications
router.get('/drivers/applications', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const applications = await prisma.user.findMany({
      where: {
        userType: 'DRIVER',
        documentsVerified: false
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        vehicleType: true,
        vehicleNumber: true,
        licenseNumber: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json(applications)
  } catch (error) {
    console.error('Get driver applications error:', error)
    res.status(500).json({ error: 'Failed to fetch driver applications' })
  }
})

// Approve driver
router.post('/drivers/:id/approve', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params

    const driver = await prisma.user.update({
      where: { id },
      data: { documentsVerified: true },
      select: {
        id: true,
        name: true,
        email: true,
        documentsVerified: true
      }
    })

    res.json(driver)
  } catch (error) {
    console.error('Approve driver error:', error)
    res.status(500).json({ error: 'Failed to approve driver' })
  }
})

// Resolve dispute
router.post('/disputes/:id/resolve', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params
    const { resolution } = req.body

    const dispute = await prisma.dispute.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolution,
        resolvedAt: new Date()
      }
    })

    res.json(dispute)
  } catch (error) {
    console.error('Resolve dispute error:', error)
    res.status(500).json({ error: 'Failed to resolve dispute' })
  }
})

module.exports = router