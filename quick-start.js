#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')

console.log('🚀 PakkaDrop Quick Start')
console.log('=======================')

// Check if .env exists
if (!fs.existsSync('.env')) {
  console.log('❌ .env file not found!')
  console.log('Run: npm run setup-security')
  process.exit(1)
}

try {
  console.log('📦 Installing dependencies...')
  execSync('npm install', { stdio: 'inherit' })
  
  console.log('🗄️  Setting up database...')
  execSync('npx prisma generate', { stdio: 'inherit' })
  execSync('npx prisma db push', { stdio: 'inherit' })
  
  console.log('✅ Setup complete!')
  console.log('\n🎯 Next steps:')
  console.log('1. Start the server: npm run server')
  console.log('2. Start the client: npm run client')
  console.log('3. Or start both: npm run dev')
  console.log('\n📱 Access the app:')
  console.log('- Frontend: http://localhost:3005')
  console.log('- Backend: http://localhost:5004')
  console.log('- Health: http://localhost:5004/health')
  
} catch (error) {
  console.error('❌ Setup failed:', error.message)
  process.exit(1)
}