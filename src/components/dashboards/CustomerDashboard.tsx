import React, { useState } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import Map from '../Map'
import { 
  Package, 
  MapPin, 
  Clock, 
  DollarSign, 
  Plus,
  Truck,
  Star,
  Phone,
  MessageSquare,
  Navigation,
  Calendar,
  Filter,
  Search,
  Users
} from 'lucide-react'

interface Delivery {
  id: string
  status: 'PENDING' | 'ACCEPTED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED'
  pickup: {
    address: string
    contactName: string
    contactPhone: string
  }
  dropoff: {
    address: string
    contactName: string
    contactPhone: string
  }
  packageType: string
  weight: number
  fare: number
  distance: string
  estimatedTime: string
  driverName?: string
  driverPhone?: string
  driverRating?: number
  createdAt: string
  deliveredAt?: string
}

const CustomerDashboard = () => {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState<'active' | 'history' | 'create'>('active')
  const [showCreateDelivery, setShowCreateDelivery] = useState(false)
  
  // Mock data - replace with real API calls
  const [stats] = useState({
    totalDeliveries: 45,
    activeDeliveries: 2,
    monthlySpent: 12500,
    savedAmount: 3200
  })

  const [deliveries] = useState<Delivery[]>([
    {
      id: '1',
      status: 'IN_TRANSIT',
      pickup: {
        address: 'Bandra West, Mumbai',
        contactName: 'John Doe',
        contactPhone: '+91 98765 43210'
      },
      dropoff: {
        address: 'Andheri East, Mumbai',
        contactName: 'Jane Smith',
        contactPhone: '+91 87654 32109'
      },
      packageType: 'Electronics',
      weight: 2.5,
      fare: 180,
      distance: '8.2 km',
      estimatedTime: '25 min',
      driverName: 'Rajesh Kumar',
      driverPhone: '+91 76543 21098',
      driverRating: 4.8,
      createdAt: '2024-01-08T10:30:00Z'
    },
    {
      id: '2',
      status: 'ACCEPTED',
      pickup: {
        address: 'Powai, Mumbai',
        contactName: 'Tech Solutions Ltd',
        contactPhone: '+91 76543 21098'
      },
      dropoff: {
        address: 'Goregaon West, Mumbai',
        contactName: 'Mumbai Enterprises',
        contactPhone: '+91 65432 10987'
      },
      packageType: 'Documents',
      weight: 0.5,
      fare: 120,
      distance: '12.5 km',
      estimatedTime: '35 min',
      driverName: 'Priya Sharma',
      driverPhone: '+91 54321 09876',
      driverRating: 4.6,
      createdAt: '2024-01-08T11:15:00Z'
    }
  ])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'ACCEPTED': return 'bg-blue-100 text-blue-800'
      case 'PICKED_UP': return 'bg-purple-100 text-purple-800'
      case 'IN_TRANSIT': return 'bg-orange-100 text-orange-800'
      case 'DELIVERED': return 'bg-green-100 text-green-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-slate-100 text-slate-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Finding Driver'
      case 'ACCEPTED': return 'Driver Assigned'
      case 'PICKED_UP': return 'Package Picked Up'
      case 'IN_TRANSIT': return 'On the Way'
      case 'DELIVERED': return 'Delivered'
      case 'CANCELLED': return 'Cancelled'
      default: return status
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">FairLoad Customer</h1>
                <p className="text-sm text-slate-600">Welcome back, {user?.name}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowCreateDelivery(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>New Delivery</span>
              </button>
              
              <button 
                onClick={logout}
                className="text-slate-600 hover:text-slate-900 text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Deliveries</p>
                <p className="text-2xl font-bold text-slate-900">{stats.totalDeliveries}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-blue-600">5 this month</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Active Deliveries</p>
                <p className="text-2xl font-bold text-slate-900">{stats.activeDeliveries}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Truck className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-orange-600">In progress</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Monthly Spent</p>
                <p className="text-2xl font-bold text-slate-900">₹{stats.monthlySpent}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600">Average ₹278 per delivery</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Money Saved</p>
                <p className="text-2xl font-bold text-slate-900">₹{stats.savedAmount}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-purple-600">vs traditional services</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-sm">
          {/* Tab Navigation */}
          <div className="border-b border-slate-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'active', label: 'Active Deliveries', count: stats.activeDeliveries },
                { id: 'history', label: 'Delivery History', count: stats.totalDeliveries - stats.activeDeliveries },
                { id: 'create', label: 'Create Delivery' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-slate-900 text-slate-900'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-full">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'active' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Active Deliveries
                  </h3>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-slate-400 hover:text-slate-600">
                      <Filter className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-slate-600">
                      <Search className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {deliveries.filter(d => ['PENDING', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT'].includes(d.status)).map((delivery) => (
                  <div key={delivery.id} className="border border-slate-200 rounded-lg p-6 hover:border-slate-300 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(delivery.status)}`}>
                          {getStatusText(delivery.status)}
                        </span>
                        <span className="text-sm text-slate-600">#{delivery.id}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-slate-900">₹{delivery.fare}</p>
                        <p className="text-sm text-slate-600">{delivery.distance} • {delivery.estimatedTime}</p>
                      </div>
                    </div>

                    {/* Live Map for Active Deliveries */}
                    {['IN_TRANSIT', 'PICKED_UP'].includes(delivery.status) && (
                      <div className="mb-4">
                        <Map
                          pickup={{ 
                            lat: 19.0760, 
                            lng: 72.8777, 
                            address: delivery.pickup.address 
                          }}
                          dropoff={{ 
                            lat: 19.1136, 
                            lng: 72.8697, 
                            address: delivery.dropoff.address 
                          }}
                          driverLocation={{ lat: 19.0950, lng: 72.8737 }}
                          height="200px"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                      <div>
                        <h4 className="font-medium text-slate-900 mb-2">Pickup Details</h4>
                        <div className="space-y-1">
                          <p className="text-sm text-slate-600">{delivery.pickup.address}</p>
                          <p className="text-sm text-slate-600">{delivery.pickup.contactName}</p>
                          <p className="text-sm text-slate-600">{delivery.pickup.contactPhone}</p>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-900 mb-2">Dropoff Details</h4>
                        <div className="space-y-1">
                          <p className="text-sm text-slate-600">{delivery.dropoff.address}</p>
                          <p className="text-sm text-slate-600">{delivery.dropoff.contactName}</p>
                          <p className="text-sm text-slate-600">{delivery.dropoff.contactPhone}</p>
                        </div>
                      </div>
                    </div>

                    {delivery.driverName && (
                      <div className="bg-slate-50 rounded-lg p-4 mb-4">
                        <h4 className="font-medium text-slate-900 mb-2">Driver Information</h4>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-slate-300 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-slate-700">
                                {delivery.driverName.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{delivery.driverName}</p>
                              <div className="flex items-center space-x-1">
                                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                <span className="text-sm text-slate-600">{delivery.driverRating}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button className="p-2 bg-white rounded-lg border border-slate-200 hover:border-slate-300">
                              <Phone className="w-4 h-4 text-slate-600" />
                            </button>
                            <button className="p-2 bg-white rounded-lg border border-slate-200 hover:border-slate-300">
                              <MessageSquare className="w-4 h-4 text-slate-600" />
                            </button>
                            <button className="p-2 bg-white rounded-lg border border-slate-200 hover:border-slate-300">
                              <Navigation className="w-4 h-4 text-slate-600" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-slate-600">
                        <div className="flex items-center space-x-1">
                          <Package className="w-4 h-4" />
                          <span>{delivery.packageType} • {delivery.weight} kg</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(delivery.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <button className="text-slate-900 hover:text-slate-700 font-medium text-sm">
                        Track Delivery →
                      </button>
                    </div>
                  </div>
                ))}

                {deliveries.filter(d => ['PENDING', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT'].includes(d.status)).length === 0 && (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No active deliveries</h3>
                    <p className="text-slate-600 mb-4">Create a new delivery to get started</p>
                    <button
                      onClick={() => setActiveTab('create')}
                      className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-medium"
                    >
                      Create Delivery
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">Delivery History</h3>
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">Delivery history</h3>
                  <p className="text-slate-600">Your completed deliveries will appear here</p>
                </div>
              </div>
            )}

            {activeTab === 'create' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-900">Create New Delivery</h3>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <p className="text-blue-800 font-medium">Quick & Fair Pricing</p>
                  </div>
                  <p className="text-blue-700 text-sm mt-1">
                    Get transparent pricing with no hidden charges. Pay only what's fair.
                  </p>
                </div>

                {/* Delivery Type Selection */}
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                  <h4 className="font-medium text-slate-900 mb-3">Delivery Type</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="border border-slate-300 rounded-lg p-3 hover:border-slate-400 cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Package className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">Express Delivery</p>
                          <p className="text-sm text-slate-600">Fast, direct delivery</p>
                        </div>
                      </div>
                    </div>
                    <div className="border border-blue-500 bg-blue-50 rounded-lg p-3 cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <Users className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">Pool Delivery</p>
                          <p className="text-sm text-slate-600">Share ride, save money</p>
                          <p className="text-xs text-green-600 font-medium">Save up to 40%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium text-slate-900">Pickup Details</h4>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Pickup Address</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                          placeholder="Enter pickup address"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Contact Name</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                          placeholder="Contact person name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Contact Phone</label>
                        <input
                          type="tel"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                          placeholder="+91 98765 43210"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium text-slate-900">Dropoff Details</h4>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Dropoff Address</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                          placeholder="Enter dropoff address"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Contact Name</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                          placeholder="Contact person name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Contact Phone</label>
                        <input
                          type="tel"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                          placeholder="+91 98765 43210"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Package Type</label>
                      <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500">
                        <option value="">Select package type</option>
                        <option value="documents">Documents</option>
                        <option value="electronics">Electronics</option>
                        <option value="clothing">Clothing</option>
                        <option value="food">Food Items</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Weight (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                        placeholder="0.0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle Type</label>
                      <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500">
                        <option value="">Select vehicle</option>
                        <option value="bike">Bike</option>
                        <option value="auto">Auto Rickshaw</option>
                        <option value="mini-truck">Mini Truck</option>
                        <option value="pickup">Pickup Truck</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Special Instructions</label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                      placeholder="Any special handling instructions..."
                    ></textarea>
                  </div>

                  {/* Fare Breakdown */}
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h4 className="font-medium text-slate-900 mb-3">Fare Breakdown</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Base Fare</span>
                        <span className="text-slate-900">₹50</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Distance (8.2 km)</span>
                        <span className="text-slate-900">₹82</span>
                      </div>
                      <div className="flex justify-between text-green-600">
                        <span>Pool Discount (40%)</span>
                        <span>-₹53</span>
                      </div>
                      <div className="border-t border-slate-200 pt-2 flex justify-between font-semibold">
                        <span className="text-slate-900">Total</span>
                        <span className="text-slate-900">₹79</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <h4 className="font-medium text-slate-900 mb-3">Payment Method</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="border border-blue-500 bg-blue-50 rounded-lg p-3 cursor-pointer">
                        <div className="text-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                            <DollarSign className="w-4 h-4 text-blue-600" />
                          </div>
                          <p className="text-sm font-medium text-slate-900">UPI</p>
                        </div>
                      </div>
                      <div className="border border-slate-300 rounded-lg p-3 cursor-pointer hover:border-slate-400">
                        <div className="text-center">
                          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                            <DollarSign className="w-4 h-4 text-slate-600" />
                          </div>
                          <p className="text-sm font-medium text-slate-900">Card</p>
                        </div>
                      </div>
                      <div className="border border-slate-300 rounded-lg p-3 cursor-pointer hover:border-slate-400">
                        <div className="text-center">
                          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                            <DollarSign className="w-4 h-4 text-slate-600" />
                          </div>
                          <p className="text-sm font-medium text-slate-900">Wallet</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-slate-200">
                    <div>
                      <p className="text-sm text-slate-600">Pool delivery saves you ₹53</p>
                      <p className="text-xs text-slate-500">Estimated delivery: 45-60 minutes</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        type="button"
                        className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                      >
                        Calculate Fare
                      </button>
                      <button
                        type="submit"
                        className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2 rounded-lg font-medium"
                      >
                        Pay & Book ₹79
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomerDashboard