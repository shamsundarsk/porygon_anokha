const crypto = require('crypto')
const { prisma } = require('../database/connection')
const { logSecurityEvent } = require('../services/audit')

// In-memory cache for recent requests (use Redis in production)
const requestCache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Generate request signature
const generateRequestSignature = (req) => {
  const data = {
    method: req.method,
    path: req.path,
    body: req.body,
    userId: req.user?.userId,
    timestamp: Math.floor(Date.now() / 1000) // Round to seconds
  }
  
  const dataString = JSON.stringify(data, Object.keys(data).sort())
  return crypto.createHash('sha256').update(dataString).digest('hex')
}

// Replay protection middleware
const preventReplay = (options = {}) => {
  const {
    windowMs = 5 * 60 * 1000, // 5 minutes
    requireTimestamp = true,
    requireNonce = false
  } = options

  return async (req, res, next) => {
    try {
      // Skip for GET requests (idempotent by nature)
      if (req.method === 'GET') {
        return next()
      }

      // Check for timestamp header
      if (requireTimestamp) {
        const timestamp = req.headers['x-timestamp']
        if (!timestamp) {
          return res.status(400).json({ error: 'Timestamp header required' })
        }

        const requestTime = parseInt(timestamp) * 1000
        const now = Date.now()
        const timeDiff = Math.abs(now - requestTime)

        // Reject requests older than window or too far in future
        if (timeDiff > windowMs) {
          await logSecurityEvent({
            userId: req.user?.userId,
            eventType: 'REPLAY_ATTACK_ATTEMPT',
            severity: 'high',
            description: 'Request with invalid timestamp detected',
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            metadata: { 
              timestamp,
              timeDiff,
              windowMs
            }
          })
          return res.status(400).json({ error: 'Request timestamp invalid' })
        }
      }

      // Check for nonce header (for critical operations)
      if (requireNonce) {
        const nonce = req.headers['x-nonce']
        if (!nonce) {
          return res.status(400).json({ error: 'Nonce header required' })
        }

        // Check if nonce was already used
        const nonceKey = `nonce:${req.user?.userId}:${nonce}`
        if (requestCache.has(nonceKey)) {
          await logSecurityEvent({
            userId: req.user?.userId,
            eventType: 'REPLAY_ATTACK_ATTEMPT',
            severity: 'critical',
            description: 'Duplicate nonce detected',
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            metadata: { nonce }
          })
          return res.status(400).json({ error: 'Nonce already used' })
        }

        // Store nonce
        requestCache.set(nonceKey, true)
        setTimeout(() => requestCache.delete(nonceKey), windowMs)
      }

      // Generate request signature
      const signature = generateRequestSignature(req)
      const cacheKey = `req:${signature}`

      // Check if request was already processed
      if (requestCache.has(cacheKey)) {
        const cachedData = requestCache.get(cacheKey)
        
        await logSecurityEvent({
          userId: req.user?.userId,
          eventType: 'REPLAY_ATTACK_ATTEMPT',
          severity: 'high',
          description: 'Duplicate request detected',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          metadata: { 
            signature,
            originalTimestamp: cachedData.timestamp
          }
        })
        
        return res.status(409).json({ error: 'Duplicate request' })
      }

      // Store request signature
      requestCache.set(cacheKey, {
        timestamp: Date.now(),
        userId: req.user?.userId,
        path: req.path
      })

      // Clean up expired entries
      setTimeout(() => requestCache.delete(cacheKey), windowMs)

      next()
    } catch (error) {
      console.error('Replay protection error:', error)
      next() // Don't block request for replay protection errors
    }
  }
}

// Strict replay protection for critical operations
const strictReplayProtection = preventReplay({
  windowMs: 2 * 60 * 1000, // 2 minutes
  requireTimestamp: true,
  requireNonce: true
})

// Standard replay protection
const standardReplayProtection = preventReplay({
  windowMs: 5 * 60 * 1000, // 5 minutes
  requireTimestamp: true,
  requireNonce: false
})

// Payment-specific replay protection
const paymentReplayProtection = async (req, res, next) => {
  try {
    const { deliveryId, amount, method } = req.body
    const userId = req.user.userId

    // Create payment-specific signature
    const paymentData = {
      userId,
      deliveryId,
      amount: Math.round(amount * 100), // Convert to paisa for consistency
      method,
      timestamp: Math.floor(Date.now() / (60 * 1000)) // Round to minutes
    }

    const paymentSignature = crypto
      .createHash('sha256')
      .update(JSON.stringify(paymentData, Object.keys(paymentData).sort()))
      .digest('hex')

    const cacheKey = `payment:${paymentSignature}`

    // Check for duplicate payment attempt
    if (requestCache.has(cacheKey)) {
      await logSecurityEvent({
        userId,
        eventType: 'DUPLICATE_PAYMENT_ATTEMPT',
        severity: 'critical',
        description: 'Duplicate payment request detected',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { 
          deliveryId,
          amount,
          method,
          signature: paymentSignature
        }
      })
      return res.status(409).json({ error: 'Duplicate payment request' })
    }

    // Store payment signature for 10 minutes
    requestCache.set(cacheKey, {
      timestamp: Date.now(),
      userId,
      deliveryId
    })
    setTimeout(() => requestCache.delete(cacheKey), 10 * 60 * 1000)

    next()
  } catch (error) {
    console.error('Payment replay protection error:', error)
    next()
  }
}

// Webhook replay protection
const webhookReplayProtection = async (req, res, next) => {
  try {
    const webhookId = req.headers['x-webhook-id'] || req.body.id
    const timestamp = req.headers['x-timestamp'] || req.body.created_at

    if (!webhookId) {
      return res.status(400).json({ error: 'Webhook ID required' })
    }

    // Check if webhook was already processed
    const existingWebhook = await prisma.processedWebhook.findUnique({
      where: { webhookId }
    })

    if (existingWebhook) {
      await logSecurityEvent({
        eventType: 'WEBHOOK_REPLAY_ATTEMPT',
        severity: 'medium',
        description: 'Duplicate webhook detected',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { 
          webhookId,
          originalProcessedAt: existingWebhook.processedAt
        }
      })
      return res.status(200).json({ message: 'Webhook already processed' })
    }

    // Store webhook ID
    await prisma.processedWebhook.create({
      data: {
        webhookId,
        processedAt: new Date(),
        source: req.headers['user-agent'] || 'unknown'
      }
    })

    next()
  } catch (error) {
    console.error('Webhook replay protection error:', error)
    next()
  }
}

// Clean up expired cache entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of requestCache.entries()) {
    if (value.timestamp && (now - value.timestamp) > CACHE_TTL) {
      requestCache.delete(key)
    }
  }
}, 60 * 1000) // Clean up every minute

module.exports = {
  preventReplay,
  strictReplayProtection,
  standardReplayProtection,
  paymentReplayProtection,
  webhookReplayProtection
}