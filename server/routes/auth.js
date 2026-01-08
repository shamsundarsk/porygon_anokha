const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { prisma } = require('../database/connection')
const { sendSMS, sendEmail } = require('../services/notifications')

const router = express.Router()

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  })
}

// Register
router.post('/register', async (req, res) => {
  try {
    const {
      email,
      phone,
      password,
      name,
      userType,
      businessType,
      companyName,
      vehicleType,
      vehicleNumber,
      licenseNumber
    } = req.body

    // Validation
    if (!email || !phone || !password || !name || !userType) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { phone }
        ]
      }
    })

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email or phone' })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const userData = {
      email,
      phone,
      password: hashedPassword,
      name,
      userType,
      businessType: businessType || 'B2C',
      companyName: userType === 'ENTERPRISE' ? companyName : null,
    }

    // Add driver-specific fields
    if (userType === 'DRIVER') {
      if (!vehicleType || !vehicleNumber || !licenseNumber) {
        return res.status(400).json({ error: 'Driver details are required' })
      }
      userData.vehicleType = vehicleType
      userData.vehicleNumber = vehicleNumber
      userData.licenseNumber = licenseNumber
    }

    const user = await prisma.user.create({
      data: userData,
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        userType: true,
        businessType: true,
        companyName: true,
        isVerified: true,
        createdAt: true
      }
    })

    // Generate token
    const token = generateToken(user.id)

    // Send welcome notification
    try {
      await sendEmail(user.email, 'Welcome to FairLoad', `
        <h1>Welcome to FairLoad, ${user.name}!</h1>
        <p>Your account has been created successfully.</p>
        <p>Start using our fair logistics platform today.</p>
      `)
    } catch (emailError) {
      console.log('Email notification failed:', emailError.message)
    }

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Registration failed' })
  }
})

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        phone: true,
        password: true,
        name: true,
        userType: true,
        businessType: true,
        companyName: true,
        isVerified: true,
        isActive: true,
        avatar: true,
        vehicleType: true,
        vehicleNumber: true,
        isOnline: true,
        rating: true,
        totalDeliveries: true,
        createdAt: true
      }
    })

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is deactivated' })
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Generate token
    const token = generateToken(user.id)

    // Remove password from response
    const { password: _, ...userResponse } = user

    res.json({
      message: 'Login successful',
      token,
      user: userResponse
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Login failed' })
  }
})

// Verify token
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]

    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        userType: true,
        businessType: true,
        companyName: true,
        isVerified: true,
        isActive: true,
        avatar: true,
        vehicleType: true,
        vehicleNumber: true,
        isOnline: true,
        rating: true,
        totalDeliveries: true,
        createdAt: true
      }
    })

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    res.json({ user })
  } catch (error) {
    console.error('Token verification error:', error)
    res.status(401).json({ error: 'Invalid token' })
  }
})

// Request OTP for phone verification
router.post('/request-otp', async (req, res) => {
  try {
    const { phone } = req.body

    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' })
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    // Store OTP in database or cache (for demo, we'll just return success)
    // In production, store in Redis or database with expiration

    // Send OTP via SMS
    try {
      await sendSMS(phone, `Your FairLoad verification code is: ${otp}. Valid for 10 minutes.`)
    } catch (smsError) {
      console.log('SMS failed:', smsError.message)
    }

    res.json({ 
      message: 'OTP sent successfully',
      // In production, don't send OTP in response
      otp: process.env.NODE_ENV === 'development' ? otp : undefined
    })
  } catch (error) {
    console.error('OTP request error:', error)
    res.status(500).json({ error: 'Failed to send OTP' })
  }
})

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body

    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone and OTP are required' })
    }

    // Verify OTP (in production, check against stored OTP)
    // For demo, accept any 6-digit number
    if (otp.length !== 6) {
      return res.status(400).json({ error: 'Invalid OTP' })
    }

    // Update user verification status
    await prisma.user.updateMany({
      where: { phone },
      data: { isVerified: true }
    })

    res.json({ message: 'Phone verified successfully' })
  } catch (error) {
    console.error('OTP verification error:', error)
    res.status(500).json({ error: 'OTP verification failed' })
  }
})

// Logout (client-side token removal, but we can log it)
router.post('/logout', (req, res) => {
  // In production, you might want to blacklist the token
  res.json({ message: 'Logged out successfully' })
})

module.exports = router