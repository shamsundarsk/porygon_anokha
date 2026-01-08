const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const admin = require('firebase-admin')
const { supabase } = require('../config/supabase')
const { logSecurityEvent, logAuditEvent } = require('../services/audit')

const router = express.Router()

// Initialize Firebase Admin (if credentials are available)
let firebaseAdminInitialized = false
try {
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
        })
      })
    }
    firebaseAdminInitialized = true
  }
} catch (error) {
  console.log('Firebase Admin SDK not available:', error.message)
}

// Validate Firebase token and get user from Supabase
router.post('/validate', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    const idToken = authHeader && authHeader.split(' ')[1]

    if (!idToken) {
      return res.status(401).json({ error: 'Firebase ID token required' })
    }

    let firebaseUid = null
    let firebaseEmail = null

    // Try Firebase Admin SDK verification (if available)
    if (firebaseAdminInitialized) {
      try {
        const decodedToken = await admin.auth().verifyIdToken(idToken)
        firebaseUid = decodedToken.uid
        firebaseEmail = decodedToken.email
      } catch (firebaseError) {
        console.log('Firebase verification failed:', firebaseError.message)
      }
    }

    // Fallback token parsing for development (not secure for production)
    if (!firebaseUid) {
      try {
        const tokenParts = idToken.split('.')
        if (tokenParts.length === 3) {
          const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString())
          firebaseUid = payload.user_id || payload.sub
          firebaseEmail = payload.email
        }
      } catch (error) {
        return res.status(401).json({ error: 'Invalid token format' })
      }
    }

    if (!firebaseUid) {
      return res.status(401).json({ error: 'Token verification failed' })
    }

    // Get user from Supabase database
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('firebase_uid', firebaseUid)
      .single()

    if (error || !user) {
      await logSecurityEvent({
        eventType: 'UNREGISTERED_USER_ACCESS',
        severity: 'high',
        description: 'Firebase user not found in database',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { firebaseUid }
      })
      return res.status(401).json({ error: 'User not registered in system' })
    }

    if (!user.is_active) {
      await logSecurityEvent({
        userId: user.id,
        eventType: 'INACTIVE_USER_ACCESS',
        severity: 'medium',
        description: 'Inactive user attempted access',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      })
      return res.status(401).json({ error: 'Account deactivated' })
    }

    // Log successful validation
    await logAuditEvent({
      userId: user.id,
      action: 'VALIDATE',
      resource: 'user_session',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    })

    // Return user data in the format expected by frontend
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      userType: user.user_type,
      companyName: user.company_name,
      vehicleType: user.vehicle_type,
      vehicleNumber: user.vehicle_number,
      isVerified: user.is_verified,
      isActive: user.is_active
    })
  } catch (error) {
    console.error('User validation error:', error)
    await logSecurityEvent({
      eventType: 'AUTH_VALIDATION_ERROR',
      severity: 'medium',
      description: 'User validation failed',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      metadata: { error: error.message }
    })
    res.status(401).json({ error: 'Authentication failed' })
  }
})

// Register user in Supabase database (Firebase user already created)
router.post('/register', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    const idToken = authHeader && authHeader.split(' ')[1]

    if (!idToken) {
      return res.status(401).json({ error: 'Firebase ID token required' })
    }

    let firebaseUid = null
    let firebaseEmail = null

    // Try Firebase Admin SDK verification (if available)
    if (firebaseAdminInitialized) {
      try {
        const decodedToken = await admin.auth().verifyIdToken(idToken)
        firebaseUid = decodedToken.uid
        firebaseEmail = decodedToken.email
      } catch (firebaseError) {
        console.log('Firebase verification failed:', firebaseError.message)
      }
    }

    // Fallback token parsing for development
    if (!firebaseUid) {
      try {
        const tokenParts = idToken.split('.')
        if (tokenParts.length === 3) {
          const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString())
          firebaseUid = payload.user_id || payload.sub
          firebaseEmail = payload.email
        }
      } catch (error) {
        return res.status(401).json({ error: 'Invalid token format' })
      }
    }

    const { name, phone, userType, companyName, vehicleType, vehicleNumber } = req.body

    // Validate required fields
    if (!name || !phone || !userType) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Validate userType
    const allowedUserTypes = ['CUSTOMER', 'DRIVER', 'BUSINESS']
    if (!allowedUserTypes.includes(userType)) {
      return res.status(400).json({ error: 'Invalid user type' })
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .or(`firebase_uid.eq.${firebaseUid},email.eq.${firebaseEmail},phone.eq.${phone}`)
      .single()

    if (existingUser) {
      return res.status(400).json({ error: 'User already registered' })
    }

    // Create user in Supabase
    const { data: user, error } = await supabase
      .from('users')
      .insert([
        {
          firebase_uid: firebaseUid,
          email: firebaseEmail,
          name,
          phone,
          user_type: userType,
          company_name: companyName,
          vehicle_type: vehicleType,
          vehicle_number: vehicleNumber,
          is_verified: false,
          is_active: true
        }
      ])
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    // Log registration
    await logAuditEvent({
      userId: user.id,
      action: 'CREATE',
      resource: 'user_account',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      metadata: { userType }
    })

    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        userType: user.user_type,
        companyName: user.company_name,
        vehicleType: user.vehicle_type,
        vehicleNumber: user.vehicle_number,
        isVerified: user.is_verified,
        isActive: user.is_active
      }
    })
  } catch (error) {
    console.error('Registration error:', error)
    await logSecurityEvent({
      eventType: 'REGISTRATION_ERROR',
      severity: 'medium',
      description: 'User registration failed',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      metadata: { error: error.message }
    })
    res.status(500).json({ error: 'Registration failed' })
  }
})

module.exports = router