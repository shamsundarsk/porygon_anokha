const jwt = require('jsonwebtoken')
const { prisma } = require('../database/connection')

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      return res.status(401).json({ error: 'Access token required' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        userType: true,
        isActive: true
      }
    })

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid or inactive user' })
    }

    req.user = { userId: user.id, ...user }
    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    return res.status(403).json({ error: 'Invalid token' })
  }
}

const requireRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' })
      }

      if (!allowedRoles.includes(req.user.userType)) {
        return res.status(403).json({ error: 'Insufficient permissions' })
      }

      next()
    } catch (error) {
      console.error('Role authorization error:', error)
      res.status(500).json({ error: 'Authorization check failed' })
    }
  }
}

module.exports = {
  authenticateToken,
  requireRole
}