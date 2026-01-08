const express = require('express')
const { prisma } = require('../database/connection')
const { authenticateToken, requireRole } = require('../middleware/auth')

const router = express.Router()

// Get admin dashboard stats
router.get('/stats', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const totalUsers = await prisma.user.count()
    const totalDeliveries = await prisma.delivery.count()
    
    const stats = {
      totalUsers,
      totalDeliveries,
      activeDrivers: 0,
      revenue: 0,
      completionRate: 95
    }

    res.json(stats)
  } catch (error) {
    console.error('Admin stats error:', error)
    res.status(500).json({ error: 'Failed to get stats' })
  }
})

module.exports = router