import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../providers/AuthProvider'
import { Power, Package, IndianRupee, Star, TrendingUp, Calendar, Map } from 'lucide-react'

const DriverDashboard: React.FC = () => {
  const { user } = useAuth()
  const [isOnline, setIsOnline] = useState(false)

  const toggleOnlineStatus = () => {
    setIsOnline(!isOnline)
    // TODO: Call API to update status
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Driver Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Welcome back, {user?.name}! Ready to earn fair?
            </p>
          </div>
          
          {/* Online/Offline Toggle */}
          <button
            onClick={toggleOnlineStatus}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              isOnline 
                ? 'bg-success-600 hover:bg-success-700 text-white' 
                : 'bg-gray-600 hover:bg-gray-700 text-white'
            }`}
          >
            <Power className="h-5 w-5" />
            <span>{isOnline ? 'Online' : 'Offline'}</span>
          </button>
        </div>

        {/* Quick Actions */}
        <div className="mb-8 flex space-x-4">
          <Link
            to="/driver/map"
            className="inline-flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <Map className="h-5 w-5" />
            <span>Open Map</span>
          </Link>
        </div>

        {/* Earnings Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-success-100 rounded-lg">
                <IndianRupee className="h-6 w-6 text-success-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Today</p>
                <p className="text-2xl font-bold">₹0</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">This Week</p>
                <p className="text-2xl font-bold">₹0</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-warning-100 rounded-lg">
                <Calendar className="h-6 w-6 text-warning-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">This Month</p>
                <p className="text-2xl font-bold">₹0</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Star className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Rating</p>
                <p className="text-2xl font-bold">5.0</p>
              </div>
            </div>
          </div>
        </div>

        {/* Available Deliveries */}
        {isOnline ? (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Available Deliveries</h2>
              <p className="text-gray-600 text-sm mt-1">
                Choose deliveries that work for you - no forced acceptance
              </p>
            </div>
            <div className="p-8 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No deliveries available right now</p>
              <p className="text-gray-500 text-sm mt-2">
                Stay online and we'll notify you when new deliveries arrive
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow">
            <div className="p-8 text-center">
              <Power className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">You're currently offline</p>
              <button
                onClick={toggleOnlineStatus}
                className="btn-primary"
              >
                Go Online to Start Earning
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DriverDashboard