import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../providers/AuthProvider'
import toast from 'react-hot-toast'

const BusinessLogin = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [userType, setUserType] = useState<'B2B' | 'OWNER'>('B2B')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    companyName: '',
    vehicleType: '',
    vehicleNumber: '',
    fleetSize: ''
  })
  
  const { login, register, loading } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (isLogin) {
        await login(email, password)
        // Navigate based on stored user type or default to business
        const storedType = localStorage.getItem(`userType_${email}`) as 'B2B' | 'OWNER'
        if (storedType === 'OWNER') {
          setTimeout(() => navigate('/owner-dashboard'), 500)
        } else {
          setTimeout(() => navigate('/business-dashboard'), 500)
        }
      } else {
        await register({
          ...formData,
          email,
          password,
          userType
        })
        if (userType === 'OWNER') {
          setTimeout(() => navigate('/owner-dashboard'), 500)
        } else {
          setTimeout(() => navigate('/business-dashboard'), 500)
        }
      }
    } catch (error) {
      // Error handled in AuthProvider
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Back Button */}
        <button 
          onClick={() => navigate('/')}
          className="flex items-center text-slate-600 hover:text-slate-900 mb-6"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-white">🏢</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-900">Business {isLogin ? 'Login' : 'Registration'}</h2>
            <p className="text-slate-600 mt-2">
              {isLogin ? 'Access your business account' : 'Scale your logistics operations'}
            </p>
          </div>

          {/* Toggle Login/Register */}
          <div className="flex bg-slate-100 rounded-lg p-1 mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                isLogin ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                !isLogin ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              Register Business
            </button>
          </div>

          {/* Business Type Selection (only for registration) */}
          {!isLogin && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Business Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setUserType('B2B')}
                  className={`p-3 border rounded-lg text-center transition-colors ${
                    userType === 'B2B'
                      ? 'border-purple-500 bg-purple-50 text-purple-900'
                      : 'border-slate-300 hover:border-slate-400'
                  }`}
                >
                  <div className="text-lg mb-1">🏢</div>
                  <span className="text-sm font-medium">Enterprise</span>
                  <p className="text-xs text-slate-600 mt-1">Large scale logistics</p>
                </button>
                <button
                  type="button"
                  onClick={() => setUserType('OWNER')}
                  className={`p-3 border rounded-lg text-center transition-colors ${
                    userType === 'OWNER'
                      ? 'border-purple-500 bg-purple-50 text-purple-900'
                      : 'border-slate-300 hover:border-slate-400'
                  }`}
                >
                  <div className="text-lg mb-1">🚛</div>
                  <span className="text-sm font-medium">Fleet Owner</span>
                  <p className="text-xs text-slate-600 mt-1">Manage vehicles</p>
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter company name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="+91 98765 43210"
                    required
                  />
                </div>
                
                {userType === 'OWNER' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Primary Vehicle Type</label>
                      <select
                        value={formData.vehicleType}
                        onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        required
                      >
                        <option value="">Select vehicle type</option>
                        <option value="bike">Bikes</option>
                        <option value="auto">Auto Rickshaws</option>
                        <option value="mini-truck">Mini Trucks</option>
                        <option value="pickup">Pickup Trucks</option>
                        <option value="truck">Large Trucks</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Fleet Size</label>
                      <input
                        type="number"
                        value={formData.fleetSize}
                        onChange={(e) => setFormData({ ...formData, fleetSize: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Number of vehicles"
                        required
                      />
                    </div>
                  </>
                )}
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Business Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="business@company.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <svg className="w-4 h-4 text-purple-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-purple-800">Business Benefits</p>
                    <ul className="text-xs text-purple-700 mt-1 space-y-1">
                      <li>• Enterprise-grade logistics</li>
                      <li>• Bulk delivery discounts</li>
                      <li>• Dedicated support</li>
                      <li>• Advanced analytics</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (isLogin ? 'Signing In...' : 'Creating Account...') : (isLogin ? 'Sign In' : 'Register Business')}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-600">
            <p>
              {isLogin ? "New to business logistics? " : "Already have an account? "}
              <button 
                onClick={() => setIsLogin(!isLogin)} 
                className="text-purple-600 hover:text-purple-500 font-medium"
              >
                {isLogin ? 'Register now' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BusinessLogin