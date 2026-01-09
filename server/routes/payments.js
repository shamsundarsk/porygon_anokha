const express = require('express')
const { prisma } = require('../database/connection')
const { authenticateToken, requireRole } = require('../middleware/auth')
const { verifyOwnership } = require('../middleware/rbac')
const { 
  verifyPaymentAmount, 
  preventDuplicatePayment, 
  trackPaymentAttempt,
  validatePaymentMethod,
  verifyRazorpayWebhook
} = require('../middleware/paymentVerification')
const { 
  ensureIdempotency, 
  storeIdempotentResult,
  validatePaymentTransition 
} = require('../middleware/stateMachine')
const { logAuditEvent, logSecurityEvent } = require('../services/audit')

const router = express.Router()

// Create payment intent - SERVER CALCULATES AMOUNT
router.post('/create-intent', 
  authenticateToken,
  requireRole(['CUSTOMER', 'BUSINESS']),
  ensureIdempotency,
  trackPaymentAttempt,
  verifyPaymentAmount,
  preventDuplicatePayment,
  validatePaymentMethod,
  async (req, res) => {
    try {
      const { deliveryId, method } = req.body
      const userId = req.user.userId

      // Get delivery details (already verified by middleware)
      const delivery = req.verifiedDelivery

      // Server calculates final amount - frontend NEVER sends amount
      const finalAmount = Math.round(delivery.totalFare * 100) / 100 // Round to 2 decimals
      
      // Create payment record in PENDING state
      const payment = await prisma.payment.create({
        data: {
          deliveryId,
          userId,
          amount: finalAmount, // SERVER-CALCULATED AMOUNT
          currency: 'INR',
          method,
          status: 'PENDING',
          razorpayOrderId: `order_${Math.random().toString(36).substr(2, 9)}`, // Demo order ID
          metadata: {
            userAgent: req.get('User-Agent'),
            ipAddress: req.ip,
            calculatedAt: new Date().toISOString()
          }
        }
      })

      // Create Razorpay order (demo implementation)
      const paymentIntent = {
        id: payment.razorpayOrderId,
        amount: finalAmount * 100, // Razorpay expects amount in paisa
        currency: 'INR',
        status: 'created',
        deliveryId,
        paymentId: payment.id
      }

      await logAuditEvent({
        userId,
        action: 'CREATE',
        resource: 'payment_intent',
        resourceId: payment.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { 
          deliveryId, 
          amount: finalAmount,
          method 
        }
      })

      // Store idempotent result
      await storeIdempotentResult(req, res, paymentIntent, 201)

      res.status(201).json(paymentIntent)
    } catch (error) {
      console.error('Create payment intent error:', error)
      res.status(500).json({ error: 'Failed to create payment intent' })
    }
  }
)

// Verify payment - ONLY CALLED BY PAYMENT GATEWAY WEBHOOK
router.post('/verify', 
  verifyRazorpayWebhook,
  async (req, res) => {
    try {
      const { 
        razorpay_payment_id, 
        razorpay_order_id, 
        razorpay_signature,
        event 
      } = req.body

      // Find payment by order ID
      const payment = await prisma.payment.findFirst({
        where: { razorpayOrderId: razorpay_order_id },
        include: {
          delivery: {
            select: { 
              id: true, 
              status: true, 
              customerId: true,
              totalFare: true 
            }
          }
        }
      })

      if (!payment) {
        await logSecurityEvent({
          eventType: 'PAYMENT_VERIFICATION_FAILED',
          severity: 'high',
          description: 'Payment verification for unknown order',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          metadata: { razorpay_order_id }
        })
        return res.status(404).json({ error: 'Payment not found' })
      }

      // Verify delivery is in correct state for payment
      if (payment.delivery.status !== 'DELIVERED') {
        await logSecurityEvent({
          userId: payment.userId,
          eventType: 'PAYMENT_FOR_UNDELIVERED',
          severity: 'critical',
          description: 'Payment attempted for undelivered package',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          metadata: { 
            deliveryId: payment.deliveryId,
            deliveryStatus: payment.delivery.status,
            paymentId: payment.id
          }
        })
        return res.status(400).json({ error: 'Cannot process payment for undelivered package' })
      }

      // Verify amount hasn't been tampered with
      const expectedAmount = Math.round(payment.delivery.totalFare * 100) / 100
      if (Math.abs(payment.amount - expectedAmount) > 0.01) {
        await logSecurityEvent({
          userId: payment.userId,
          eventType: 'PAYMENT_AMOUNT_TAMPERING',
          severity: 'critical',
          description: 'Payment amount tampering detected',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          metadata: { 
            paymentId: payment.id,
            storedAmount: payment.amount,
            expectedAmount,
            difference: Math.abs(payment.amount - expectedAmount)
          }
        })
        return res.status(400).json({ error: 'Payment amount verification failed' })
      }

      // Update payment status based on webhook event
      let newStatus = 'PROCESSING'
      if (event === 'payment.captured') {
        newStatus = 'COMPLETED'
      } else if (event === 'payment.failed') {
        newStatus = 'FAILED'
      }

      const updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: newStatus,
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          verifiedAt: new Date(),
          metadata: {
            ...payment.metadata,
            webhookEvent: event,
            verifiedAt: new Date().toISOString()
          }
        }
      })

      // Update delivery payment status
      if (newStatus === 'COMPLETED') {
        await prisma.delivery.update({
          where: { id: payment.deliveryId },
          data: { paymentStatus: 'COMPLETED' }
        })
      }

      await logAuditEvent({
        userId: payment.userId,
        action: 'UPDATE',
        resource: 'payment_status',
        resourceId: payment.id,
        oldValues: { status: payment.status },
        newValues: { status: newStatus },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { 
          razorpay_payment_id,
          event 
        }
      })

      // Notify customer via socket
      if (global.io && newStatus === 'COMPLETED') {
        global.io.to(`delivery-${payment.deliveryId}`).emit('payment-completed', {
          deliveryId: payment.deliveryId,
          paymentId: payment.id,
          amount: payment.amount,
          timestamp: new Date()
        })
      }

      res.json({ 
        success: true, 
        paymentId: payment.id,
        status: newStatus 
      })
    } catch (error) {
      console.error('Payment verification error:', error)
      await logSecurityEvent({
        eventType: 'PAYMENT_VERIFICATION_ERROR',
        severity: 'high',
        description: 'Payment verification failed',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { error: error.message }
      })
      res.status(500).json({ error: 'Payment verification failed' })
    }
  }
)

// Get user's payments - MOVED BEFORE WILDCARD ROUTE
router.get('/my-payments', authenticateToken, async (req, res) => {
  try {
    let whereClause = { userId: req.user.userId }
    
    // Admin can see all payments
    if (req.user.userType === 'ADMIN') {
      whereClause = {}
    }

    const payments = await prisma.payment.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        delivery: {
          select: {
            id: true,
            orderId: true,
            status: true,
            pickupAddress: true,
            deliveryAddress: true
          }
        }
      }
    })

    res.json(payments)
  } catch (error) {
    console.error('Get payments error:', error)
    res.status(500).json({ error: 'Failed to get payments' })
  }
})

// Get payment details (with ownership verification)
router.get('/:id', 
  authenticateToken,
  verifyOwnership('payment'),
  async (req, res) => {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: req.params.id },
        include: {
          delivery: {
            select: {
              id: true,
              orderId: true,
              status: true,
              pickupAddress: true,
              deliveryAddress: true
            }
          }
        }
      })

      if (!payment) {
        return res.status(404).json({ error: 'Payment not found' })
      }

      res.json(payment)
    } catch (error) {
      console.error('Get payment error:', error)
      res.status(500).json({ error: 'Failed to get payment' })
    }
  }
)

// Refund payment (ADMIN only)
router.post('/:id/refund', 
  authenticateToken,
  requireRole(['ADMIN']),
  validatePaymentTransition,
  async (req, res) => {
    try {
      const paymentId = req.params.id
      const { reason } = req.body

      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        select: { 
          id: true, 
          status: true, 
          amount: true,
          deliveryId: true,
          userId: true
        }
      })

      if (!payment) {
        return res.status(404).json({ error: 'Payment not found' })
      }

      if (payment.status !== 'COMPLETED') {
        return res.status(400).json({ error: 'Can only refund completed payments' })
      }

      // Process refund (demo implementation)
      const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'REFUNDED',
          refundedAt: new Date(),
          refundReason: reason,
          refundedBy: req.user.userId
        }
      })

      // Update delivery payment status
      await prisma.delivery.update({
        where: { id: payment.deliveryId },
        data: { paymentStatus: 'REFUNDED' }
      })

      await logAuditEvent({
        userId: req.user.userId,
        action: 'UPDATE',
        resource: 'payment_refund',
        resourceId: paymentId,
        oldValues: { status: 'COMPLETED' },
        newValues: { status: 'REFUNDED' },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { reason, amount: payment.amount }
      })

      res.json(updatedPayment)
    } catch (error) {
      console.error('Refund payment error:', error)
      res.status(500).json({ error: 'Failed to refund payment' })
    }
  }
)

module.exports = router