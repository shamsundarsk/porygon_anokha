const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const slowDown = require('express-slow-down')
const hpp = require('hpp')
const { body, validationResult } = require('express-validator')
const Redis = require('ioredis')
const { prisma } = require('../database/connection')

// Simplified logging for now
const logSecurityEvent = async (data) => {
  console.log('Security Event:', data)
}

// Redis client for rate limiting (optional for development)
let redis = null
let RedisStore = null

try {
  if (process.env.REDIS_URL) {
    redis = new Redis(process.env.REDIS_URL)
    RedisStore = require('rate-limit-redis').default || require('rate-limit-redis')
  }
} catch (error) {
  console.warn('⚠️  Redis not available, using memory store for rate limiting')
}

// Security headers middleware
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "wss:", "ws:"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
})

// Global rate limiting
const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: redis && RedisStore ? new RedisStore({
    sendCommand: (...args) => redis.call(...args)
  }) : undefined,
  handler: async (req, res) => {
    await logSecurityEvent({
      eventType: 'RATE_LIMIT_EXCEEDED',
      severity: 'medium',
      description: `Global rate limit exceeded for IP: ${req.ip}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    })
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later',
      retryAfter: '15 minutes'
    })
  }
})

// Authentication rate limiting (stricter)
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Limit each IP to 3 auth requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later',
    retryAfter: '15 minutes'
  },
  skipSuccessfulRequests: true,
  store: redis && RedisStore ? new RedisStore({
    sendCommand: (...args) => redis.call(...args)
  }) : undefined,
  handler: async (req, res) => {
    await logSecurityEvent({
      eventType: 'RATE_LIMIT_EXCEEDED',
      severity: 'high',
      description: `Auth rate limit exceeded for IP: ${req.ip}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    })
    res.status(429).json({
      error: 'Too many authentication attempts, please try again later',
      retryAfter: '15 minutes'
    })
  }
})

// Payment rate limiting (very strict)
const paymentRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 2, // Limit each IP to 2 payment requests per minute
  message: {
    error: 'Too many payment attempts, please try again later',
    retryAfter: '1 minute'
  },
  store: redis && RedisStore ? new RedisStore({
    sendCommand: (...args) => redis.call(...args)
  }) : undefined,
  handler: async (req, res) => {
    await logSecurityEvent({
      eventType: 'RATE_LIMIT_EXCEEDED',
      severity: 'critical',
      description: `Payment rate limit exceeded for IP: ${req.ip}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      metadata: { userId: req.user?.userId }
    })
    res.status(429).json({
      error: 'Too many payment attempts, please try again later',
      retryAfter: '1 minute'
    })
  }
})

// Location update rate limiting
const locationRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 1 per second max
  message: {
    error: 'Too many location updates, please slow down',
    retryAfter: '1 minute'
  },
  store: redis && RedisStore ? new RedisStore({
    sendCommand: (...args) => redis.call(...args)
  }) : undefined
})

// File upload rate limiting
const uploadRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 uploads per minute
  message: {
    error: 'Too many file uploads, please wait',
    retryAfter: '1 minute'
  },
  store: redis && RedisStore ? new RedisStore({
    sendCommand: (...args) => redis.call(...args)
  }) : undefined
})

// Admin rate limiting
const adminRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // Limit each IP to 50 admin requests per 5 minutes
  message: {
    error: 'Too many admin requests, please try again later',
    retryAfter: '5 minutes'
  },
  store: redis && RedisStore ? new RedisStore({
    sendCommand: (...args) => redis.call(...args)
  }) : undefined
})

// Slow down middleware for suspicious activity
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 100, // Allow 100 requests per windowMs without delay
  delayMs: () => 500, // Add 500ms delay per request after delayAfter
  maxDelayMs: 20000, // Maximum delay of 20 seconds
  validate: { delayMs: false }, // Disable the warning
  store: redis && RedisStore ? new RedisStore({
    sendCommand: (...args) => redis.call(...args)
  }) : undefined
})

// Input validation middleware
const validateInput = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)))
    
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      await logSecurityEvent({
        eventType: 'SUSPICIOUS_ACTIVITY',
        severity: 'low',
        description: 'Invalid input detected',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { 
          errors: errors.array(),
          endpoint: req.path,
          userId: req.user?.userId
        }
      })
      
      // Sanitize error messages for production
      const sanitizedErrors = errors.array().map(error => ({
        field: error.param,
        message: error.msg,
        value: typeof error.value === 'string' ? error.value.substring(0, 50) : '[filtered]'
      }))
      
      return res.status(400).json({
        error: 'Invalid input',
        details: process.env.NODE_ENV === 'development' ? sanitizedErrors : 'Validation failed'
      })
    }
    
    next()
  }
}

// Enhanced validation schemas with stricter rules
const validationSchemas = {
  email: body('email')
    .isEmail()
    .normalizeEmail()
    .isLength({ max: 255 })
    .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
    .withMessage('Valid email is required'),
    
  phone: body('phone')
    .isMobilePhone('en-IN')
    .isLength({ min: 10, max: 13 })
    .withMessage('Valid Indian phone number is required'),
    
  password: body('password')
    .isLength({ min: 8, max: 128 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must be 8+ chars with uppercase, lowercase, number, and special character'),
    
  name: body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .matches(/^[a-zA-Z\s]+$/)
    .escape()
    .withMessage('Name must be 2-100 characters, letters only'),
    
  userType: body('userType')
    .isIn(['CUSTOMER', 'ENTERPRISE', 'DRIVER', 'ADMIN'])
    .withMessage('Invalid user type'),
    
  amount: body('amount')
    .isFloat({ min: 1, max: 100000 })
    .toFloat()
    .withMessage('Amount must be between ₹1 and ₹100,000'),
    
  coordinates: [
    body('lat').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
    body('lng').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude')
  ],

  address: body('address')
    .trim()
    .isLength({ min: 10, max: 500 })
    .escape()
    .withMessage('Address must be 10-500 characters'),

  deliveryId: body('deliveryId')
    .isUUID()
    .withMessage('Invalid delivery ID format'),

  paymentId: body('paymentId')
    .isUUID()
    .withMessage('Invalid payment ID format'),

  // Prevent XSS and injection attacks
  safeString: (field, min = 1, max = 255) => 
    body(field)
      .trim()
      .isLength({ min, max })
      .escape()
      .matches(/^[a-zA-Z0-9\s\-_.,!?]+$/)
      .withMessage(`${field} contains invalid characters`),

  // File upload validation
  fileUpload: body('file')
    .custom((value, { req }) => {
      if (!req.file) {
        throw new Error('File is required')
      }
      
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
      if (!allowedTypes.includes(req.file.mimetype)) {
        throw new Error('Invalid file type')
      }
      
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (req.file.size > maxSize) {
        throw new Error('File too large')
      }
      
      return true
    })
}

// Honeypot middleware
const honeypot = async (req, res, next) => {
  // Log honeypot access
  await prisma.honeypotLog.create({
    data: {
      endpoint: req.path,
      method: req.method,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      headers: req.headers,
      body: req.body
    }
  })
  
  await logSecurityEvent({
    eventType: 'SUSPICIOUS_ACTIVITY',
    severity: 'high',
    description: `Honeypot endpoint accessed: ${req.method} ${req.path}`,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  })
  
  // Return fake response to not reveal it's a honeypot
  res.status(404).json({ error: 'Not found' })
}

// Request sanitization
const sanitizeRequest = (req, res, next) => {
  // Remove null bytes
  const sanitize = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = obj[key].replace(/\0/g, '')
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key])
      }
    }
  }
  
  if (req.body) sanitize(req.body)
  if (req.query) sanitize(req.query)
  if (req.params) sanitize(req.params)
  
  next()
}

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || []
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true)
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  maxAge: 86400 // 24 hours
}

module.exports = {
  securityHeaders,
  globalRateLimit,
  authRateLimit,
  paymentRateLimit,
  locationRateLimit,
  uploadRateLimit,
  adminRateLimit,
  speedLimiter,
  validateInput,
  validationSchemas,
  honeypot,
  sanitizeRequest,
  corsOptions,
  hpp: hpp(),
  redis
}