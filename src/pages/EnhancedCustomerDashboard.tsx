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
  Star,
  Package,
  Building,
  User,
  Eye,
  Download,
  Filter,
  Search,
  BarChart3,
  TrendingUp,
  Activity,
  AlertCircle,
  Phone,
  Navigation,
  Timer,
  FileText
} from 'lucide-react'

const EnhancedCustomerDashboard: React.FC = () => {
  const { user } = useAuth()
  const { currentBooking } = useBooking()
  const [activeTab, setActiveTab] = useState('overview')
  const [deliveries, setDeliveries] = useState([])
  const [currentDeliveries, setCurrentDeliveries] = useState([])
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    completedDeliveries: 0,
    totalSpent: 0,
    avgRating: 0,
    onTimeDeliveryRate: 0,
    avgDeliveryTime: 0
  })
  const [analytics, setAnalytics] = useState({
    monthlySpend: [],
    topRoutes: [],
    deliveryTrends: []
  })
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [dateRange, setDateRange] = useState('30')

  useEffect(() => {
    fetchDeliveries()
    fetchStats()
    fetchAnalytics()
    fetchCurrentDeliveries()
  }, [])

  const fetchDeliveries = async () => {
    try {
      const token = localStorage.getItem('fairload_token')
      const response = await fetch('/api/deliveries/my-deliveries', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setDeliveries(data)
      }
    } catch (error) {
      console.error('Failed to fetch deliveries:', error)
    }
  }

  const fetchCurrentDeliveries = async () => {
    try {
      const token = localStorage.getItem('fairload_token')
      const response = await fetch('/api/deliveries/current', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setCurrentDeliveries(data)
      }
    } catch (error) {
      console.error('Failed to fetch current deliveries:', error)
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

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('fairload_token')
      const response = await fetch('/api/customers/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-success-600" />
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'in-transit':
        return <Truck className="h-5 w-5 text-primary-600" />
      case 'picked-up':
        return <Package className="h-5 w-5 text-warning-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-600" />
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

  const filteredDeliveries = deliveries.filter((delivery: any) => {
    const matchesStatus = filterStatus === 'all' || delivery.status === filterStatus
    const matchesType = filterType === 'all' || delivery.businessType === filterType
    const matchesSearch = delivery.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         delivery.pickup.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         delivery.dropoff.address.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesType && matchesSearch
  })

  const isEnterprise = user?.userType === 'enterprise' || user?.businessType === 'b2b'

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {isEnterprise ? 'Enterprise Dashboard' : 'Customer Dashboard'}
              </h1>
              <p className="text-gray-600 mt-2">
                Welcome back, {user?.name}! {isEnterprise && `Managing logistics for ${user?.companyName}`}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {isEnterprise && (
                <div className="flex items-center space-x-2 px-3 py-2 bg-purple-100 text-purple-800 rounded-lg">
                  <Building className="h-4 w-4" />
                  <span className="text-sm font-medium">Enterprise</span>
                </div>
              )}
              <Link to="/book" className="btn-primary flex items-center space-x-2">
                <Plus className="h-5 w-5" />
                <span>New Delivery</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {['overview', 'current', 'history', ...(isEnterprise ? ['analytics', 'bulk'] : [])].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid md:grid-cols-4 gap-6">
              <div className="card p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <Package className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Deliveries</p>
                    <p className="text-2xl font-bold">{stats.totalDeliveries}</p>
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
                    <p className="text-2xl font-bold">{stats.completedDeliveries}</p>
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
                    <Clock className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">On-Time Rate</p>
                    <p className="text-2xl font-bold">{stats.onTimeDeliveryRate}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-3 gap-6">
              <Link to="/book" className="card p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-primary-100 rounded-lg">
                    <Plus className="h-8 w-8 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Quick Delivery</h3>
                    <p className="text-gray-600">Send a package now</p>
                  </div>
                </div>
              </Link>

              <div className="card p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-success-100 rounded-lg">
                    <Calendar className="h-8 w-8 text-success-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Schedule Delivery</h3>
                    <p className="text-gray-600">Plan for later</p>
                  </div>
                </div>
              </div>

              {isEnterprise && (
                <div className="card p-6 hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <FileText className="h-8 w-8 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Bulk Upload</h3>
                      <p className="text-gray-600">Upload CSV file</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="card">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold">Recent Activity</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {deliveries.slice(0, 5).map((delivery: any) => (
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
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-4 mb-2">
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-green-600" />
                            <span className="text-sm truncate">{delivery.pickup.address}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Navigation className="h-4 w-4 text-red-600" />
                            <span className="text-sm truncate">{delivery.dropoff.address}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(delivery.createdAt).toLocaleDateString()}</span>
                          </div>
                          <span>₹{delivery.fareBreakdown.totalFare}</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            delivery.businessType === 'b2b' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {delivery.businessType.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button className="p-2 text-gray-400 hover:text-gray-600">
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Current Deliveries Tab */}
        {activeTab === 'current' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Current Deliveries</h2>
              <span className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-medium">
                {currentDeliveries.length} Active
              </span>
            </div>

            {currentDeliveries.length === 0 ? (
              <div className="card p-12 text-center">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No active deliveries</h3>
                <p className="text-gray-600 mb-6">All your packages have been delivered!</p>
                <Link to="/book" className="btn-primary">
                  Create New Delivery
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {currentDeliveries.map((delivery: any) => (
                  <div key={delivery.id} className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(delivery.status)}
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(delivery.status)}`}>
                          {delivery.status.replace('-', ' ').toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-500">
                          #{delivery.id.slice(0, 8)}
                        </span>
                      </div>
                      <button className="btn-primary text-sm">
                        Track Live
                      </button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 mb-4">
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <MapPin className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-gray-600">Pickup:</span>
                        </div>
                        <p className="font-medium ml-6">{delivery.pickup.address}</p>
                        <p className="text-sm text-gray-600 ml-6">Contact: {delivery.pickup.contactPhone}</p>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <Navigation className="h-4 w-4 text-red-600" />
                          <span className="text-sm text-gray-600">Drop:</span>
                        </div>
                        <p className="font-medium ml-6">{delivery.dropoff.address}</p>
                        <p className="text-sm text-gray-600 ml-6">Contact: {delivery.dropoff.contactPhone}</p>
                      </div>
                    </div>

                    {delivery.partner && (
                      <div className="bg-blue-50 p-4 rounded-lg mb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-blue-900">Delivery Partner: {delivery.partner.name}</p>
                            <p className="text-blue-700 text-sm">Vehicle: {delivery.partner.vehicleNumber}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                              <Phone className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-4">
                        <span>Distance: {delivery.estimatedDistance}km</span>
                        <span>Est. Time: {delivery.estimatedDuration}min</span>
                        {delivery.waitingTime > 0 && (
                          <span className="text-warning-600">
                            <Timer className="h-4 w-4 inline mr-1" />
                            Waiting: {delivery.waitingTime}min
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-primary-600">₹{delivery.fareBreakdown.totalFare}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="card p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search deliveries..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Status</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="in-transit">In Transit</option>
                </select>

                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Types</option>
                  <option value="b2c">B2C</option>
                  <option value="b2b">B2B</option>
                </select>

                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 3 months</option>
                  <option value="365">Last year</option>
                </select>

                <button className="btn-secondary flex items-center space-x-2">
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </button>
              </div>
            </div>

            {/* Delivery History */}
            <div className="card">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold">Delivery History</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {filteredDeliveries.length === 0 ? (
                  <div className="p-8 text-center">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No deliveries found matching your criteria</p>
                  </div>
                ) : (
                  filteredDeliveries.map((delivery: any) => (
                    <div key={delivery.id} className="p-6 hover:bg-gray-50">
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
                          
                          <div className="grid md:grid-cols-2 gap-4 mb-2">
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4 text-green-600" />
                              <span className="text-sm truncate">{delivery.pickup.address}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Navigation className="h-4 w-4 text-red-600" />
                              <span className="text-sm truncate">{delivery.dropoff.address}</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(delivery.createdAt).toLocaleDateString()}</span>
                            </div>
                            <span>₹{delivery.fareBreakdown.totalFare}</span>
                            {delivery.actualDuration && (
                              <span>Delivered in {delivery.actualDuration}min</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button className="btn-secondary text-sm">
                            View Details
                          </button>
                          {delivery.status === 'delivered' && (
                            <button className="btn-primary text-sm">
                              Repeat Order
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
        )}

        {/* Analytics Tab (Enterprise only) */}
        {activeTab === 'analytics' && isEnterprise && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Analytics & Insights</h2>
            
            {/* Analytics Cards */}
            <div className="grid md:grid-cols-4 gap-6">
              <div className="card p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Avg Delivery Time</p>
                    <p className="text-2xl font-bold">{stats.avgDeliveryTime}min</p>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Cost Efficiency</p>
                    <p className="text-2xl font-bold">92%</p>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Activity className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Peak Hours</p>
                    <p className="text-2xl font-bold">2-4 PM</p>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Issues</p>
                    <p className="text-2xl font-bold">3</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts placeholder */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="card p-6">
                <h3 className="text-lg font-semibold mb-4">Monthly Spend Trend</h3>
                <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">Chart will be rendered here</p>
                </div>
              </div>

              <div className="card p-6">
                <h3 className="text-lg font-semibold mb-4">Top Routes</h3>
                <div className="space-y-3">
                  {analytics.topRoutes.map((route: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">{route.route}</span>
                      <div className="text-right">
                        <p className="font-bold">{route.count} deliveries</p>
                        <p className="text-sm text-gray-600">Avg: {route.avgTime}min</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Orders Tab (Enterprise only) */}
        {activeTab === 'bulk' && isEnterprise && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Bulk Orders</h2>
              <button className="btn-primary">
                Upload CSV
              </button>
            </div>

            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Bulk Actions</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 cursor-pointer">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="font-medium mb-2">Upload CSV</h4>
                  <p className="text-sm text-gray-600">Bulk upload delivery requests</p>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 cursor-pointer">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="font-medium mb-2">Schedule Recurring</h4>
                  <p className="text-sm text-gray-600">Set up recurring deliveries</p>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 cursor-pointer">
                  <Download className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="font-medium mb-2">Download Template</h4>
                  <p className="text-sm text-gray-600">Get CSV template</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold">Recent Bulk Uploads</h3>
              </div>
              <div className="p-6">
                <p className="text-gray-500 text-center py-8">No bulk uploads yet</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default EnhancedCustomerDashboard