const express = require('express')
const { prisma } = require('../database/connection')
const { authenticateToken, requireRole } = require('../middleware/auth')

const router = express.Router()

// Driver dashboard
router.get('/dashboard', authenticateToken, requireRole(['DRIVER']), async (req, res) => {
  try {
    const stats = {
      totalEarnings: 0,
      totalDeliveries: 0,
      rating: 5.0,
      isOnline: false
    }

    res.json(stats)
  } catch (error) {
    console.error('Driver dashboard error:', error)
    res.status(500).json({ error: 'Failed to get dashboard data' })
  }
})

module.exports = router