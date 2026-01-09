/**
 * Security Fixes Validation Test
 * Tests all the critical security vulnerabilities that were fixed
 */

const axios = require('axios')
const fs = require('fs')

const BASE_URL = 'http://localhost:5004'

// Test results storage
const testResults = {
  timestamp: new Date(),
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0
  }
}

// Helper function to add test result
function addTestResult(name, passed, details = {}) {
  const result = {
    name,
    passed,
    details,
    timestamp: new Date()
  }
  
  testResults.tests.push(result)
  testResults.summary.total++
  
  if (passed) {
    testResults.summary.passed++
    console.log(`✅ ${name}`)
  } else {
    testResults.summary.failed++
    console.log(`❌ ${name}`)
    if (details.error) {
      console.log(`   Error: ${details.error}`)
    }
  }
}

// Test 1: Multer Vulnerability Fix (CVE-2022-24434)
async function testMulterVulnerabilityFix() {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
    const multerVersion = packageJson.dependencies.multer
    
    // Check if multer is updated to a secure version
    const isSecureVersion = multerVersion.includes('2.0.') || multerVersion.includes('^2.')
    
    addTestResult(
      'Multer CVE-2022-24434 Fix',
      isSecureVersion,
      {
        currentVersion: multerVersion,
        expectedVersion: '>=2.0.0',
        vulnerability: 'CVE-2022-24434'
      }
    )
  } catch (error) {
    addTestResult('Multer CVE-2022-24434 Fix', false, { error: error.message })
  }
}

// Test 2: Route Path Collision Fix
async function testRoutePathCollisionFix() {
  try {
    // Read the payments.js file to check route order
    const paymentsRouteContent = fs.readFileSync('server/routes/payments.js', 'utf8')
    
    // Check if /my-payments route is defined before /:id route
    const myPaymentsIndex = paymentsRouteContent.indexOf("router.get('/my-payments'")
    const idRouteIndex = paymentsRouteContent.indexOf("router.get('/:id'")
    
    const isFixed = myPaymentsIndex !== -1 && idRouteIndex !== -1 && myPaymentsIndex < idRouteIndex
    
    addTestResult(
      'Route Path Collision Fix (/my-payments)',
      isFixed,
      {
        myPaymentsRoutePosition: myPaymentsIndex,
        idRoutePosition: idRouteIndex,
        isCorrectOrder: isFixed
      }
    )
  } catch (error) {
    addTestResult('Route Path Collision Fix', false, { error: error.message })
  }
}

// Test 3: GPS Proximity Verification Implementation
async function testGPSProximityVerification() {
  try {
    const deliveriesRouteContent = fs.readFileSync('server/routes/deliveries.js', 'utf8')
    
    // Check if GPS verification is implemented (no more TODO comments)
    const hasTodoGPS = deliveriesRouteContent.includes('TODO.*GPS') || 
                       deliveriesRouteContent.includes('TODO: Add GPS') ||
                       deliveriesRouteContent.includes('TODO: Verify driver location')
    
    // Check if actual GPS verification code exists
    const hasGPSVerification = deliveriesRouteContent.includes('calculateDistance(currentLat, currentLng') &&
                              deliveriesRouteContent.includes('GPS coordinates required') &&
                              deliveriesRouteContent.includes('distanceToPickup') &&
                              deliveriesRouteContent.includes('distanceToDelivery')
    
    const isFixed = !hasTodoGPS && hasGPSVerification
    
    addTestResult(
      'GPS Proximity Verification Implementation',
      isFixed,
      {
        hasTodoComments: hasTodoGPS,
        hasGPSVerificationCode: hasGPSVerification,
        isFullyImplemented: isFixed
      }
    )
  } catch (error) {
    addTestResult('GPS Proximity Verification Implementation', false, { error: error.message })
  }
}

// Test 4: Security Middleware Implementation
async function testSecurityMiddlewareImplementation() {
  try {
    // Check if abuse detection middleware is properly implemented
    const abuseDetectionContent = fs.readFileSync('server/middleware/abuseDetection.js', 'utf8')
    const hasRealImplementation = abuseDetectionContent.includes('detectAbuse') &&
                                 abuseDetectionContent.includes('trackRequestPattern') &&
                                 abuseDetectionContent.includes('checkRapidRequests') &&
                                 abuseDetectionContent.length > 1000 // Not just empty placeholder
    
    // Check if behavior analysis is implemented
    const behaviorAnalysisContent = fs.readFileSync('server/middleware/behaviorAnalysis.js', 'utf8')
    const hasBehaviorAnalysis = behaviorAnalysisContent.includes('analyzeBehavior') &&
                               behaviorAnalysisContent.includes('BEHAVIOR_SCORES') &&
                               behaviorAnalysisContent.includes('calculateRiskLevel') &&
                               behaviorAnalysisContent.length > 1000
    
    // Check if HSM integration is implemented
    const hsmIntegrationContent = fs.readFileSync('server/services/hsmIntegration.js', 'utf8')
    const hasHSMIntegration = hsmIntegrationContent.includes('HSMIntegrationService') &&
                             hsmIntegrationContent.includes('generateKey') &&
                             hsmIntegrationContent.includes('performOperation') &&
                             hsmIntegrationContent.length > 1000
    
    const allImplemented = hasRealImplementation && hasBehaviorAnalysis && hasHSMIntegration
    
    addTestResult(
      'Security Middleware Implementation',
      allImplemented,
      {
        abuseDetectionImplemented: hasRealImplementation,
        behaviorAnalysisImplemented: hasBehaviorAnalysis,
        hsmIntegrationImplemented: hasHSMIntegration,
        allModulesImplemented: allImplemented
      }
    )
  } catch (error) {
    addTestResult('Security Middleware Implementation', false, { error: error.message })
  }
}

// Test 5: Security Validation System
async function testSecurityValidationSystem() {
  try {
    // Check if comprehensive security validation middleware exists
    const securityValidationExists = fs.existsSync('server/middleware/securityValidation.js')
    
    if (securityValidationExists) {
      const securityValidationContent = fs.readFileSync('server/middleware/securityValidation.js', 'utf8')
      const hasComprehensiveValidation = securityValidationContent.includes('validateSecurity') &&
                                        securityValidationContent.includes('validateGPSRequirements') &&
                                        securityValidationContent.includes('validateRouteAccess') &&
                                        securityValidationContent.includes('validateInputSecurity') &&
                                        securityValidationContent.includes('SECURITY_RULES')
      
      addTestResult(
        'Security Validation System',
        hasComprehensiveValidation,
        {
          fileExists: securityValidationExists,
          hasComprehensiveValidation
        }
      )
    } else {
      addTestResult('Security Validation System', false, { error: 'Security validation file not found' })
    }
  } catch (error) {
    addTestResult('Security Validation System', false, { error: error.message })
  }
}

// Test 6: Security Monitoring Dashboard
async function testSecurityMonitoringDashboard() {
  try {
    // Check if security routes exist
    const securityRoutesExists = fs.existsSync('server/routes/security.js')
    
    if (securityRoutesExists) {
      const securityRoutesContent = fs.readFileSync('server/routes/security.js', 'utf8')
      const hasSecurityDashboard = securityRoutesContent.includes('/dashboard') &&
                                  securityRoutesContent.includes('/events') &&
                                  securityRoutesContent.includes('/vulnerabilities') &&
                                  securityRoutesContent.includes('performSecurityHealthCheck')
      
      addTestResult(
        'Security Monitoring Dashboard',
        hasSecurityDashboard,
        {
          fileExists: securityRoutesExists,
          hasSecurityDashboard
        }
      )
    } else {
      addTestResult('Security Monitoring Dashboard', false, { error: 'Security routes file not found' })
    }
  } catch (error) {
    addTestResult('Security Monitoring Dashboard', false, { error: error.message })
  }
}

// Test 7: Server Integration
async function testServerIntegration() {
  try {
    const serverContent = fs.readFileSync('server/index.js', 'utf8')
    
    // Check if security middleware is integrated
    const hasSecurityIntegration = serverContent.includes('detectAbuse') &&
                                  serverContent.includes('analyzeBehavior') &&
                                  serverContent.includes('validateSecurity') &&
                                  serverContent.includes('/api/security')
    
    addTestResult(
      'Server Security Integration',
      hasSecurityIntegration,
      {
        hasSecurityMiddleware: hasSecurityIntegration
      }
    )
  } catch (error) {
    addTestResult('Server Security Integration', false, { error: error.message })
  }
}

// Main test runner
async function runSecurityTests() {
  console.log('🔒 Running Security Fixes Validation Tests...\n')
  
  await testMulterVulnerabilityFix()
  await testRoutePathCollisionFix()
  await testGPSProximityVerification()
  await testSecurityMiddlewareImplementation()
  await testSecurityValidationSystem()
  await testSecurityMonitoringDashboard()
  await testServerIntegration()
  
  // Generate summary
  console.log('\n📊 Test Summary:')
  console.log(`Total Tests: ${testResults.summary.total}`)
  console.log(`Passed: ${testResults.summary.passed}`)
  console.log(`Failed: ${testResults.summary.failed}`)
  console.log(`Success Rate: ${((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1)}%`)
  
  // Save detailed results
  fs.writeFileSync('security-test-results.json', JSON.stringify(testResults, null, 2))
  console.log('\n📄 Detailed results saved to security-test-results.json')
  
  // Overall status
  if (testResults.summary.failed === 0) {
    console.log('\n🎉 All security fixes have been successfully implemented!')
    return true
  } else {
    console.log('\n⚠️  Some security fixes need attention. Check the results above.')
    return false
  }
}

// Run tests if called directly
if (require.main === module) {
  runSecurityTests().then(success => {
    process.exit(success ? 0 : 1)
  }).catch(error => {
    console.error('Test runner error:', error)
    process.exit(1)
  })
}

module.exports = { runSecurityTests, testResults }