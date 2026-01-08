#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('🚛 FairLoad Setup Script')
console.log('========================\n')

// Check if .env exists
const envPath = path.join(__dirname, '.env')
const envExamplePath = path.join(__dirname, '.env.example')

if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file from template...')
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath)
    console.log('✅ .env file created')
  } else {
    console.log('❌ .env.example not found')
    process.exit(1)
  }
} else {
  console.log('✅ .env file already exists')
}

// Install dependencies
console.log('\n📦 Installing dependencies...')
try {
  execSync('npm install', { stdio: 'inherit' })
  console.log('✅ Dependencies installed')
} catch (error) {
  console.log('❌ Failed to install dependencies')
  process.exit(1)
}

// Generate Prisma client
console.log('\n🔧 Setting up database client...')
try {
  execSync('npx prisma generate', { stdio: 'inherit' })
  console.log('✅ Prisma client generated')
} catch (error) {
  console.log('⚠️  Prisma client generation failed (this is OK for demo mode)')
}

// Check if we can connect to database
console.log('\n🗄️  Testing database connection...')
try {
  execSync('node -e "require(\'./server/database/connection\').testConnection()"', { stdio: 'pipe' })
  console.log('✅ Database connection successful')
  
  // Try to push schema
  try {
    execSync('npx prisma db push', { stdio: 'inherit' })
    console.log('✅ Database schema updated')
  } catch (error) {
    console.log('⚠️  Database schema push failed (continuing in demo mode)')
  }
} catch (error) {
  console.log('⚠️  Database connection failed (running in demo mode)')
}

console.log('\n🎉 Setup Complete!')
console.log('==================')
console.log('')
console.log('🚀 To start the application:')
console.log('   npm run dev')
console.log('')
console.log('🌐 The application will be available at:')
console.log('   Frontend: http://localhost:3001')
console.log('   Backend:  http://localhost:5001')
console.log('')
console.log('📚 For database setup instructions, see:')
console.log('   DATABASE_SETUP.md')
console.log('')
console.log('🎤 Voice commands are supported in modern browsers')
console.log('🗺️  Maps integration ready (configure API keys in .env)')
console.log('📱 Mobile-ready (React Native compatible)')
console.log('')
console.log('Happy shipping! 🚛✨')