const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { prisma } = require('../database/connection')

const router = express.Router()

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  })
}

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, phone, password, name, userType } = req.body

    // Basic validation
    if (!email || !phone || !password || !name || !userType) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Password strength validation
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' })
    }
    
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(password)) {
      return res.status(400).json({ error: 'Password must contain uppercase, lowercase, number, and special character' })
    }

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone }]
      }
    })

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        phone,
        password: hashedPassword,
        name,
        userType
      },
      select: {
        id: true,
        email: true,
        name: true,
        userType: true,
        createdAt: true
      }
    })

    // Generate token
    const token = generateToken(user.id)

    res.status(201).json({
      message: 'Registration successful',
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
      return res.status(400).json({ error: 'Email and password required' })
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Check password
    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
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
        name: true,
        userType: true,
        isActive: true
      }
    })

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    res.json({ user })
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' })
  }
})

module.exports = router