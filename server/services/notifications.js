// Simple notification service for development
const sendSMS = async (phone, message) => {
  console.log(`SMS to ${phone}: ${message}`)
  return { success: true }
}

const sendEmail = async (email, subject, message) => {
  console.log(`Email to ${email}: ${subject} - ${message}`)
  return { success: true }
}

module.exports = {
  sendSMS,
  sendEmail
}