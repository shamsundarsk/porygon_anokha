import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import FareBreakdown from '../components/FareBreakdown'
import { 
  Power, 
  MapPin, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Truck,
  IndianRupee,
  Star,
  TrendingUp,
  Calendar,
  Navigation,
  Phone
} from 'lucide-react'

const DriverDashboard: React.FC = () => {
  const { user } = useAuth()
  const [isOnline, setIsOnline] = useState(false)
  const [currentBooking, setCurrentBooking] = useState<any>(null)
  const [availableBookings, setAvailableBookings] = useState([])
  const [earnings, setEarnings] = useState({
    today: 0,
    thisWeek: 0,
    thisMonth: 0
  })
  const [stats, setStats] = useState({
    totalTrips: 0,
    rating: 0,
    completionRate: 0,
    onTimeRate: 0
  })
  const [waitingTimer, setWaitingTimer] = useState(0)
  const [waitingActive, setWaitingActive] = useState(false)

  useEffect(() => {
    fetchDriverData()
    fetchAvailableBookings()
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (waitingActive) {
      interval = setInterval(() => {
        setWaitingTimer(prev => prev + 1)
      }, 60000) // Update every minute
    }
    return () => clearInterval(interval)
  }, [waitingActive])

  const fetchDriverData = async () => {
    try {
      const token = localStorage.getItem('fairload_token')
      const response = await fetch('/api/drivers/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setEarnings(data.earnings)
        setStats(data.stats)
        setCurrentBooking(data.currentBooking)
        setIsOnline(data.isOnline)
      }
    } catch (error) {
      console.error('Failed to fetch driver data:', error)
    }
  }

  const fetchAvailableBookings = async () => {
    try {
      const token = localStorage.getItem('fairload_token')
      const response = await fetch('/api/deliveries/available', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setAvailableBookings(data)
      }
    } catch (error) {
      console.error('Failed to fetch available bookings:', error)
    }
  }

  const toggleOnlineStatus = async () => {
    try {
      const token = localStorage.getItem('fairload_token')
      const response = await fetch('/api/drivers/toggle-status', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        setIsOnline(!isOnline)
      }
    } catch (error) {
      console.error('Failed to toggle status:', error)
    }
  }

  const acceptBooking = async (bookingId: string) => {
    try {
      const token = localStorage.getItem('fairload_token')
      const response = await fetch(`/api/deliveries/${bookingId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const booking = await response.json()
        setCurrentBooking(booking)
        fetchAvailableBookings()
      }
    } catch (error) {
      console.error('Failed to accept booking:', error)
    }
  }

  const startWaitingTimer = () => {
    setWaitingActive(true)
    setWaitingTimer(0)
  }

  const stopWaitingTimer = () => {
    setWaitingActive(false)
  }

  const completeBooking = async () => {
    if (!currentBooking) return

    try {
      const token = localStorage.getItem('fairload_token')
      const response = await fetch(`/api/deliveries/${currentBooking.id}/status`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          waitingTime: waitingTimer
        })
      })
      if (response.ok) {
        setCurrentBooking(null)
        setWaitingActive(false)
        setWaitingTimer(0)
        fetchDriverData()
        fetchAvailableBookings()
      }
    } catch (error) {
      console.error('Failed to complete booking:', error)
    }
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
              Welcome back, {user?.name}!
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

        {/* Current Booking */}
        {currentBooking && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Current Trip</h2>
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Truck className="h-5 w-5 text-primary-600" />
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-primary-50 text-primary-600">
                    IN PROGRESS
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  #{currentBooking.id.slice(0, 8)}
                </span>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <MapPin className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-600">Pickup:</span>
                  </div>
                  <p className="font-medium ml-6">{currentBooking.pickup.address}</p>
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Navigation className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-gray-600">Drop:</span>
                  </div>
                  <p className="font-medium ml-6">{currentBooking.dropoff.address}</p>
                </div>
              </div>

              {/* Waiting Time Timer */}
              <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-warning-600" />
                    <span className="font-medium text-warning-800">
                      Waiting Time: {waitingTimer} minutes
                    </span>
                  </div>
                  <div className="space-x-2">
                    {!waitingActive ? (
                      <button
                        onClick={startWaitingTimer}
                        className="btn-primary text-sm"
                      >
                        Start Timer
                      </button>
                    ) : (
                      <button
                        onClick={stopWaitingTimer}
                        className="bg-warning-600 hover:bg-warning-700 text-white px-3 py-1 rounded text-sm"
                      >
                        Stop Timer
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-warning-700 text-sm mt-2">
                  ₹{(waitingTimer * 2).toFixed(2)} earned from waiting time
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <FareBreakdown 
                  fareBreakdown={{
                    ...currentBooking.fareBreakdown,
                    waitingTime: waitingTimer * 2
                  }} 
                  showDriverEarnings={true} 
                />
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-600" />
                    <span className="text-sm">Customer: {currentBooking.customer?.phone}</span>
                  </div>
                  {currentBooking.customerNotes && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <strong>Notes:</strong> {currentBooking.customerNotes}
                      </p>
                    </div>
                  )}
                  <button
                    onClick={completeBooking}
                    className="w-full btn-primary py-3"
                  >
                    Complete Trip
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Earnings Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-success-100 rounded-lg">
                <IndianRupee className="h-6 w-6 text-success-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Today</p>
                <p className="text-2xl font-bold">₹{earnings.today}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">This Week</p>
                <p className="text-2xl font-bold">₹{earnings.thisWeek}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-warning-100 rounded-lg">
                <Calendar className="h-6 w-6 text-warning-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">This Month</p>
                <p className="text-2xl font-bold">₹{earnings.thisMonth}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Star className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Rating</p>
                <p className="text-2xl font-bold">{stats.rating.toFixed(1)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Available Bookings */}
        {isOnline && !currentBooking && (
          <div className="card">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Available Bookings</h2>
              <p className="text-gray-600 text-sm mt-1">
                Choose bookings that work for you - no forced acceptance
              </p>
            </div>
            <div className="divide-y divide-gray-200">
              {availableBookings.length === 0 ? (
                <div className="p-8 text-center">
                  <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No bookings available right now</p>
                  <p className="text-gray-500 text-sm mt-2">
                    Stay online and we'll notify you when new bookings arrive
                  </p>
                </div>
              ) : (
                availableBookings.map((booking: any) => (
                  <div key={booking.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="grid md:grid-cols-2 gap-4 mb-3">
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium">{booking.pickup.address}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Navigation className="h-4 w-4 text-red-600" />
                            <span className="text-sm font-medium">{booking.dropoff.address}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>Distance: ~{booking.estimatedDistance}km</span>
                          <span>Time: ~{booking.estimatedTime}min</span>
                          <span className="font-medium text-success-600">
                            Earn: ₹{booking.fareBreakdown.driverEarnings}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary-600">
                            ₹{booking.fareBreakdown.totalFare}
                          </p>
                          <p className="text-xs text-gray-500">Total Fare</p>
                        </div>
                        <button
                          onClick={() => acceptBooking(booking.id)}
                          className="btn-primary"
                        >
                          Accept
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Performance Stats */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <div className="card p-6 text-center">
            <Truck className="h-8 w-8 text-primary-600 mx-auto mb-3" />
            <p className="text-2xl font-bold">{stats.totalTrips}</p>
            <p className="text-gray-600">Total Trips</p>
          </div>

          <div className="card p-6 text-center">
            <CheckCircle className="h-8 w-8 text-success-600 mx-auto mb-3" />
            <p className="text-2xl font-bold">{stats.completionRate}%</p>
            <p className="text-gray-600">Completion Rate</p>
          </div>

          <div className="card p-6 text-center">
            <Clock className="h-8 w-8 text-warning-600 mx-auto mb-3" />
            <p className="text-2xl font-bold">{stats.onTimeRate}%</p>
            <p className="text-gray-600">On-Time Rate</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DriverDashboard