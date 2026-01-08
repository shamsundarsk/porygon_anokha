# FairLoad - Full-Scale Fair Logistics Platform

**Tagline:** Logistics that doesn't exploit the people who move your goods.

A complete, production-ready logistics platform built with React, React Native compatibility, Node.js, PostgreSQL, and modern technologies.

## 🚀 **Current Status: FULLY FUNCTIONAL**

✅ **Backend Server**: Running on http://localhost:5003  
✅ **Frontend App**: Running on http://localhost:3005  
✅ **Database**: Supabase PostgreSQL with Firebase Auth  
✅ **Authentication**: Firebase Auth with user types (B2C/B2B/Driver)  
✅ **Professional UI**: Enhanced dashboards for all user types  
✅ **Real-time Features**: Socket.io for live tracking  
✅ **Voice Commands**: Intelligent voice recognition  
✅ **Maps Integration**: MapMyIndia + Mapbox support  
✅ **Mobile Ready**: Responsive design for all devices  

## 🎯 **Quick Start**

### **1. Automatic Setup (Recommended)**
```bash
npm run setup
npm run dev
```

### **2. Manual Setup**
```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Generate database client
npx prisma generate

# Start development servers
npm run dev
```

### **3. Access the Application**
- **Frontend**: http://localhost:3003
- **Backend API**: http://localhost:5002
- **Database Studio**: `npm run db:studio`

## 🎮 **Demo Accounts**

The application runs in demo mode by default. You can:

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
cd fairload-platform
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
DATABASE_URL="postgresql://username:password@ep-xxx.neon.tech/fairload_db?sslmode=require"
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
createdb fairload_db

# Update .env
DATABASE_URL="postgresql://username:password@localhost:5432/fairload_db"
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
npx create-expo-app FairLoadMobile --template blank-typescript
cd FairLoadMobile
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

- **Documentation**: [docs.fairload.com](https://docs.fairload.com)
- **Community**: [community.fairload.com](https://community.fairload.com)
- **Email**: support@fairload.com
- **Discord**: [discord.gg/fairload](https://discord.gg/fairload)

---

**FairLoad** - Because logistics should be fair for everyone. 🚛✨

Built with ❤️ for the Indian logistics ecosystem.