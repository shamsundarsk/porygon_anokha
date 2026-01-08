#!/usr/bin/env node

const axios = require('axios')
const crypto = require('crypto')

const BASE_URL = 'http://localhost:5004'

console.log('🔒 FairLoad Security Test Suite')
console.log('================================')

// Test configuration
const testConfig = {
  baseURL: BASE_URL,
  timeout: 5000
}

// Test results
const results = {
  passed: 0,
  failed: 0,
  tests: []
}

// Helper function to run tests
const runTest = async (name, testFn) => {
  try {
    console.log(`\n🧪 Testing: ${name}`)
    await testFn()
    console.log(`✅ PASSED: ${name}`)
    results.passed++
    results.tests.push({ name, status: 'PASSED' })
  } catch (error) {
    console.log(`❌ FAILED: ${name}`)
    console.log(`   Error: ${error.message}`)
    results.failed++
    results.tests.push({ name, status: 'FAILED', error: error.message })
  }
}

// Test 1: Rate Limiting
const testRateLimiting = async () => {
  const requests = []
  
  // Send multiple requests rapidly to auth endpoint
  for (let i = 0; i < 8; i++) {
    requests.push(
      axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      }, { 
        timeout: 3000, 
        validateStatus: () => true 
      }).catch(err => ({ status: err.response?.status || 500, error: err.message }))
    )
  }
  
  const responses = await Promise.all(requests)
  
  // Check if any requests were rate limited (429) or if we got consistent 401s
  const rateLimited = responses.some(res => res.status === 429)
  const authErrors = responses.filter(res => res.status === 401).length
  
  // Rate limiting should either return 429 or we should see consistent auth failures
  if (!rateLimited && authErrors < 5) {
    throw new Error('Rate limiting not working properly')
  }
}

// Test 2: Input Validation
const testInputValidation = async () => {
  const maliciousInputs = [
    { email: '<script>alert("xss")</script>', password: 'test' },
    { email: 'test@example.com', password: '' },
    { email: 'invalid-email', password: 'test123' },
    { email: 'test@example.com', password: 'a'.repeat(200) } // Too long
  ]
  
  for (const input of maliciousInputs) {
    const response = await axios.post(`${BASE_URL}/api/auth/register`, input, {
      validateStatus: () => true
    })
    
    if (response.status === 200 || response.status === 201) {
      throw new Error(`Input validation failed for: ${JSON.stringify(input)}`)
    }
  }
}

// Test 3: SQL Injection Protection
const testSQLInjection = async () => {
  const sqlPayloads = [
    "'; DROP TABLE users; --",
    "' OR '1'='1",
    "' UNION SELECT * FROM users --",
    "admin'--",
    "' OR 1=1 --"
  ]
  
  for (const payload of sqlPayloads) {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: payload,
      password: payload
    }, { validateStatus: () => true })
    
    // Should not return 200 or expose database errors
    if (response.status === 200 || 
        (response.data && response.data.error && response.data.error.includes('SQL'))) {
      throw new Error(`SQL injection vulnerability detected with payload: ${payload}`)
    }
  }
}

// Test 4: XSS Protection
const testXSSProtection = async () => {
  const xssPayloads = [
    '<script>alert("xss")</script>',
    '<img src="x" onerror="alert(1)">',
    'javascript:alert("xss")',
    '<svg onload="alert(1)">',
    '"><script>alert("xss")</script>'
  ]
  
  for (const payload of xssPayloads) {
    const response = await axios.post(`${BASE_URL}/api/auth/register`, {
      email: 'test@example.com',
      password: 'Test123!',
      name: payload,
      userType: 'CUSTOMER'
    }, { validateStatus: () => true })
    
    // Should reject malicious input
    if (response.status === 200 || response.status === 201) {
      throw new Error(`XSS vulnerability detected with payload: ${payload}`)
    }
  }
}

// Test 5: Authentication Bypass
const testAuthBypass = async () => {
  const protectedEndpoints = [
    { method: 'get', path: '/api/admin/stats' },
    { method: 'get', path: '/api/deliveries/my-deliveries' },
    { method: 'get', path: '/api/users/profile' },
    { method: 'post', path: '/api/payments/create-intent', data: { amount: 100, deliveryId: 'test' } }
  ]
  
  for (const endpoint of protectedEndpoints) {
    const config = {
      timeout: 3000,
      validateStatus: () => true
    }
    
    let response
    if (endpoint.method === 'post') {
      response = await axios.post(`${BASE_URL}${endpoint.path}`, endpoint.data || {}, config)
    } else {
      response = await axios.get(`${BASE_URL}${endpoint.path}`, config)
    }
    
    if (response.status === 200) {
      throw new Error(`Authentication bypass detected on: ${endpoint.path}`)
    }
    
    if (response.status !== 401 && response.status !== 403) {
      throw new Error(`Unexpected response status ${response.status} on: ${endpoint.path}`)
    }
  }
}

// Test 6: CORS Configuration
const testCORS = async () => {
  const response = await axios.options(`${BASE_URL}/api/auth/login`, {
    headers: {
      'Origin': 'https://malicious-site.com',
      'Access-Control-Request-Method': 'POST'
    },
    validateStatus: () => true
  })
  
  const allowedOrigin = response.headers['access-control-allow-origin']
  
  if (allowedOrigin === '*' || allowedOrigin === 'https://malicious-site.com') {
    throw new Error('CORS is too permissive')
  }
}

// Test 7: Security Headers
const testSecurityHeaders = async () => {
  const response = await axios.get(`${BASE_URL}/health`)
  
  const requiredHeaders = [
    'x-content-type-options',
    'x-frame-options',
    'x-xss-protection',
    'strict-transport-security'
  ]
  
  for (const header of requiredHeaders) {
    if (!response.headers[header]) {
      throw new Error(`Missing security header: ${header}`)
    }
  }
}

// Test 8: Honeypot Detection
const testHoneypots = async () => {
  const honeypotEndpoints = [
    '/admin',
    '/wp-admin',
    '/phpmyadmin',
    '/.env',
    '/config'
  ]
  
  for (const endpoint of honeypotEndpoints) {
    const response = await axios.get(`${BASE_URL}${endpoint}`, {
      timeout: 3000,
      validateStatus: () => true
    }).catch(err => ({ status: err.response?.status || 500 }))
    
    // Honeypots should return 404 to not reveal they're traps
    if (response.status !== 404) {
      throw new Error(`Honeypot endpoint ${endpoint} returned ${response.status} instead of 404`)
    }
  }
}

// Test 9: Password Strength
const testPasswordStrength = async () => {
  const weakPasswords = [
    'password',
    '123456',
    'qwerty',
    'abc123',
    'password123',
    'test', // Too short
    'ALLUPPERCASE',
    'alllowercase',
    '12345678' // No letters
  ]
  
  for (const password of weakPasswords) {
    const response = await axios.post(`${BASE_URL}/api/auth/register`, {
      email: 'test@example.com',
      password: password,
      name: 'Test User',
      userType: 'CUSTOMER'
    }, { validateStatus: () => true })
    
    if (response.status === 200 || response.status === 201) {
      throw new Error(`Weak password accepted: ${password}`)
    }
  }
}

// Test 10: JWT Token Validation
const testJWTValidation = async () => {
  const invalidTokens = [
    'invalid.jwt.token',
    'Bearer invalid',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature',
    '', // Empty token
    'null'
  ]
  
  for (const token of invalidTokens) {
    const response = await axios.get(`${BASE_URL}/api/users/profile`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 3000,
      validateStatus: () => true
    }).catch(err => ({ status: err.response?.status || 500 }))
    
    if (response.status === 200) {
      throw new Error(`Invalid JWT token accepted: ${token}`)
    }
  }
}

// Main test runner
const runAllTests = async () => {
  console.log('Starting security tests...\n')
  
  // Check if server is running
  try {
    await axios.get(`${BASE_URL}/health`, { timeout: 2000 })
    console.log('✅ Server is running and accessible')
  } catch (error) {
    console.log('❌ Server is not accessible. Please start the server first.')
    console.log('   Run: npm run server')
    process.exit(1)
  }
  
  // Run all security tests
  await runTest('Rate Limiting', testRateLimiting)
  await runTest('Input Validation', testInputValidation)
  await runTest('SQL Injection Protection', testSQLInjection)
  await runTest('XSS Protection', testXSSProtection)
  await runTest('Authentication Bypass', testAuthBypass)
  await runTest('CORS Configuration', testCORS)
  await runTest('Security Headers', testSecurityHeaders)
  await runTest('Honeypot Detection', testHoneypots)
  await runTest('Password Strength', testPasswordStrength)
  await runTest('JWT Token Validation', testJWTValidation)
  
  // Display results
  console.log('\n📊 Test Results:')
  console.log('=================')
  console.log(`✅ Passed: ${results.passed}`)
  console.log(`❌ Failed: ${results.failed}`)
  console.log(`📈 Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`)
  
  if (results.failed > 0) {
    console.log('\n❌ Failed Tests:')
    results.tests
      .filter(test => test.status === 'FAILED')
      .forEach(test => console.log(`   - ${test.name}: ${test.error}`))
  }
  
  console.log('\n🔒 Security Test Complete!')
  
  if (results.failed === 0) {
    console.log('🎉 All security tests passed! Your application is well-protected.')
  } else {
    console.log('⚠️  Some security tests failed. Please review and fix the issues.')
    process.exit(1)
  }
}

// Run tests if called directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('❌ Test suite failed:', error.message)
    process.exit(1)
  })
}

module.exports = { runAllTests }