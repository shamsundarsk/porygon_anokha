const nodemailer = require('nodemailer')
const twilio = require('twilio')

// Email service
const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
})

// SMS service
const twilioClient = (process.env.TWILIO_ACCOUNT_SID && 
                     process.env.TWILIO_AUTH_TOKEN && 
                     process.env.TWILIO_ACCOUNT_SID.startsWith('AC'))
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null

const sendEmail = async (to, subject, html) => {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log(`📧 Email would be sent to ${to}: ${subject}`)
      return { success: true, messageId: 'dev-mode' }
    }

    const info = await emailTransporter.sendMail({
      from: `"FairLoad" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html
    })

    console.log('📧 Email sent:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('📧 Email error:', error)
    throw new Error('Failed to send email')
  }
}

const sendSMS = async (to, message) => {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log(`📱 SMS would be sent to ${to}: ${message}`)
      return { success: true, sid: 'dev-mode' }
    }

    if (!twilioClient) {
      throw new Error('Twilio not configured')
    }

    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to
    })

    console.log('📱 SMS sent:', result.sid)
    return { success: true, sid: result.sid }
  } catch (error) {
    console.error('📱 SMS error:', error)
    throw new Error('Failed to send SMS')
  }
}

const sendPushNotification = async (userId, title, body, data = {}) => {
  try {
    // In production, integrate with Firebase Cloud Messaging or similar
    console.log(`🔔 Push notification for ${userId}: ${title}`)
    
    // For now, we'll just log it
    // In real implementation, you would:
    // 1. Get user's FCM token from database
    // 2. Send notification via FCM API
    // 3. Handle delivery receipts
    
    return { success: true }
  } catch (error) {
    console.error('🔔 Push notification error:', error)
    throw new Error('Failed to send push notification')
  }
}

module.exports = {
  sendEmail,
  sendSMS,
  sendPushNotification
}