import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'
import { AuthProvider, useAuth } from './providers/AuthProvider'
import DriverDashboard from './components/dashboards/DriverDashboard'
import CustomerDashboard from './components/dashboards/CustomerDashboard'
import BusinessDashboard from './components/dashboards/BusinessDashboard'
import OwnerDashboard from './components/dashboards/OwnerDashboard'
import CustomerLogin from './components/auth/CustomerLogin'
import DriverLogin from './components/auth/DriverLogin'
import BusinessLogin from './components/auth/BusinessLogin'
import DatabaseSetupNotice from './components/DatabaseSetupNotice'
import UserTypeSelector from './components/UserTypeSelector'
import './index.css'

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// Landing Page - User Type Selection
const LandingPage = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-black/40"></div>
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
        style={{
          backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800"><rect fill="%23334155" width="1200" height="800"/><path fill="%23475569" d="M200 400h800v200H200z"/><circle fill="%236366f1" cx="300" cy="500" r="50"/><circle fill="%236366f1" cx="900" cy="500" r="50"/></svg>')`
        }}
      ></div>
      
      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-8">
        <div className="max-w-4xl w-full text-center">
          {/* Logo and Title */}
          <div className="mb-12">
            <div className="flex items-center justify-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center">
                <span className="text-3xl">🚛</span>
              </div>
              <h1 className="text-5xl font-bold text-white">FairLoad</h1>
            </div>
            <p className="text-xl text-blue-100 mb-4">
              Fair prices. Transparent deliveries. Trusted logistics.
            </p>
            <p className="text-blue-200">
              Choose your role to get started with India's most trusted logistics platform
            </p>
          </div>

          {/* User Type Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {/* Customer Card */}
            <div 
              onClick={() => navigate('/customer-login')}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-8 hover:bg-white/20 transition-all cursor-pointer group border border-white/20"
            >
              <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <span className="text-2xl text-white">👤</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Customer</h3>
              <p className="text-blue-100 mb-6">
                Send packages, track deliveries, and manage your shipments with transparent pricing.
              </p>
              <div className="space-y-2 text-sm text-blue-200">
                <div className="flex items-center justify-center space-x-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <span>Personal & Business deliveries</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <span>Real-time tracking</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <span>Pool delivery savings</span>
                </div>
              </div>
              <button className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                Continue as Customer
              </button>
            </div>

            {/* Driver Card */}
            <div 
              onClick={() => navigate('/driver-login')}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-8 hover:bg-white/20 transition-all cursor-pointer group border border-white/20"
            >
              <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <span className="text-2xl text-white">🚗</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Driver</h3>
              <p className="text-blue-100 mb-6">
                Earn money by delivering packages. Flexible hours, fair payments, and transparent earnings.
              </p>
              <div className="space-y-2 text-sm text-blue-200">
                <div className="flex items-center justify-center space-x-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <span>Flexible working hours</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <span>Fair payment system</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <span>Navigation assistance</span>
                </div>
              </div>
              <button className="mt-6 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                Continue as Driver
              </button>
            </div>

            {/* Business/Owner Card */}
            <div 
              onClick={() => navigate('/business-login')}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-8 hover:bg-white/20 transition-all cursor-pointer group border border-white/20"
            >
              <div className="w-16 h-16 bg-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <span className="text-2xl text-white">🏢</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Business</h3>
              <p className="text-blue-100 mb-6">
                Manage enterprise logistics, fleet operations, and business deliveries at scale.
              </p>
              <div className="space-y-2 text-sm text-blue-200">
                <div className="flex items-center justify-center space-x-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <span>Enterprise solutions</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <span>Fleet management</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <span>Analytics & reporting</span>
                </div>
              </div>
              <button className="mt-6 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                Continue as Business
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="flex justify-center space-x-12 text-center">
            <div>
              <div className="text-3xl font-bold text-white">50k+</div>
              <div className="text-blue-200 text-sm">Verified Drivers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">120+</div>
              <div className="text-blue-200 text-sm">Cities Covered</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">98.5%</div>
              <div className="text-blue-200 text-sm">Success Rate</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Login Form Component
const LoginForm = () => {
  // This component is no longer used - users go to specific login pages
  return null
}

// Registration Page
const RegisterPage = () => {
  // This component is no longer used - users go to specific login pages
  return null
}

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

// Dashboard Router
const DashboardRouter = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  // Get user type from user object or localStorage
  let userType = user.userType
  if (!userType && user.id) {
    userType = localStorage.getItem(`userType_${user.id}`) as 'B2C' | 'B2B' | 'DRIVER' | 'OWNER'
  }

  console.log('DashboardRouter - User:', user, 'UserType:', userType) // Debug log

  // If still no user type, show selector
  if (!userType) {
    return <UserTypeSelector />
  }

  // Direct navigation based on user type
  switch (userType) {
    case 'B2C':
      return <Navigate to="/customer-dashboard" replace />
    case 'B2B':
      return <Navigate to="/business-dashboard" replace />
    case 'DRIVER':
      return <Navigate to="/driver-dashboard" replace />
    case 'OWNER':
      return <Navigate to="/owner-dashboard" replace />
    default:
      return <UserTypeSelector />
  }
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen">
            <DatabaseSetupNotice />
            <Routes>
              <Route path="/" element={<LandingPage />} />
              
              {/* Specific Login Pages */}
              <Route path="/customer-login" element={<CustomerLogin />} />
              <Route path="/driver-login" element={<DriverLogin />} />
              <Route path="/business-login" element={<BusinessLogin />} />
              
              {/* Dashboard Router */}
              <Route path="/dashboard" element={<DashboardRouter />} />
              
              {/* Specific Dashboards */}
              <Route path="/customer-dashboard" element={
                <ProtectedRoute>
                  <CustomerDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/business-dashboard" element={
                <ProtectedRoute>
                  <BusinessDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/driver-dashboard" element={
                <ProtectedRoute>
                  <DriverDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/owner-dashboard" element={
                <ProtectedRoute>
                  <OwnerDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#1e293b',
                  color: '#fff',
                },
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App