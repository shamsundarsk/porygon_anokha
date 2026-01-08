const { logSecurityEvent, logAuditEvent } = require('../services/audit')
const { prisma } = require('../database/connection')

// Delivery state machine
const DELIVERY_STATES = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED', 
  PICKED_UP: 'PICKED_UP',
  IN_TRANSIT: 'IN_TRANSIT',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED'
}

const PAYMENT_STATES = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
  DISPUTED: 'DISPUTED'
}

// Valid state transitions with role-based permissions
const DELIVERY_TRANSITIONS = {
  [DELIVERY_STATES.PENDING]: {
    [DELIVERY_STATES.ACCEPTED]: ['DRIVER', 'ADMIN'],
    [DELIVERY_STATES.CANCELLED]: ['CUSTOMER', 'ADMIN']
  },
  [DELIVERY_STATES.ACCEPTED]: {
    [DELIVERY_STATES.PICKED_UP]: ['DRIVER', 'ADMIN'],
    [DELIVERY_STATES.CANCELLED]: ['DRIVER', 'CUSTOMER', 'ADMIN']
  },
  [DELIVERY_STATES.PICKED_UP]: {
    [DELIVERY_STATES.IN_TRANSIT]: ['DRIVER', 'ADMIN']
  },
  [DELIVERY_STATES.IN_TRANSIT]: {
    [DELIVERY_STATES.DELIVERED]: ['DRIVER', 'ADMIN']
  },
  [DELIVERY_STATES.DELIVERED]: {
    // Final state - no transitions allowed
  },
  [DELIVERY_STATES.CANCELLED]: {
    // Final state - no transitions allowed
  }
}

const PAYMENT_TRANSITIONS = {
  [PAYMENT_STATES.PENDING]: {
    [PAYMENT_STATES.PROCESSING]: ['CUSTOMER', 'SYSTEM', 'ADMIN'],
    [PAYMENT_STATES.FAILED]: ['SYSTEM', 'ADMIN']
  },
  [PAYMENT_STATES.PROCESSING]: {
    [PAYMENT_STATES.COMPLETED]: ['SYSTEM', 'ADMIN'],
    [PAYMENT_STATES.FAILED]: ['SYSTEM', 'ADMIN']
  },
  [PAYMENT_STATES.COMPLETED]: {
    [PAYMENT_STATES.REFUNDED]: ['ADMIN'],
    [PAYMENT_STATES.DISPUTED]: ['CUSTOMER', 'ADMIN']
  },
  [PAYMENT_STATES.FAILED]: {
    [PAYMENT_STATES.PENDING]: ['CUSTOMER', 'ADMIN']
  },
  [PAYMENT_STATES.REFUNDED]: {
    // Final state - no transitions allowed
  },
  [PAYMENT_STATES.DISPUTED]: {
    [PAYMENT_STATES.COMPLETED]: ['ADMIN'],
    [PAYMENT_STATES.REFUNDED]: ['ADMIN']
  }
}

// Validate delivery state transition
const validateDeliveryTransition = async (req, res, next) => {
  try {
    const deliveryId = req.params.id
    const newStatus = req.body.status
    const userId = req.user.userId
    const userType = req.user.userType

    if (!newStatus) {
      return next() // No status change
    }

    // Get current delivery state
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      select: {
        id: true,
        status: true,
        customerId: true,
        driverId: true,
        businessId: true,
        totalFare: true
      }
    })

    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' })
    }

    const currentStatus = delivery.status
    const validTransitions = DELIVERY_TRANSITIONS[currentStatus] || {}
    const allowedRoles = validTransitions[newStatus] || []

    // Check if transition is valid
    if (!allowedRoles.length) {
      await logSecurityEvent({
        userId,
        eventType: 'INVALID_STATE_TRANSITION',
        severity: 'high',
        description: `Invalid delivery transition: ${currentStatus} -> ${newStatus}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { deliveryId, currentStatus, newStatus }
      })
      return res.status(400).json({ error: 'Invalid state transition' })
    }

    // Check if user has permission for this transition
    let hasPermission = allowedRoles.includes(userType)

    // Additional ownership checks for non-admin users
    if (!hasPermission && userType !== 'ADMIN') {
      if (userType === 'DRIVER' && delivery.driverId === userId) {
        hasPermission = allowedRoles.includes('DRIVER')
      } else if (userType === 'CUSTOMER' && delivery.customerId === userId) {
        hasPermission = allowedRoles.includes('CUSTOMER')
      } else if (userType === 'BUSINESS' && delivery.businessId === userId) {
        hasPermission = allowedRoles.includes('BUSINESS')
      }
    }

    if (!hasPermission) {
      await logSecurityEvent({
        userId,
        eventType: 'UNAUTHORIZED_STATE_TRANSITION',
        severity: 'high',
        description: `Unauthorized delivery transition attempt: ${currentStatus} -> ${newStatus}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { deliveryId, currentStatus, newStatus, userType }
      })
      return res.status(403).json({ error: 'Unauthorized state transition' })
    }

    // Additional business logic validations
    if (newStatus === DELIVERY_STATES.DELIVERED) {
      // Ensure driver is at delivery location (simplified check)
      const { deliveryLat, deliveryLng } = delivery
      // In production, verify GPS location matches delivery address
    }

    // Log successful state transition
    await logAuditEvent({
      userId,
      deliveryId,
      action: 'UPDATE',
      resource: 'delivery_status',
      resourceId: deliveryId,
      oldValues: { status: currentStatus },
      newValues: { status: newStatus },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    })

    req.stateTransition = {
      resource: 'delivery',
      from: currentStatus,
      to: newStatus,
      validated: true
    }

    next()
  } catch (error) {
    console.error('Delivery state validation error:', error)
    res.status(500).json({ error: 'State validation failed' })
  }
}

// Validate payment state transition
const validatePaymentTransition = async (req, res, next) => {
  try {
    const paymentId = req.params.id
    const newStatus = req.body.status
    const userId = req.user.userId
    const userType = req.user.userType

    if (!newStatus) {
      return next() // No status change
    }

    // Get current payment state
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        delivery: {
          select: { customerId: true, driverId: true, businessId: true }
        }
      }
    })

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' })
    }

    const currentStatus = payment.status
    const validTransitions = PAYMENT_TRANSITIONS[currentStatus] || {}
    const allowedRoles = validTransitions[newStatus] || []

    // Check if transition is valid
    if (!allowedRoles.length) {
      await logSecurityEvent({
        userId,
        eventType: 'INVALID_PAYMENT_TRANSITION',
        severity: 'critical',
        description: `Invalid payment transition: ${currentStatus} -> ${newStatus}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { paymentId, currentStatus, newStatus }
      })
      return res.status(400).json({ error: 'Invalid payment state transition' })
    }

    // Check permissions
    let hasPermission = allowedRoles.includes(userType) || allowedRoles.includes('SYSTEM')

    // Additional ownership checks
    if (!hasPermission && userType !== 'ADMIN') {
      if (userType === 'CUSTOMER' && payment.delivery.customerId === userId) {
        hasPermission = allowedRoles.includes('CUSTOMER')
      }
    }

    if (!hasPermission) {
      await logSecurityEvent({
        userId,
        eventType: 'UNAUTHORIZED_PAYMENT_TRANSITION',
        severity: 'critical',
        description: `Unauthorized payment transition: ${currentStatus} -> ${newStatus}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { paymentId, currentStatus, newStatus, userType }
      })
      return res.status(403).json({ error: 'Unauthorized payment transition' })
    }

    // Log payment state change
    await logAuditEvent({
      userId,
      action: 'UPDATE',
      resource: 'payment_status',
      resourceId: paymentId,
      oldValues: { status: currentStatus },
      newValues: { status: newStatus },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    })

    req.stateTransition = {
      resource: 'payment',
      from: currentStatus,
      to: newStatus,
      validated: true
    }

    next()
  } catch (error) {
    console.error('Payment state validation error:', error)
    res.status(500).json({ error: 'Payment state validation failed' })
  }
}

// Idempotency key middleware for payments
const ensureIdempotency = async (req, res, next) => {
  try {
    const idempotencyKey = req.headers['idempotency-key']
    
    if (!idempotencyKey) {
      return res.status(400).json({ error: 'Idempotency-Key header required for payment operations' })
    }

    // Check if this operation was already processed
    const existingOperation = await prisma.idempotentOperation.findUnique({
      where: { 
        key: idempotencyKey,
        userId: req.user.userId
      }
    })

    if (existingOperation) {
      // Return the previous result
      return res.status(existingOperation.statusCode).json(existingOperation.response)
    }

    // Store the idempotency key for this request
    req.idempotencyKey = idempotencyKey
    next()
  } catch (error) {
    console.error('Idempotency check error:', error)
    res.status(500).json({ error: 'Idempotency check failed' })
  }
}

// Store idempotent operation result
const storeIdempotentResult = async (req, res, result, statusCode = 200) => {
  try {
    if (req.idempotencyKey) {
      await prisma.idempotentOperation.create({
        data: {
          key: req.idempotencyKey,
          userId: req.user.userId,
          response: result,
          statusCode,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        }
      })
    }
  } catch (error) {
    console.error('Failed to store idempotent result:', error)
  }
}

module.exports = {
  DELIVERY_STATES,
  PAYMENT_STATES,
  validateDeliveryTransition,
  validatePaymentTransition,
  ensureIdempotency,
  storeIdempotentResult
}