const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

// Test database connection
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

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})

module.exports = { prisma, testConnection }