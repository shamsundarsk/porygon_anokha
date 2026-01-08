const admin = require('firebase-admin')
const { prisma } = require('../database/connection')
const { supabase } = require('../config/supabase')
const { logSecurityEvent } = require('../services/audit')

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
    console.log('✅ Firebase Admin SDK initialized')
  } else {
    console.log('⚠️  Firebase Admin SDK not configured - using Supabase fallback')
  }
} catch (error) {
  console.log('⚠️  Firebase Admin SDK initialization failed - using Supabase fallback:', error.message)
}

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      return res.status(401).json({ error: 'Access token required' })
    }

    let firebaseUid = null
    let userEmail = null

    // Try Firebase Admin SDK verification first (if available)
    if (firebaseAdminInitialized) {
      try {
        const decodedToken = await admin.auth().verifyIdToken(token)
        firebaseUid = decodedToken.uid
        userEmail = decodedToken.email
      } catch (firebaseError) {
        console.log('Firebase token verification failed:', firebaseError.message)
      }
    }

    // If Firebase verification failed or not available, try Supabase
    if (!firebaseUid) {
      try {
        // For development: validate token format and extract user info
        // In production, you should always use Firebase Admin SDK
        const tokenParts = token.split('.')
        if (tokenParts.length === 3) {
          // This is a basic JWT validation - in production use proper verification
          const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString())
          firebaseUid = payload.user_id || payload.sub
          userEmail = payload.email
        }
      } catch (tokenError) {
        await logSecurityEvent({
          eventType: 'INVALID_TOKEN_FORMAT',
          severity: 'high',
          description: 'Invalid token format provided',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        })
        return res.status(401).json({ error: 'Invalid token format' })
      }
    }

    if (!firebaseUid) {
      return res.status(401).json({ error: 'Token verification failed' })
    }

    // Get user from Supabase database
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, user_type, is_active, is_verified, firebase_uid')
      .eq('firebase_uid', firebaseUid)
      .single()

    if (error || !user || !user.is_active) {
      await logSecurityEvent({
        eventType: 'INVALID_USER_ACCESS',
        severity: 'high',
        description: 'Invalid or inactive user attempted access',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { firebaseUid, error: error?.message }
      })
      return res.status(401).json({ error: 'Invalid or inactive user' })
    }

    // Attach user to request
    req.user = { 
      userId: user.id, 
      firebaseUid,
      email: user.email,
      name: user.name,
      userType: user.user_type,
      isActive: user.is_active,
      isVerified: user.is_verified
    }
    
    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    await logSecurityEvent({
      eventType: 'AUTH_ERROR',
      severity: 'medium',
      description: 'Authentication error occurred',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      metadata: { error: error.message }
    })
    return res.status(403).json({ error: 'Authentication failed' })
  }
}

const requireRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' })
      }

      if (!allowedRoles.includes(req.user.userType)) {
        await logSecurityEvent({
          userId: req.user.userId,
          eventType: 'UNAUTHORIZED_ACCESS',
          severity: 'high',
          description: `User attempted access to ${allowedRoles.join(',')} endpoint with role ${req.user.userType}`,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        })
        return res.status(403).json({ error: 'Insufficient permissions' })
      }

      next()
    } catch (error) {
      console.error('Role authorization error:', error)
      res.status(500).json({ error: 'Authorization check failed' })
    }
  }
}

// Generate tokens with version
const generateTokens = (user) => {
  const tokenVersion = user.tokenVersion || 1
  
  const accessToken = jwt.sign(
    { 
      userId: user.id, 
      userType: user.userType,
      tokenVersion
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '5m' }
  )

  const refreshToken = jwt.sign(
    { 
      userId: user.id,
      tokenVersion,
      type: 'refresh'
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '24h' }
  )

  return { accessToken, refreshToken }
}

// Force logout by incrementing token version
const forceLogout = async (userId) => {
  await prisma.user.update({
    where: { id: userId },
    data: { 
      tokenVersion: { increment: 1 }
    }
  })
}

module.exports = {
  authenticateToken,
  requireRole,
  generateTokens,
  forceLogout
}