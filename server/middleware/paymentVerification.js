const crypto = require('crypto')
const { prisma } = require('../database/connection')
const { logSecurityEvent, logAuditEvent } = require('../services/audit')

// Verify Razorpay webhook signature
const verifyRazorpayWebhook = (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature']
    const body = req.rawBody || JSON.stringify(req.body)
    
    if (!signature) {
      logSecurityEvent({
        eventType: 'WEBHOOK_VERIFICATION_FAILED',
        severity: 'high',
        description: 'Missing webhook signature',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      })
      return res.status(400).json({ error: 'Missing signature' })
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest('hex')

    if (signature !== expectedSignature) {
      logSecurityEvent({
        eventType: 'WEBHOOK_VERIFICATION_FAILED',
        severity: 'critical',
        description: 'Invalid webhook signature',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { providedSignature: signature }
      })
      return res.status(400).json({ error: 'Invalid signature' })
    }

    next()
  } catch (error) {
    console.error('Webhook verification error:', error)
    res.status(500).json({ error: 'Verification failed' })
  }
}

// Verify payment amount matches delivery fare
const verifyPaymentAmount = async (req, res, next) => {
  try {
    const { deliveryId, amount } = req.body
    
    if (!deliveryId || !amount) {
      return res.status(400).json({ error: 'Delivery ID and amount required' })
    }

    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      select: { 
        id: true,
        totalFare: true, 
        customerId: true, 
        status: true,
        paymentStatus: true
      }
    })

    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' })
    }

    // Verify ownership
    if (delivery.customerId !== req.user.userId && req.user.userType !== 'ADMIN') {
      await logSecurityEvent({
        userId: req.user.userId,
        eventType: 'UNAUTHORIZED_PAYMENT',
        severity: 'critical',
        description: 'Attempted payment for delivery not owned by user',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { deliveryId, actualCustomerId: delivery.customerId }
      })
      return res.status(403).json({ error: 'Unauthorized' })
    }

    // Verify delivery status
    if (delivery.status !== 'DELIVERED') {
      return res.status(400).json({ error: 'Cannot pay for undelivered package' })
    }

    // Verify payment not already completed
    if (delivery.paymentStatus === 'COMPLETED') {
      return res.status(400).json({ error: 'Payment already completed' })
    }

    // Verify amount matches (allow 1 paisa tolerance for rounding)
    const expectedAmount = Math.round(delivery.totalFare * 100) // Convert to paisa
    const providedAmount = Math.round(amount * 100)
    
    if (Math.abs(expectedAmount - providedAmount) > 1) {
      await logSecurityEvent({
        userId: req.user.userId,
        eventType: 'PAYMENT_AMOUNT_MANIPULATION',
        severity: 'critical',
        description: 'Payment amount does not match delivery fare',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { 
          deliveryId,
          expectedAmount: delivery.totalFare,
          providedAmount: amount,
          difference: Math.abs(delivery.totalFare - amount)
        }
      })
      return res.status(400).json({ error: 'Payment amount mismatch' })
    }

    req.verifiedDelivery = delivery
    next()
  } catch (error) {
    console.error('Payment amount verification error:', error)
    res.status(500).json({ error: 'Payment verification failed' })
  }
}

// Prevent duplicate payments
const preventDuplicatePayment = async (req, res, next) => {
  try {
    const { deliveryId } = req.body
    
    // Check for existing successful payment
    const existingPayment = await prisma.payment.findFirst({
      where: {
        deliveryId,
        status: { in: ['COMPLETED', 'PROCESSING'] }
      }
    })

    if (existingPayment) {
      await logSecurityEvent({
        userId: req.user.userId,
        eventType: 'DUPLICATE_PAYMENT_ATTEMPT',
        severity: 'high',
        description: 'Attempted duplicate payment for delivery',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { 
          deliveryId,
          existingPaymentId: existingPayment.id,
          existingPaymentStatus: existingPayment.status
        }
      })
      return res.status(400).json({ error: 'Payment already exists for this delivery' })
    }

    next()
  } catch (error) {
    console.error('Duplicate payment check error:', error)
    res.status(500).json({ error: 'Payment verification failed' })
  }
}

// Verify payment gateway response
const verifyGatewayResponse = async (paymentData) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = paymentData
    
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      throw new Error('Missing payment verification data')
    }

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex')

    if (razorpay_signature !== expectedSignature) {
      await logSecurityEvent({
        eventType: 'PAYMENT_SIGNATURE_VERIFICATION_FAILED',
        severity: 'critical',
        description: 'Payment signature verification failed',
        metadata: { 
          razorpay_payment_id,
          razorpay_order_id,
          providedSignature: razorpay_signature
        }
      })
      throw new Error('Payment signature verification failed')
    }

    return true
  } catch (error) {
    console.error('Gateway response verification error:', error)
    throw error
  }
}

// Track payment attempts for fraud detection
const trackPaymentAttempt = async (req, res, next) => {
  try {
    const userId = req.user.userId
    const ipAddress = req.ip
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

    // Count recent payment attempts
    const recentAttempts = await prisma.payment.count({
      where: {
        userId,
        createdAt: { gte: oneHourAgo }
      }
    })

    // Check for suspicious patterns
    if (recentAttempts >= 10) {
      await logSecurityEvent({
        userId,
        eventType: 'SUSPICIOUS_PAYMENT_ACTIVITY',
        severity: 'high',
        description: 'Excessive payment attempts detected',
        ipAddress,
        userAgent: req.get('User-Agent'),
        metadata: { attemptCount: recentAttempts }
      })
      
      return res.status(429).json({ 
        error: 'Too many payment attempts. Please try again later.' 
      })
    }

    // Check for rapid-fire attempts (more than 3 in 5 minutes)
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
    const rapidAttempts = await prisma.payment.count({
      where: {
        userId,
        createdAt: { gte: fiveMinutesAgo }
      }
    })

    if (rapidAttempts >= 3) {
      await logSecurityEvent({
        userId,
        eventType: 'RAPID_PAYMENT_ATTEMPTS',
        severity: 'medium',
        description: 'Rapid payment attempts detected',
        ipAddress,
        userAgent: req.get('User-Agent'),
        metadata: { attemptCount: rapidAttempts }
      })
    }

    next()
  } catch (error) {
    console.error('Payment attempt tracking error:', error)
    next() // Don't block payment for tracking errors
  }
}

// Validate payment method
const validatePaymentMethod = (req, res, next) => {
  const { method } = req.body
  const allowedMethods = ['RAZORPAY', 'UPI', 'CARD', 'NETBANKING', 'WALLET']
  
  if (!method || !allowedMethods.includes(method)) {
    return res.status(400).json({ 
      error: 'Invalid payment method',
      allowedMethods 
    })
  }
  
  next()
}

module.exports = {
  verifyRazorpayWebhook,
  verifyPaymentAmount,
  preventDuplicatePayment,
  verifyGatewayResponse,
  trackPaymentAttempt,
  validatePaymentMethod
}