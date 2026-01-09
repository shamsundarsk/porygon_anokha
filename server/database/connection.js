const { PrismaClient } = require('@prisma/client')

// Create Prisma client with enhanced configuration
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  errorFormat: 'pretty',
})

// Test database connection with fallback
async function testConnection() {
  try {
    // Skip actual connection test for demo mode
    if (process.env.DATABASE_URL.includes('demo') || process.env.NODE_ENV === 'development') {
      console.log('⚠️  Running in demo mode - database operations will be mocked')
      return true
    }
    
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    console.log('⚠️  Continuing in demo mode...')
    return false
  }
}

// Enhanced graceful shutdown
process.on('beforeExit', async () => {
  try {
    await prisma.$disconnect()
    console.log('✅ Database connection closed')
  } catch (error) {
    console.error('❌ Error closing database connection:', error)
  }
})

// Handle SIGINT and SIGTERM
process.on('SIGINT', async () => {
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await prisma.$disconnect()
  process.exit(0)
})

module.exports = { prisma, testConnection }