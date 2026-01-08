#!/usr/bin/env node

const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

// Generate cryptographically secure secrets
function generateSecret(length = 64) {
  return crypto.randomBytes(length).toString('hex')
}

function generateJWTSecret() {
  return crypto.randomBytes(32).toString('hex')
}

// Rotate all secrets
function rotateSecrets() {
  const newSecrets = {
    JWT_SECRET: generateJWTSecret(),
    JWT_REFRESH_SECRET: generateJWTSecret(),
    ENCRYPTION_KEY: generateSecret(32),
    RAZORPAY_WEBHOOK_SECRET: generateSecret(32),
    CRYPTO_MASTER_KEY: generateSecret(32),
    KEY_STORAGE_MASTER_KEY: generateSecret(32)
  }

  console.log('🔄 Rotating secrets...')
  console.log('New secrets generated:')
  
  Object.entries(newSecrets).forEach(([key, value]) => {
    console.log(`${key}="${value}"`)
  })

  // Read current .env
  const envPath = path.join(__dirname, '..', '.env')
  let envContent = ''
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8')
  }

  // Update secrets in .env
  Object.entries(newSecrets).forEach(([key, value]) => {
    const regex = new RegExp(`^${key}=.*$`, 'm')
    if (envContent.match(regex)) {
      envContent = envContent.replace(regex, `${key}="${value}"`)
    } else {
      envContent += `\n${key}="${value}"`
    }
  })

  // Write updated .env
  fs.writeFileSync(envPath, envContent)
  
  console.log('✅ Secrets rotated successfully!')
  console.log('⚠️  Please restart your application to use new secrets')
  console.log('⚠️  Update any external services with new webhook secrets')
}

if (require.main === module) {
  rotateSecrets()
}

module.exports = { rotateSecrets, generateSecret, generateJWTSecret }