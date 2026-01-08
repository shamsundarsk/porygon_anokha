const { prisma } = require('../database/connection')
const { logSecurityEvent } = require('../services/audit')

// Resource ownership verification
const verifyOwnership = (resourceType) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.userId
      const resourceId = req.params.id || req.params.deliveryId || req.params.userId
      
      if (!resourceId) {
        return res.status(400).json({ error: 'Resource ID required' })
      }

      let hasAccess = false
      let resource = null

      switch (resourceType) {
        case 'delivery':
          resource = await prisma.delivery.findUnique({
            where: { id: resourceId },
            select: { 
              id: true,
              customerId: true, 
              driverId: true,
              status: true
            }
          })
          
          hasAccess = resource && (
            resource.customerId === userId ||
            resource.driverId === userId ||
            req.user.userType === 'ADMIN'
          )
          break

        case 'user':
          // Users can only access their own data unless admin
          hasAccess = resourceId === userId || req.user.userType === 'ADMIN'
          break

        case 'payment':
          const payment = await prisma.payment.findUnique({
            where: { id: resourceId },
            include: { delivery: { select: { customerId: true, driverId: true } } }
          })
          
          hasAccess = payment && (
            payment.delivery.customerId === userId ||
            payment.delivery.driverId === userId ||
            req.user.userType === 'ADMIN'
          )
          break

        case 'driver-profile':
          // Users can only access their own profile unless admin
          hasAccess = resourceId === userId || req.user.userType === 'ADMIN'
          break

        default:
          return res.status(400).json({ error: 'Invalid resource type' })
      }

      if (!hasAccess) {
        await logSecurityEvent({
          userId,
          eventType: 'UNAUTHORIZED_ACCESS',
          severity: 'high',
          description: `Unauthorized access attempt to ${resourceType}: ${resourceId}`,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          metadata: { resourceType, resourceId }
        })
        return res.status(403).json({ error: 'Access denied' })
      }

      // Attach resource to request for use in handlers
      req.resource = resource
      next()
    } catch (error) {
      console.error('Ownership verification error:', error)
      res.status(500).json({ error: 'Access verification failed' })
    }
  }
}

// Role-based permissions with granular control
const permissions = {
  CUSTOMER: {
    deliveries: ['create', 'read_own', 'update_own'],
    payments: ['create', 'read_own'],
    profile: ['read_own', 'update_own']
  },
  DRIVER: {
    deliveries: ['read_assigned', 'update_assigned'],
    payments: ['read_own'],
    profile: ['read_own', 'update_own'],
    location: ['update_own']
  },
  BUSINESS: {
    deliveries: ['create', 'read_own', 'update_own', 'bulk_create'],
    payments: ['create', 'read_own'],
    profile: ['read_own', 'update_own'],
    analytics: ['read_own']
  },
  ADMIN: {
    deliveries: ['create', 'read', 'update', 'delete'],
    payments: ['read', 'update'],
    users: ['read', 'update', 'delete'],
    analytics: ['read'],
    audit: ['read']
  }
}

// Check specific permission
const requirePermission = (resource, action) => {
  return async (req, res, next) => {
    try {
      const userType = req.user.userType
      const userPermissions = permissions[userType]

      if (!userPermissions || !userPermissions[resource]) {
        await logSecurityEvent({
          userId: req.user.userId,
          eventType: 'UNAUTHORIZED_ACCESS',
          severity: 'high',
          description: `No permissions for resource: ${resource}`,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          metadata: { resource, action, userType }
        })
        return res.status(403).json({ error: 'Access denied' })
      }

      const hasPermission = userPermissions[resource].includes(action)

      if (!hasPermission) {
        await logSecurityEvent({
          userId: req.user.userId,
          eventType: 'UNAUTHORIZED_ACCESS',
          severity: 'high',
          description: `Insufficient permissions for ${action} on ${resource}`,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          metadata: { resource, action, userType }
        })
        return res.status(403).json({ error: 'Insufficient permissions' })
      }

      next()
    } catch (error) {
      console.error('Permission check error:', error)
      res.status(500).json({ error: 'Permission check failed' })
    }
  }
}

// Context-aware access control
const contextualAccess = (resourceType) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.userId
      const userType = req.user.userType

      // Additional context checks based on resource and user type
      switch (resourceType) {
        case 'delivery_update':
          // Only allow status updates based on current status and user role
          const deliveryId = req.params.id
          const delivery = await prisma.delivery.findUnique({
            where: { id: deliveryId },
            select: { status: true, driverId: true, customerId: true }
          })

          if (!delivery) {
            return res.status(404).json({ error: 'Delivery not found' })
          }

          const newStatus = req.body.status
          const validTransitions = getValidStatusTransitions(delivery.status, userType, userId, delivery)

          if (newStatus && !validTransitions.includes(newStatus)) {
            await logSecurityEvent({
              userId,
              eventType: 'INVALID_STATE_TRANSITION',
              severity: 'high',
              description: `Invalid status transition: ${delivery.status} -> ${newStatus}`,
              ipAddress: req.ip,
              userAgent: req.get('User-Agent'),
              metadata: { deliveryId, currentStatus: delivery.status, newStatus }
            })
            return res.status(400).json({ error: 'Invalid status transition' })
          }
          break

        case 'payment_create':
          // Ensure payment amount matches delivery fare
          const paymentDeliveryId = req.body.deliveryId
          const paymentDelivery = await prisma.delivery.findUnique({
            where: { id: paymentDeliveryId },
            select: { totalFare: true, customerId: true, status: true }
          })

          if (!paymentDelivery) {
            return res.status(404).json({ error: 'Delivery not found' })
          }

          if (paymentDelivery.customerId !== userId) {
            return res.status(403).json({ error: 'Not your delivery' })
          }

          if (paymentDelivery.status !== 'DELIVERED') {
            return res.status(400).json({ error: 'Cannot pay for undelivered package' })
          }

          if (Math.abs(req.body.amount - paymentDelivery.totalFare) > 0.01) {
            await logSecurityEvent({
              userId,
              eventType: 'PAYMENT_AMOUNT_MISMATCH',
              severity: 'critical',
              description: 'Payment amount does not match delivery fare',
              ipAddress: req.ip,
              userAgent: req.get('User-Agent'),
              metadata: { 
                deliveryId: paymentDeliveryId,
                expectedAmount: paymentDelivery.totalFare,
                providedAmount: req.body.amount
              }
            })
            return res.status(400).json({ error: 'Payment amount mismatch' })
          }
          break
      }

      next()
    } catch (error) {
      console.error('Contextual access error:', error)
      res.status(500).json({ error: 'Access verification failed' })
    }
  }
}

// Valid status transitions based on user role
const getValidStatusTransitions = (currentStatus, userType, userId, delivery) => {
  const transitions = {
    PENDING: {
      DRIVER: delivery.driverId === userId ? ['ACCEPTED'] : [],
      CUSTOMER: delivery.customerId === userId ? ['CANCELLED'] : [],
      ADMIN: ['ACCEPTED', 'CANCELLED']
    },
    ACCEPTED: {
      DRIVER: delivery.driverId === userId ? ['PICKED_UP', 'CANCELLED'] : [],
      CUSTOMER: [],
      ADMIN: ['PICKED_UP', 'CANCELLED']
    },
    PICKED_UP: {
      DRIVER: delivery.driverId === userId ? ['IN_TRANSIT'] : [],
      CUSTOMER: [],
      ADMIN: ['IN_TRANSIT']
    },
    IN_TRANSIT: {
      DRIVER: delivery.driverId === userId ? ['DELIVERED'] : [],
      CUSTOMER: [],
      ADMIN: ['DELIVERED']
    },
    DELIVERED: {
      DRIVER: [],
      CUSTOMER: [],
      ADMIN: []
    },
    CANCELLED: {
      DRIVER: [],
      CUSTOMER: [],
      ADMIN: []
    }
  }

  return transitions[currentStatus]?.[userType] || []
}

module.exports = {
  verifyOwnership,
  requirePermission,
  contextualAccess,
  permissions
}