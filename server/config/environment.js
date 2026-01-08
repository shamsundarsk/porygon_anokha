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
  
  // Firebase (optional for development)
  FIREBASE_PROJECT_ID: Joi.string().allow('').optional(),
  FIREBASE_API_KEY: Joi.string().allow('').optional(),
  FIREBASE_AUTH_DOMAIN: Joi.string().allow('').optional(),
  FIREBASE_CLIENT_EMAIL: Joi.string().allow('').optional(),
  FIREBASE_PRIVATE_KEY: Joi.string().allow('').optional(),
  
  // Supabase (optional for development)
  SUPABASE_URL: Joi.string().optional(),
  SUPABASE_ANON_KEY: Joi.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: Joi.string().optional(),
  
  // Rate Limiting (optional for development)
  REDIS_URL: Joi.string().optional(),
  
  // External APIs (optional for development)
  MAPMYINDIA_API_KEY: Joi.string().allow('').optional(),
  MAPBOX_ACCESS_TOKEN: Joi.string().allow('').optional(),
  
  // Payment (optional for development)
  RAZORPAY_KEY_ID: Joi.string().allow('').optional(),
  RAZORPAY_KEY_SECRET: Joi.string().allow('').optional(),
  RAZORPAY_WEBHOOK_SECRET: Joi.string().allow('').optional(),
  
  // Communication (optional for development)
  TWILIO_ACCOUNT_SID: Joi.string().allow('').optional(),
  TWILIO_AUTH_TOKEN: Joi.string().allow('').optional(),
  TWILIO_PHONE_NUMBER: Joi.string().allow('').optional(),
  
  // Email (optional for development)
  SMTP_HOST: Joi.string().allow('').optional(),
  SMTP_PORT: Joi.number().default(587),
  SMTP_USER: Joi.string().allow('').optional(),
  SMTP_PASS: Joi.string().allow('').optional(),
  
  // File Upload (optional for development)
  CLOUDINARY_CLOUD_NAME: Joi.string().allow('').optional(),
  CLOUDINARY_API_KEY: Joi.string().allow('').optional(),
  CLOUDINARY_API_SECRET: Joi.string().allow('').optional(),
  
  // Voice (optional for development)
  SPEECH_API_KEY: Joi.string().allow('').optional(),
  
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