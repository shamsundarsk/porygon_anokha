const express = require('express')
const { prisma } = require('../database/connection')
const { authenticateToken } = require('../middleware/auth')

const router = express.Router()

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        userType: true,
        businessType: true,
        companyName: true,
        isVerified: true,
        avatar: true,
        vehicleType: true,
        vehicleNumber: true,
        licenseNumber: true,
        isOnline: true,
        rating: true,
        totalDeliveries: true,
        completionRate: true,
        onTimeRate: true,
        createdAt: true
      }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json(user)
  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({ error: 'Failed to fetch profile' })
  }
})

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const {
      name,
      phone,
      companyName,
      vehicleType,
      vehicleNumber,
      licenseNumber
    } = req.body

    const updateData = {}
    
    if (name) updateData.name = name
    if (phone) updateData.phone = phone
    if (companyName) updateData.companyName = companyName
    
    // Driver-specific updates
    if (req.user.userType === 'DRIVER') {
      if (vehicleType) updateData.vehicleType = vehicleType
      if (vehicleNumber) updateData.vehicleNumber = vehicleNumber
      if (licenseNumber) updateData.licenseNumber = licenseNumber
    }

    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        userType: true,
        businessType: true,
        companyName: true,
        isVerified: true,
        avatar: true,
        vehicleType: true,
        vehicleNumber: true,
        licenseNumber: true,
        isOnline: true,
        rating: true,
        totalDeliveries: true,
        completionRate: true,
        onTimeRate: true,
        createdAt: true
      }
    })

    res.json(user)
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ error: 'Failed to update profile' })
  }
})

// Get user notifications
router.get('/notifications', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query

    const where = { userId: req.user.userId }
    if (unreadOnly === 'true') {
      where.isRead = false
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: parseInt(limit)
    })

    const total = await prisma.notification.count({ where })

    res.json({
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Get notifications error:', error)
    res.status(500).json({ error: 'Failed to fetch notifications' })
  }
})

// Mark notification as read
router.put('/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    const notification = await prisma.notification.updateMany({
      where: {
        id,
        userId: req.user.userId
      },
      data: {
        isRead: true
      }
    })

    if (notification.count === 0) {
      return res.status(404).json({ error: 'Notification not found' })
    }

    res.json({ message: 'Notification marked as read' })
  } catch (error) {
    console.error('Mark notification read error:', error)
    res.status(500).json({ error: 'Failed to mark notification as read' })
  }
})

// Mark all notifications as read
router.put('/notifications/read-all', authenticateToken, async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: {
        userId: req.user.userId,
        isRead: false
      },
      data: {
        isRead: true
      }
    })

    res.json({ message: 'All notifications marked as read' })
  } catch (error) {
    console.error('Mark all notifications read error:', error)
    res.status(500).json({ error: 'Failed to mark all notifications as read' })
  }
})

// Get user stats (for customers)
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    if (!['CUSTOMER', 'ENTERPRISE'].includes(req.user.userType)) {
      return res.status(403).json({ error: 'Access denied' })
    }

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
    console.error('Get user stats error:', error)
    res.status(500).json({ error: 'Failed to fetch user stats' })
  }
})

module.exports = router