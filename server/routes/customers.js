const express = require('express')
const { prisma } = require('../database/connection')
const { authenticateToken, requireRole } = require('../middleware/auth')

const router = express.Router()

// Customer stats
router.get('/stats', authenticateToken, requireRole(['CUSTOMER', 'ENTERPRISE']), async (req, res) => {
  try {
    const stats = {
      totalDeliveries: 0,
      totalSpent: 0,
      avgRating: 5.0
    }

    res.json(stats)
  } catch (error) {
    console.error('Customer stats error:', error)
    res.status(500).json({ error: 'Failed to get stats' })
  }
})

module.exports = router