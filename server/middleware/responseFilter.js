const { logSecurityEvent } = require('../services/audit')

// Data Transfer Object (DTO) filtering
const DTOs = {
  user: {
    public: ['id', 'name', 'email', 'userType', 'isVerified', 'createdAt'],
    private: ['id', 'name', 'email', 'phone', 'userType', 'isVerified', 'isActive', 'createdAt', 'updatedAt'],
    admin: ['id', 'name', 'email', 'phone', 'userType', 'isVerified', 'isActive', 'lastLogin', 'tokenVersion', 'createdAt', 'updatedAt']
  },
  
  delivery: {
    customer: ['id', 'status', 'pickupAddress', 'deliveryAddress', 'totalFare', 'estimatedTime', 'driverName', 'driverPhone', 'trackingCode', 'createdAt'],
    driver: ['id', 'status', 'pickupAddress', 'deliveryAddress', 'customerName', 'customerPhone', 'totalFare', 'driverFare', 'trackingCode', 'createdAt'],
    business: ['id', 'status', 'pickupAddress', 'deliveryAddress', 'totalFare', 'estimatedTime', 'driverName', 'customerName', 'trackingCode', 'createdAt'],
    admin: ['id', 'customerId', 'driverId', 'businessId', 'status', 'pickupAddress', 'deliveryAddress', 'totalFare', 'driverFare', 'platformFee', 'trackingCode', 'createdAt', 'updatedAt']
  },
  
  payment: {
    customer: ['id', 'amount', 'status', 'method', 'transactionId', 'createdAt'],
    driver: ['id', 'amount', 'status', 'createdAt'],
    admin: ['id', 'deliveryId', 'amount', 'status', 'method', 'transactionId', 'gatewayResponse', 'createdAt', 'updatedAt']
  },
  
  driverProfile: {
    public: ['userId', 'vehicleType', 'rating', 'totalDeliveries'],
    private: ['userId', 'vehicleType', 'vehicleNumber', 'licenseNumber', 'rating', 'totalDeliveries', 'isAvailable', 'currentLat', 'currentLng'],
    admin: ['userId', 'vehicleType', 'vehicleNumber', 'licenseNumber', 'rating', 'totalDeliveries', 'isAvailable', 'isVerified', 'currentLat', 'currentLng', 'createdAt', 'updatedAt']
  }
}

// Filter object based on allowed fields
const filterObject = (obj, allowedFields) => {
  if (!obj || typeof obj !== 'object') return obj
  
  const filtered = {}
  allowedFields.forEach(field => {
    if (obj.hasOwnProperty(field)) {
      filtered[field] = obj[field]
    }
  })
  return filtered
}

// Filter array of objects
const filterArray = (arr, allowedFields) => {
  if (!Array.isArray(arr)) return arr
  return arr.map(item => filterObject(item, allowedFields))
}

// Response filtering middleware
const filterResponse = (resourceType, context = 'private') => {
  return (req, res, next) => {
    const originalJson = res.json
    
    res.json = function(data) {
      try {
        // Determine context based on user role and ownership
        let filterContext = context
        
        if (req.user) {
          const userType = req.user.userType
          
          // Admin gets full access
          if (userType === 'ADMIN') {
            filterContext = 'admin'
          }
          // Business users get business context
          else if (userType === 'BUSINESS') {
            filterContext = 'business'
          }
          // Drivers get driver context for relevant resources
          else if (userType === 'DRIVER' && resourceType === 'delivery') {
            filterContext = 'driver'
          }
          // Customers get customer context
          else if (userType === 'CUSTOMER' && resourceType === 'delivery') {
            filterContext = 'customer'
          }
        } else {
          // No authentication = public context
          filterContext = 'public'
        }

        const allowedFields = DTOs[resourceType]?.[filterContext]
        
        if (allowedFields) {
          // Filter single object
          if (data && typeof data === 'object' && !Array.isArray(data)) {
            if (data.data) {
              // Handle paginated responses
              if (Array.isArray(data.data)) {
                data.data = filterArray(data.data, allowedFields)
              } else {
                data.data = filterObject(data.data, allowedFields)
              }
            } else {
              // Handle direct object response
              data = filterObject(data, allowedFields)
            }
          }
          // Filter array response
          else if (Array.isArray(data)) {
            data = filterArray(data, allowedFields)
          }
        }

        // Remove sensitive fields from error responses
        if (data.error && process.env.NODE_ENV === 'production') {
          // Log full error details
          console.error('API Error:', data)
          
          // Return sanitized error
          data = {
            error: 'An error occurred',
            code: data.code || 'INTERNAL_ERROR'
          }
        }

        return originalJson.call(this, data)
      } catch (error) {
        console.error('Response filtering error:', error)
        return originalJson.call(this, data)
      }
    }
    
    next()
  }
}

// Sensitive data masking
const maskSensitiveData = (data) => {
  if (!data || typeof data !== 'object') return data
  
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'pin', 'otp']
  const masked = { ...data }
  
  Object.keys(masked).forEach(key => {
    const lowerKey = key.toLowerCase()
    if (sensitiveFields.some(field => lowerKey.includes(field))) {
      masked[key] = '***MASKED***'
    }
  })
  
  return masked
}

// Prevent information disclosure through timing attacks
const constantTimeResponse = (req, res, next) => {
  const startTime = Date.now()
  const minResponseTime = 100 // Minimum 100ms response time
  
  const originalJson = res.json
  res.json = function(data) {
    const elapsed = Date.now() - startTime
    const delay = Math.max(0, minResponseTime - elapsed)
    
    setTimeout(() => {
      originalJson.call(this, data)
    }, delay)
  }
  
  next()
}

// Remove server fingerprinting headers
const removeServerHeaders = (req, res, next) => {
  res.removeHeader('X-Powered-By')
  res.removeHeader('Server')
  res.setHeader('Server', 'PakkaDrop/1.0')
  next()
}

// Prevent enumeration attacks
const preventEnumeration = async (req, res, next) => {
  const originalJson = res.json
  
  res.json = function(data) {
    // For 404 responses, always return the same message
    if (res.statusCode === 404) {
      data = { error: 'Resource not found' }
    }
    
    // For authentication failures, use generic messages
    if (res.statusCode === 401 || res.statusCode === 403) {
      if (data.error && data.error.includes('user')) {
        data.error = 'Authentication failed'
      }
    }
    
    return originalJson.call(this, data)
  }
  
  next()
}

module.exports = {
  filterResponse,
  maskSensitiveData,
  constantTimeResponse,
  removeServerHeaders,
  preventEnumeration,
  DTOs
}