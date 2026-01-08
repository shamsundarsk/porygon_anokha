# 🚛 PakkaDrop - Secure Logistics Platform

**Tagline:** Enterprise-grade logistics platform with military-level security.

A comprehensive, production-ready logistics platform with enterprise-grade security features, built for scale and reliability.

## 🔒 **Security-First Architecture**

✅ **Authentication**: JWT with refresh token rotation, account lockout, 2FA ready  
✅ **Authorization**: Role-based access control (RBAC) with resource ownership  
✅ **API Security**: Rate limiting, input validation, CORS, security headers  
✅ **Payment Security**: PCI-compliant, idempotency keys, webhook verification  
✅ **Real-time Security**: Authenticated Socket.IO with permission checks  
✅ **Data Protection**: Field-level encryption, audit logging, tamper detection  
✅ **Monitoring**: Comprehensive logging, anomaly detection, security alerts  
✅ **Defensive**: Honeypots, canary records, intrusion detection  

## 🚀 **Quick Start**

### **1. Security Setup (Required)**
```bash
# Install dependencies
npm install

# Run security setup (generates secrets, creates .env)
npm run setup-security

# Edit .env file with your actual credentials
nano .env
```

### **2. Database Setup**
```bash
# Push schema to database
npx prisma db push

# Generate Prisma client
npx prisma generate
```

### **3. Start Development**
```bash
# Start both client and server
npm run dev

# Or start server only
npm run server
```

### **4. Security Testing**
```bash
# Run comprehensive security tests
npm run test-security

# Run vulnerability scan
npm run security-scan

# Run audit
npm run audit
```

## 🛡️ **Security Features**

### **Authentication & Authorization**
- JWT with refresh token rotation
- Account lockout after failed attempts
- Password strength requirements
- Role-based access control (RBAC)
- Resource ownership verification
- Device/session binding

### **API Security**
- Global and endpoint-specific rate limiting
- Input validation with Joi schemas
- Request sanitization
- Security headers (Helmet.js)
- CORS configuration
- HTTP Parameter Pollution protection

### **Payment Security**
- Idempotency keys for duplicate prevention
- Amount verification against delivery fares
- Webhook signature verification
- Fare tampering detection
- Payment audit trail
- PCI compliance ready

### **Real-time Security**
- Socket.IO authentication required
- Room-based authorization
- Message rate limiting
- Event permission checks
- Location data validation

### **Data Protection**
- Field-level encryption for PII
- Data masking in API responses
- Comprehensive audit logging
- Tamper detection algorithms
- Row-level security policies

### **Monitoring & Defense**
- Security event tracking
- Anomaly detection
- Honeypot endpoints
- Canary records
- Intrusion detection
- Automatic threat response

## 📋 **Environment Configuration**

### **Required Variables**
```env
# Database
DATABASE_URL="postgresql://username:password@host:port/database"

# JWT Secrets (32+ characters each)
JWT_SECRET="your-generated-secret"
JWT_REFRESH_SECRET="your-generated-refresh-secret"

# Encryption (64 character hex)
ENCRYPTION_KEY="your-generated-encryption-key"

# Redis for Rate Limiting
REDIS_URL="redis://localhost:6379"

# CORS Origins
ALLOWED_ORIGINS="http://localhost:3005,http://localhost:19006"
```

### **API Keys**
```env
# Maps
MAPMYINDIA_API_KEY="your-mapmyindia-key"
MAPBOX_ACCESS_TOKEN="your-mapbox-token"

# Payment
RAZORPAY_KEY_ID="your-razorpay-key"
RAZORPAY_KEY_SECRET="your-razorpay-secret"
RAZORPAY_WEBHOOK_SECRET="your-webhook-secret"

# Communication
TWILIO_ACCOUNT_SID="your-twilio-sid"
TWILIO_AUTH_TOKEN="your-twilio-token"
```

## 🔧 **API Endpoints**

### **Authentication**
- `POST /api/auth/register` - User registration with validation
- `POST /api/auth/login` - Secure login with lockout protection
- `POST /api/auth/refresh` - Refresh token rotation
- `POST /api/auth/logout` - Secure logout
- `POST /api/auth/logout-all` - Force logout all devices

### **Deliveries**
- `GET /api/deliveries/my-deliveries` - User's deliveries (ownership verified)
- `POST /api/deliveries` - Create delivery with fare validation
- `PUT /api/deliveries/:id/status` - Update status (authorization required)
- `GET /api/deliveries/:id/track` - Track delivery (permission checked)

### **Payments**
- `POST /api/payments/create-intent` - Create secure payment
- `POST /api/payments/verify` - Verify payment with signature
- `POST /api/payments/webhook` - Webhook with signature verification

### **Admin** (Admin role required)
- `GET /api/admin/stats` - Platform statistics
- `GET /api/admin/users` - User management
- `POST /api/admin/users/:id/lock` - Lock user account

## 🔌 **Secure Real-time Features**

### **Authentication Required**
```javascript
const socket = io('http://localhost:5004', {
  auth: { token: 'your-jwt-token' }
})
```

### **Authorized Events**
- `driver-location-update` - Driver location (drivers only)
- `track-delivery` - Join tracking room (ownership verified)
- `delivery-status-update` - Status updates (authorized users)
- `chat-message` - Delivery chat (participants only)

## 📊 **Security Monitoring**

### **Rate Limits**
- Global: 1000 requests/15min per IP
- Auth: 5 requests/15min per IP
- Payment: 3 requests/1min per IP
- Admin: 50 requests/5min per IP

### **Account Security**
- Password: 8+ chars, uppercase, lowercase, number, special char
- Lockout: 5 failed attempts = 30 minute lock
- Tokens: 15min access, 7 day refresh with rotation

### **Audit Logging**
All sensitive operations logged:
- User registration/login/logout
- Role changes
- Payment transactions
- Delivery status changes
- Admin actions

### **Security Events**
Monitored and alerted:
- Failed login attempts
- Rate limit exceeded
- Unauthorized access attempts
- Token manipulation
- Payment fraud attempts
- Suspicious activity patterns

## 🧪 **Security Testing**

### **Automated Tests**
```bash
# Run all security tests
npm run test-security

# Specific test categories
node test-security.js --category=auth
node test-security.js --category=payment
node test-security.js --category=api
```

### **Manual Testing Checklist**
- [ ] SQL injection attempts
- [ ] XSS payload injection
- [ ] CSRF token bypass
- [ ] Rate limit testing
- [ ] Authentication bypass
- [ ] Authorization escalation
- [ ] Payment manipulation
- [ ] Socket.IO security

## 🚀 **Production Deployment**

### **Pre-deployment Checklist**
- [ ] All secrets rotated and secured
- [ ] Environment validation passes
- [ ] Security headers configured
- [ ] Rate limiting active
- [ ] SSL/TLS certificates installed
- [ ] Database encryption enabled
- [ ] Monitoring and alerting setup
- [ ] Backup and recovery tested

### **Security Hardening**
```bash
# Generate production secrets
npm run setup-security

# Run security audit
npm run audit
npm run security-scan

# Test all security measures
npm run test-security
```

## 📚 **Documentation**

- [SECURITY.md](./SECURITY.md) - Comprehensive security guide
- [API Documentation](./docs/api.md) - Complete API reference
- [Deployment Guide](./docs/deployment.md) - Production deployment
- [Security Testing](./docs/security-testing.md) - Security procedures

## 🔗 **Security Resources**

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

## 📞 **Support**

- **Security Issues**: security@pakkadrop.com
- **General Support**: support@pakkadrop.com
- **Documentation**: [docs.pakkadrop.com](https://docs.pakkadrop.com)

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**⚠️ Security Notice**: This platform implements enterprise-grade security measures. Even experienced cybersecurity participants should not be able to find meaningful exploits. Always follow security best practices and keep dependencies updated.

1. **Register New Account**: Go to http://localhost:3001/auth
2. **Choose User Type**: Customer, Enterprise, or Driver
3. **Start Using**: Full functionality available immediately

### **Test User Types**
- **Customer (B2C)**: Personal delivery management
- **Enterprise (B2B)**: Business logistics with analytics
- **Driver**: Delivery partner dashboard with earnings
- **Admin**: Platform management (register as admin)

## 🚀 **Key Features**

### **🎯 Core Platform Features**
- **Transparent Pricing**: Every charge explained with detailed breakdowns
- **Fair Driver Compensation**: Auto waiting time, fuel adjustments, cancellation protection
- **Real-time Tracking**: Live GPS tracking with MapMyIndia integration
- **Voice Commands**: Hands-free operation with intelligent voice recognition
- **Mobile-First**: React Native compatible for iOS/Android apps
- **B2B & B2C Support**: Separate dashboards and features for different user types

### **👥 User Types & Dashboards**
- **Customers (B2C)**: Personal delivery management
- **Enterprise (B2B)**: Business logistics with analytics and bulk operations
- **Delivery Partners**: Driver dashboard with earnings and route optimization
- **Admin**: Platform management and analytics

### **🗺️ Advanced Mapping**
- **MapMyIndia Integration**: Accurate Indian maps and routing
- **Live Driver Tracking**: Real-time location updates
- **Route Optimization**: AI-powered route suggestions
- **Offline Maps**: Works without internet connectivity

### **🎤 Voice Assistant**
- **Multi-language Support**: Hindi, English, and regional languages
- **Smart Commands**: "Go online", "Accept delivery", "Navigate to pickup"
- **Hands-free Operation**: Perfect for drivers on the road

## 🛠 **Tech Stack**

### **Frontend**
- **React 18** with TypeScript
- **React Native Web** for mobile compatibility
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Query** for data management
- **Zustand** for state management

### **Backend**
- **Node.js** with Express
- **PostgreSQL** with Prisma ORM
- **Socket.io** for real-time features
- **JWT** authentication
- **Cloudinary** for file uploads

### **Maps & Location**
- **MapMyIndia API** for Indian maps
- **Mapbox** as fallback
- **Real-time GPS tracking**
- **Geofencing** capabilities

### **Mobile & Voice**
- **React Native Web** compatibility
- **Web Speech API** for voice recognition
- **Push notifications** support
- **Offline-first** architecture

## 📦 **Installation & Setup**

### **Prerequisites**
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### **1. Clone Repository**
```bash
git clone <repository-url>
cd pakkadrop-platform
```

### **2. Install Dependencies**
```bash
npm install
```

### **3. Database Setup**

#### **Option A: Neon (Recommended)**
1. Create account at [neon.tech](https://neon.tech)
2. Create new project
3. Copy connection string
4. Update `.env` file:
```env
DATABASE_URL="postgresql://username:password@ep-xxx.neon.tech/pakkadrop_db?sslmode=require"
```

#### **Option B: Supabase**
1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Go to Settings > Database
4. Copy connection string
5. Update `.env` file:
```env
DATABASE_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"
```

#### **Option C: Local PostgreSQL**
```bash
# Install PostgreSQL
brew install postgresql  # macOS
sudo apt install postgresql  # Ubuntu

# Create database
createdb pakkadrop_db

# Update .env
DATABASE_URL="postgresql://username:password@localhost:5432/pakkadrop_db"
```

### **4. Environment Configuration**
```bash
cp .env.example .env
```

Update `.env` with your credentials:
```env
# Database
DATABASE_URL="your-database-connection-string"

# JWT
JWT_SECRET="your-super-secret-jwt-key"

# Maps (Get from MapMyIndia/Mapbox)
MAPMYINDIA_API_KEY="your-mapmyindia-key"
MAPBOX_ACCESS_TOKEN="your-mapbox-token"

# Payment (Get from Razorpay/Stripe)
RAZORPAY_KEY_ID="your-razorpay-key"
STRIPE_SECRET_KEY="your-stripe-key"

# SMS/Email (Get from Twilio/Gmail)
TWILIO_ACCOUNT_SID="your-twilio-sid"
SMTP_USER="your-email@gmail.com"
```

### **5. Database Migration**
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma db push

# Seed database (optional)
npm run db:seed
```

### **6. Start Development**
```bash
# Start both frontend and backend
npm run dev

# Or start separately
npm run server  # Backend on :5001
npm run client  # Frontend on :3000
```

## 🌐 **API Endpoints**

### **Authentication**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify JWT token
- `POST /api/auth/request-otp` - Request OTP
- `POST /api/auth/verify-otp` - Verify OTP

### **Deliveries**
- `POST /api/deliveries/calculate-fare` - Calculate delivery fare
- `POST /api/deliveries` - Create new delivery
- `GET /api/deliveries/my-deliveries` - Get user deliveries
- `GET /api/deliveries/current` - Get active deliveries
- `GET /api/deliveries/available` - Get available deliveries (drivers)
- `POST /api/deliveries/:id/accept` - Accept delivery
- `PUT /api/deliveries/:id/status` - Update delivery status
- `POST /api/deliveries/:id/cancel` - Cancel delivery

### **Maps & Location**
- `POST /api/maps/geocode` - Convert address to coordinates
- `POST /api/maps/route` - Get route between points
- `GET /api/maps/nearby-drivers` - Find nearby drivers

### **Real-time Events (Socket.io)**
- `driver-location-update` - Driver location updates
- `track-delivery` - Track delivery progress
- `voice-command` - Voice command processing
- `delivery-update` - Delivery status updates

## 📱 **Mobile App Setup (React Native)**

### **1. Install Expo CLI**
```bash
npm install -g @expo/cli
```

### **2. Create Mobile App**
```bash
npx create-expo-app PakkaDropMobile --template blank-typescript
cd PakkaDropMobile
```

### **3. Install Dependencies**
```bash
npm install react-native-web
npm install @react-navigation/native @react-navigation/stack
npm install react-native-maps react-native-geolocation-service
npm install @react-native-voice/voice
```

### **4. Copy Shared Code**
```bash
# Copy shared components and services
cp -r ../src/components ./src/
cp -r ../src/services ./src/
cp -r ../src/types ./src/
```

### **5. Start Mobile Development**
```bash
npx expo start
```

## 🎤 **Voice Commands**

### **Navigation Commands**
- "Go to dashboard"
- "Open map"
- "Show my deliveries"

### **Delivery Commands**
- "Create new delivery"
- "Accept delivery"
- "Mark picked up"
- "Mark delivered"

### **Driver Commands**
- "Go online"
- "Go offline"
- "Start navigation"

### **General Commands**
- "Help"
- "What can I say"

## 🗺️ **Map Integration**

### **MapMyIndia Setup**
1. Register at [mapmyindia.com](https://www.mapmyindia.com)
2. Get API key from developer console
3. Add to `.env` file
4. Enable required APIs:
   - Geocoding API
   - Distance Matrix API
   - Directions API

### **Mapbox Setup (Fallback)**
1. Register at [mapbox.com](https://www.mapbox.com)
2. Get access token
3. Add to `.env` file

## 💳 **Payment Integration**

### **Razorpay Setup**
1. Register at [razorpay.com](https://razorpay.com)
2. Get API keys from dashboard
3. Add to `.env` file
4. Configure webhooks for payment updates

### **Stripe Setup (International)**
1. Register at [stripe.com](https://stripe.com)
2. Get API keys
3. Add to `.env` file

## 📊 **Analytics & Monitoring**

### **Built-in Analytics**
- Delivery completion rates
- Driver performance metrics
- Customer satisfaction scores
- Revenue tracking
- Route optimization data

### **External Integrations**
- Google Analytics for web tracking
- Mixpanel for user behavior
- Sentry for error monitoring
- LogRocket for session replay

## 🚀 **Deployment**

### **Frontend (Vercel)**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### **Backend (Railway/Render)**
```bash
# Railway
npm install -g @railway/cli
railway login
railway init
railway up

# Or Render
# Connect GitHub repo to Render dashboard
```

### **Database (Production)**
- **Neon**: Automatic scaling and backups
- **Supabase**: Built-in auth and real-time features
- **AWS RDS**: Enterprise-grade PostgreSQL

## 🔒 **Security Features**

- **JWT Authentication** with refresh tokens
- **Rate Limiting** on API endpoints
- **Input Validation** with Joi/Zod
- **SQL Injection Protection** via Prisma
- **CORS Configuration** for cross-origin requests
- **Helmet.js** for security headers
- **bcrypt** for password hashing

## 📈 **Performance Optimization**

- **React Query** for efficient data fetching
- **Code Splitting** with React.lazy
- **Image Optimization** with Cloudinary
- **CDN Integration** for static assets
- **Database Indexing** for fast queries
- **Redis Caching** for session management

## 🧪 **Testing**

### **Frontend Testing**
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e
```

### **Backend Testing**
```bash
# API tests
npm run test:api

# Load testing
npm run test:load
```

## 📚 **Documentation**

- **API Documentation**: Available at `/api/docs` (Swagger)
- **Component Storybook**: `npm run storybook`
- **Database Schema**: See `prisma/schema.prisma`
- **Architecture Docs**: See `/docs` folder

## 🤝 **Contributing**

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 **Support**

- **Documentation**: [docs.pakkadrop.com](https://docs.pakkadrop.com)
- **Community**: [community.pakkadrop.com](https://community.pakkadrop.com)
- **Email**: support@pakkadrop.com
- **Discord**: [discord.gg/pakkadrop](https://discord.gg/pakkadrop)

---

**PakkaDrop** - Because logistics should be fair for everyone. 🚛✨

Built with ❤️ for the Indian logistics ecosystem.