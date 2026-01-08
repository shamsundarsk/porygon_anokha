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
  Phone,
  Package,
  Timer,
  Award,
  Target,
  Activity,
  Filter,
  Search,
  Eye,
  Camera
} from 'lucide-react'

const DeliveryPartnerDashboard: React.FC = () => {
  const { user } = useAuth()
  const [isOnline, setIsOnline] = useState(false)
  const [currentDelivery, setCurrentDelivery] = useState<any>(null)
  const [availableDeliveries, setAvailableDeliveries] = useState([])
  const [deliveryHistory, setDeliveryHistory] = useState([])
  const [earnings, setEarnings] = useState({
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    total: 0
  })
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    rating: 0,
    completionRate: 0,
    onTimeRate: 0,
    avgDeliveryTime: 0
  })
  const [waitingTimer, setWaitingTimer] = useState(0)
  const [waitingActive, setWaitingActive] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchPartnerData()
    fetchAvailableDeliveries()
    fetchDeliveryHistory()
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

  const fetchPartnerData = async () => {
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
        setCurrentDelivery(data.currentDelivery)
        setIsOnline(data.isOnline)
      }
    } catch (error) {
      console.error('Failed to fetch partner data:', error)
    }
  }

  const fetchAvailableDeliveries = async () => {
    try {
      const token = localStorage.getItem('fairload_token')
      const response = await fetch('/api/deliveries/available', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setAvailableDeliveries(data)
      }
    } catch (error) {
      console.error('Failed to fetch available deliveries:', error)
    }
  }

  const fetchDeliveryHistory = async () => {
    try {
      const token = localStorage.getItem('fairload_token')
      const response = await fetch('/api/deliveries/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setDeliveryHistory(data)
      }
    } catch (error) {
      console.error('Failed to fetch delivery history:', error)
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

  const acceptDelivery = async (deliveryId: string) => {
    try {
      const token = localStorage.getItem('fairload_token')
      const response = await fetch(`/api/deliveries/${deliveryId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const delivery = await response.json()
        setCurrentDelivery(delivery)
        fetchAvailableDeliveries()
      }
    } catch (error) {
      console.error('Failed to accept delivery:', error)
    }
  }

  const updateDeliveryStatus = async (status: string) => {
    if (!currentDelivery) return

    try {
      const token = localStorage.getItem('fairload_token')
      const response = await fetch(`/api/deliveries/${currentDelivery.id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status, waitingTime: waitingTimer })
      })
      if (response.ok) {
        const updatedDelivery = await response.json()
        if (status === 'delivered') {
          setCurrentDelivery(null)
          setWaitingActive(false)
          setWaitingTimer(0)
          fetchPartnerData()
          fetchDeliveryHistory()
        } else {
          setCurrentDelivery(updatedDelivery)
        }
      }
    } catch (error) {
      console.error('Failed to update delivery status:', error)
    }
  }

  const startWaitingTimer = () => {
    setWaitingActive(true)
    setWaitingTimer(0)
  }

  const stopWaitingTimer = () => {
    setWaitingActive(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-success-600" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'in-transit':
        return <Truck className="h-4 w-4 text-primary-600" />
      case 'picked-up':
        return <Package className="h-4 w-4 text-warning-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'text-success-600 bg-success-50'
      case 'cancelled':
        return 'text-red-600 bg-red-50'
      case 'in-transit':
        return 'text-primary-600 bg-primary-50'
      case 'picked-up':
        return 'text-warning-600 bg-warning-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const filteredHistory = deliveryHistory.filter((delivery: any) => {
    const matchesStatus = filterStatus === 'all' || delivery.status === filterStatus
    const matchesSearch = delivery.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         delivery.pickup.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         delivery.dropoff.address.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Delivery Partner Dashboard
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

        {/* Current Delivery */}
        {currentDelivery && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Current Delivery</h2>
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Package className="h-5 w-5 text-primary-600" />
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentDelivery.status)}`}>
                    {currentDelivery.status.replace('-', ' ').toUpperCase()}
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  #{currentDelivery.id.slice(0, 8)}
                </span>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <MapPin className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-600">Pickup:</span>
                  </div>
                  <p className="font-medium ml-6">{currentDelivery.pickup.address}</p>
                  <p className="text-sm text-gray-600 ml-6">Contact: {currentDelivery.pickup.contactPhone}</p>
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Navigation className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-gray-600">Drop:</span>
                  </div>
                  <p className="font-medium ml-6">{currentDelivery.dropoff.address}</p>
                  <p className="text-sm text-gray-600 ml-6">Contact: {currentDelivery.dropoff.contactPhone}</p>
                </div>
              </div>

              {/* Package Details */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h4 className="font-medium mb-2">Package Details</h4>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Type:</span>
                    <span className="ml-2 font-medium">{currentDelivery.package.type}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Weight:</span>
                    <span className="ml-2 font-medium">{currentDelivery.package.weight}kg</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Fragile:</span>
                    <span className="ml-2 font-medium">{currentDelivery.package.fragile ? 'Yes' : 'No'}</span>
                  </div>
                </div>
                {currentDelivery.package.description && (
                  <p className="text-sm text-gray-600 mt-2">
                    <strong>Description:</strong> {currentDelivery.package.description}
                  </p>
                )}
              </div>

              {/* Waiting Time Timer */}
              <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Timer className="h-5 w-5 text-warning-600" />
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

              {/* Action Buttons */}
              <div className="grid md:grid-cols-2 gap-4">
                <FareBreakdown 
                  fareBreakdown={{
                    ...currentDelivery.fareBreakdown,
                    waitingTime: waitingTimer * 2
                  }} 
                  showDriverEarnings={true} 
                />
                
                <div className="space-y-3">
                  {currentDelivery.customerNotes && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-700">
                        <strong>Customer Notes:</strong> {currentDelivery.customerNotes}
                      </p>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    {currentDelivery.status === 'accepted' && (
                      <button
                        onClick={() => updateDeliveryStatus('picked-up')}
                        className="w-full btn-primary py-3"
                      >
                        Mark as Picked Up
                      </button>
                    )}
                    
                    {currentDelivery.status === 'picked-up' && (
                      <button
                        onClick={() => updateDeliveryStatus('in-transit')}
                        className="w-full btn-primary py-3"
                      >
                        Start Delivery
                      </button>
                    )}
                    
                    {currentDelivery.status === 'in-transit' && (
                      <button
                        onClick={() => updateDeliveryStatus('delivered')}
                        className="w-full bg-success-600 hover:bg-success-700 text-white py-3 px-4 rounded-lg"
                      >
                        Mark as Delivered
                      </button>
                    )}
                  </div>
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
                <Award className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Earned</p>
                <p className="text-2xl font-bold">₹{earnings.total}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Stats */}
        <div className="grid md:grid-cols-5 gap-6 mb-8">
          <div className="card p-6 text-center">
            <Package className="h-8 w-8 text-primary-600 mx-auto mb-3" />
            <p className="text-2xl font-bold">{stats.totalDeliveries}</p>
            <p className="text-gray-600 text-sm">Total Deliveries</p>
          </div>

          <div className="card p-6 text-center">
            <Star className="h-8 w-8 text-warning-600 mx-auto mb-3" />
            <p className="text-2xl font-bold">{stats.rating.toFixed(1)}</p>
            <p className="text-gray-600 text-sm">Rating</p>
          </div>

          <div className="card p-6 text-center">
            <Target className="h-8 w-8 text-success-600 mx-auto mb-3" />
            <p className="text-2xl font-bold">{stats.completionRate}%</p>
            <p className="text-gray-600 text-sm">Completion Rate</p>
          </div>

          <div className="card p-6 text-center">
            <Clock className="h-8 w-8 text-blue-600 mx-auto mb-3" />
            <p className="text-2xl font-bold">{stats.onTimeRate}%</p>
            <p className="text-gray-600 text-sm">On-Time Rate</p>
          </div>

          <div className="card p-6 text-center">
            <Activity className="h-8 w-8 text-purple-600 mx-auto mb-3" />
            <p className="text-2xl font-bold">{stats.avgDeliveryTime}min</p>
            <p className="text-gray-600 text-sm">Avg Delivery Time</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Available Deliveries */}
          {isOnline && !currentDelivery && (
            <div className="card">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold">Available Deliveries</h2>
                <p className="text-gray-600 text-sm mt-1">
                  Choose deliveries that work for you - no forced acceptance
                </p>
              </div>
              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {availableDeliveries.length === 0 ? (
                  <div className="p-8 text-center">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No deliveries available right now</p>
                    <p className="text-gray-500 text-sm mt-2">
                      Stay online and we'll notify you when new deliveries arrive
                    </p>
                  </div>
                ) : (
                  availableDeliveries.map((delivery: any) => (
                    <div key={delivery.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              delivery.businessType === 'b2b' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {delivery.businessType.toUpperCase()}
                            </span>
                            <span className="text-sm text-gray-600">{delivery.package.type}</span>
                          </div>
                          
                          <div className="grid md:grid-cols-2 gap-2 mb-3 text-sm">
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-3 w-3 text-green-600" />
                              <span className="truncate">{delivery.pickup.address}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Navigation className="h-3 w-3 text-red-600" />
                              <span className="truncate">{delivery.dropoff.address}</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span>Distance: {delivery.estimatedDistance}km</span>
                            <span>Time: ~{delivery.estimatedDuration}min</span>
                            <span className="font-medium text-success-600">
                              Earn: ₹{delivery.fareBreakdown.driverEarnings}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <p className="text-lg font-bold text-primary-600">
                              ₹{delivery.fareBreakdown.totalFare}
                            </p>
                            <p className="text-xs text-gray-500">Total Fare</p>
                          </div>
                          <button
                            onClick={() => acceptDelivery(delivery.id)}
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

          {/* Delivery History */}
          <div className="card">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Delivery History</h2>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search deliveries..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="all">All Status</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="in-transit">In Transit</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {filteredHistory.length === 0 ? (
                <div className="p-8 text-center">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No delivery history found</p>
                </div>
              ) : (
                filteredHistory.map((delivery: any) => (
                  <div key={delivery.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          {getStatusIcon(delivery.status)}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(delivery.status)}`}>
                            {delivery.status.replace('-', ' ').toUpperCase()}
                          </span>
                          <span className="text-sm text-gray-500">
                            #{delivery.id.slice(0, 8)}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            delivery.businessType === 'b2b' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {delivery.businessType.toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-2 mb-2 text-sm">
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3 text-green-600" />
                            <span className="truncate">{delivery.pickup.address}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Navigation className="h-3 w-3 text-red-600" />
                            <span className="truncate">{delivery.dropoff.address}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(delivery.createdAt).toLocaleDateString()}</span>
                          </div>
                          <span>₹{delivery.fareBreakdown.driverEarnings} earned</span>
                          {delivery.waitingTime > 0 && (
                            <span className="text-warning-600">+{delivery.waitingTime}min wait</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button className="p-2 text-gray-400 hover:text-gray-600">
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeliveryPartnerDashboard