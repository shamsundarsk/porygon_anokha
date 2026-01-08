#!/usr/bin/env node

const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

console.log('🔒 PakkaDrop Security Setup')
console.log('==========================')

// Generate secure secrets
const generateSecrets = () => {
  return {
    JWT_SECRET: crypto.randomBytes(32).toString('hex'),
    JWT_REFRESH_SECRET: crypto.randomBytes(32).toString('hex'),
    ENCRYPTION_KEY: crypto.randomBytes(32).toString('hex')
  }
}

// Create secure .env file
const createSecureEnv = () => {
  const secrets = generateSecrets()
  
  const envContent = `# PakkaDrop Security Configuration
# Generated on: ${new Date().toISOString()}
# IMPORTANT: Never commit this file to version control!

# Database - REPLACE WITH YOUR ACTUAL DATABASE URL
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"

# JWT Secrets - GENERATED SECURELY
JWT_SECRET="${secrets.JWT_SECRET}"
JWT_REFRESH_SECRET="${secrets.JWT_REFRESH_SECRET}"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Encryption Key - GENERATED SECURELY
ENCRYPTION_KEY="${secrets.ENCRYPTION_KEY}"

# Server Configuration
PORT=5004
NODE_ENV="development"

# Redis for Rate Limiting - REPLACE WITH YOUR REDIS URL
REDIS_URL="redis://localhost:6379"

# CORS - REPLACE WITH YOUR ACTUAL DOMAINS
ALLOWED_ORIGINS="http://localhost:3005,http://localhost:19006"

# Maps API Keys - REPLACE WITH YOUR ACTUAL KEYS
MAPMYINDIA_API_KEY="your-mapmyindia-api-key"
MAPBOX_ACCESS_TOKEN="your-mapbox-access-token"

# Payment Gateway - REPLACE WITH YOUR ACTUAL KEYS
RAZORPAY_KEY_ID="your-razorpay-key-id"
RAZORPAY_KEY_SECRET="your-razorpay-key-secret"
RAZORPAY_WEBHOOK_SECRET="${crypto.randomBytes(32).toString('hex')}"

# SMS & Communication - REPLACE WITH YOUR ACTUAL CREDENTIALS
TWILIO_ACCOUNT_SID="your-twilio-account-sid"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_PHONE_NUMBER="+1234567890"

# Email Configuration - REPLACE WITH YOUR ACTUAL SMTP SETTINGS
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@domain.com"
SMTP_PASS="your-app-password"

# File Upload
CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"
CLOUDINARY_API_KEY="your-cloudinary-api-key"
CLOUDINARY_API_SECRET="your-cloudinary-api-secret"

# Voice
SPEECH_API_KEY="your-speech-api-key"

# Security Configuration
BCRYPT_ROUNDS=14
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_TIME=1800000
AUDIT_LOG_LEVEL="info"

# SECURITY REMINDERS:
# 1. Replace all placeholder values with actual credentials
# 2. Use different secrets for dev/staging/production
# 3. Rotate secrets every 90 days
# 4. Never share or commit this file
# 5. Use environment-specific secret management in production
`

  fs.writeFileSync('.env', envContent)
  console.log('✅ Created secure .env file with generated secrets')
  console.log('⚠️  Remember to replace placeholder values with actual credentials')
}

// Create security directories
const createSecurityDirs = () => {
  const dirs = ['logs', 'security-reports', 'backups']
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
      console.log(`✅ Created directory: ${dir}`)
    }
  })
}

// Security checklist
const displaySecurityChecklist = () => {
  console.log('\n🔍 Security Setup Checklist:')
  console.log('============================')
  
  const checklist = [
    '[ ] Replace DATABASE_URL with your actual database connection',
    '[ ] Replace API keys (MapMyIndia, Mapbox, Razorpay, etc.)',
    '[ ] Configure SMTP settings for email notifications',
    '[ ] Set up Redis server for rate limiting',
    '[ ] Configure CORS origins for your domains',
    '[ ] Set up SSL/TLS certificates for HTTPS',
    '[ ] Configure monitoring and alerting',
    '[ ] Set up backup and recovery procedures',
    '[ ] Run security audit: npm audit',
    '[ ] Test all security features',
    '[ ] Review and update security policies',
    '[ ] Train team on security best practices'
  ]
  
  checklist.forEach(item => console.log(item))
}

// Security recommendations
const displaySecurityRecommendations = () => {
  console.log('\n🛡️  Security Recommendations:')
  console.log('==============================')
  
  const recommendations = [
    '🔐 Use strong, unique passwords for all services',
    '🔄 Rotate secrets every 90 days',
    '📊 Monitor security events continuously',
    '🚨 Set up real-time alerts for critical events',
    '🔍 Perform regular security audits',
    '📚 Keep dependencies updated',
    '🎯 Conduct penetration testing',
    '📋 Maintain incident response plan',
    '👥 Provide security training to team',
    '📝 Document all security procedures'
  ]
  
  recommendations.forEach(item => console.log(item))
}

// Main setup function
const main = () => {
  try {
    console.log('Starting security setup...\n')
    
    // Check if .env already exists
    if (fs.existsSync('.env')) {
      console.log('⚠️  .env file already exists!')
      console.log('Backup your current .env file before proceeding.')
      
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      })
      
      readline.question('Do you want to overwrite it? (y/N): ', (answer) => {
        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
          createSecureEnv()
          createSecurityDirs()
          displaySecurityChecklist()
          displaySecurityRecommendations()
        } else {
          console.log('Setup cancelled. Your existing .env file is preserved.')
        }
        readline.close()
      })
    } else {
      createSecureEnv()
      createSecurityDirs()
      displaySecurityChecklist()
      displaySecurityRecommendations()
    }
    
    console.log('\n🎉 Security setup completed!')
    console.log('Next steps:')
    console.log('1. Edit .env file with your actual credentials')
    console.log('2. Run: npm install')
    console.log('3. Run: npx prisma db push')
    console.log('4. Run: npm run server')
    console.log('\n📖 See SECURITY.md for detailed documentation')
    
  } catch (error) {
    console.error('❌ Security setup failed:', error.message)
    process.exit(1)
  }
}

// Run setup if called directly
if (require.main === module) {
  main()
}

module.exports = { generateSecrets, createSecureEnv }