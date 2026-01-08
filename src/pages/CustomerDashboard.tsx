import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useBooking } from '../contexts/BookingContext'
import { 
  Plus, 
  MapPin, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Truck,
  IndianRupee,
  Calendar,
  Star
} from 'lucide-react'

const CustomerDashboard: React.FC = () => {
  const { user } = useAuth()
  const { currentBooking } = useBooking()
  const [bookings, setBookings] = useState([])
  const [stats, setStats] = useState({
    totalBookings: 0,
    completedBookings: 0,
    totalSpent: 0,
    avgRating: 0
  })

  useEffect(() => {
    // Fetch user bookings and stats
    fetchBookings()
    fetchStats()
  }, [])

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('fairload_token')
      const response = await fetch('/api/deliveries/my-deliveries', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setBookings(data)
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('fairload_token')
      const response = await fetch('/api/customers/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-success-600" />
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'in-progress':
        return <Truck className="h-5 w-5 text-primary-600" />
      default:
        return <Clock className="h-5 w-5 text-warning-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-success-600 bg-success-50'
      case 'cancelled':
        return 'text-red-600 bg-red-50'
      case 'in-progress':
        return 'text-primary-600 bg-primary-50'
      default:
        return 'text-warning-600 bg-warning-50'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your bookings and track your logistics
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <Link
            to="/book"
            className="inline-flex items-center space-x-2 btn-primary text-lg px-6 py-3"
          >
            <Plus className="h-5 w-5" />
            <span>New Booking</span>
          </Link>
        </div>

        {/* Current Booking */}
        {currentBooking && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Current Booking</h2>
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(currentBooking.status)}
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentBooking.status)}`}>
                    {currentBooking.status.replace('-', ' ').toUpperCase()}
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  #{currentBooking.id.slice(0, 8)}
                </span>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <MapPin className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-600">From:</span>
                  </div>
                  <p className="font-medium ml-6">{currentBooking.pickup.address}</p>
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <MapPin className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-gray-600">To:</span>
                  </div>
                  <p className="font-medium ml-6">{currentBooking.dropoff.address}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-lg font-bold text-primary-600">
                    ₹{currentBooking.fareBreakdown.totalFare}
                  </span>
                  {currentBooking.waitingTime > 0 && (
                    <span className="text-sm text-gray-600">
                      Waiting: {currentBooking.waitingTime} min
                    </span>
                  )}
                </div>
                <button className="btn-primary">
                  Track Live
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Truck className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold">{stats.totalBookings}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-success-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-success-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold">{stats.completedBookings}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-warning-100 rounded-lg">
                <IndianRupee className="h-6 w-6 text-warning-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold">₹{stats.totalSpent}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Star className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Rating</p>
                <p className="text-2xl font-bold">{stats.avgRating.toFixed(1)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Recent Bookings</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {bookings.length === 0 ? (
              <div className="p-8 text-center">
                <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No bookings yet</p>
                <Link to="/book" className="btn-primary">
                  Create Your First Booking
                </Link>
              </div>
            ) : (
              bookings.slice(0, 5).map((booking: any) => (
                <div key={booking.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {getStatusIcon(booking.status)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                          {booking.status.replace('-', ' ').toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-500">
                          #{booking.id.slice(0, 8)}
                        </span>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4 mb-2">
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-green-600" />
                          <span className="text-sm truncate">{booking.pickup.address}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-red-600" />
                          <span className="text-sm truncate">{booking.dropoff.address}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(booking.createdAt).toLocaleDateString()}</span>
                        </div>
                        <span>₹{booking.fareBreakdown.totalFare}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button className="btn-secondary text-sm">
                        View Details
                      </button>
                      {booking.status === 'completed' && (
                        <button className="btn-primary text-sm">
                          Book Again
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomerDashboard