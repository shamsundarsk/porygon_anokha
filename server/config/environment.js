const Joi = require('joi')
const crypto = require('crypto')

// Environment validation schema
const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'staging', 'production').default('development'),
  PORT: Joi.number().default(5004),
  
  // Database
  DATABASE_URL: Joi.string().required(),
  
  // JWT Secrets (must be strong)
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  
  // Encryption
  ENCRYPTION_KEY: Joi.string().length(64).required(), // 32 bytes hex
  
  // Rate Limiting (optional for development)
  REDIS_URL: Joi.string().optional(),
  
  // External APIs
  MAPMYINDIA_API_KEY: Joi.string().required(),
  MAPBOX_ACCESS_TOKEN: Joi.string().required(),
  
  // Payment
  RAZORPAY_KEY_ID: Joi.string().required(),
  RAZORPAY_KEY_SECRET: Joi.string().required(),
  RAZORPAY_WEBHOOK_SECRET: Joi.string().required(),
  
  // Communication
  TWILIO_ACCOUNT_SID: Joi.string().required(),
  TWILIO_AUTH_TOKEN: Joi.string().required(),
  TWILIO_PHONE_NUMBER: Joi.string().required(),
  
  // Email
  SMTP_HOST: Joi.string().required(),
  SMTP_PORT: Joi.number().default(587),
  SMTP_USER: Joi.string().required(),
  SMTP_PASS: Joi.string().required(),
  
  // Security
  BCRYPT_ROUNDS: Joi.number().min(12).default(14),
  MAX_LOGIN_ATTEMPTS: Joi.number().default(5),
  LOCKOUT_TIME: Joi.number().default(30 * 60 * 1000), // 30 minutes
  
  // CORS
  ALLOWED_ORIGINS: Joi.string().required(),
  
  // Audit
  AUDIT_LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info')
}).unknown()

// Validate environment variables
const validateEnvironment = () => {
  const { error, value } = envSchema.validate(process.env)
  
  if (error) {
    console.error('❌ Environment validation failed:')
    console.error(error.details.map(detail => `  - ${detail.message}`).join('\n'))
    process.exit(1)
  }
  
  // Additional security checks
  if (value.NODE_ENV === 'production') {
    // Production-specific validations
    if (value.JWT_SECRET.includes('demo') || value.JWT_SECRET.includes('test')) {
      console.error('❌ Production cannot use demo/test JWT secrets')
      process.exit(1)
    }
    
    if (value.DATABASE_URL.includes('demo') || value.DATABASE_URL.includes('test')) {
      console.error('❌ Production cannot use demo/test database')
      process.exit(1)
    }
  }
  
  console.log('✅ Environment validation passed')
  return value
}

// Generate secure secrets for development
const generateSecrets = () => {
  return {
    JWT_SECRET: crypto.randomBytes(32).toString('hex'),
    JWT_REFRESH_SECRET: crypto.randomBytes(32).toString('hex'),
    ENCRYPTION_KEY: crypto.randomBytes(32).toString('hex')
  }
}

module.exports = {
  validateEnvironment,
  generateSecrets
}