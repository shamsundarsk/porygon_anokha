import React, { useState } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import { 
  Building2, 
  Package, 
  TrendingUp, 
  Users, 
  DollarSign,
  BarChart3,
  Calendar,
  MapPin,
  Clock,
  Plus,
  Filter,
  Download,
  Search,
  Truck,
  Star,
  AlertCircle
} from 'lucide-react'

interface BusinessDelivery {
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
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  driverName?: string
  createdAt: string
  deliveredAt?: string
}

const BusinessDashboard = () => {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState<'overview' | 'deliveries' | 'analytics' | 'team'>('overview')
  const [dateRange, setDateRange] = useState('7d')
  
  // Mock data - replace with real API calls
  const [stats] = useState({
    totalDeliveries: 1247,
    activeDeliveries: 23,
    monthlySpent: 125000,
    avgDeliveryTime: 45,
    successRate: 98.5,
    teamMembers: 12,
    costSavings: 35000
  })

  const [recentDeliveries] = useState<BusinessDelivery[]>([
    {
      id: 'BIZ001',
      status: 'IN_TRANSIT',
      pickup: {
        address: 'Warehouse A, Andheri East',
        contactName: 'Warehouse Manager',
        contactPhone: '+91 98765 43210'
      },
      dropoff: {
        address: 'Client Office, Bandra West',
        contactName: 'Reception Desk',
        contactPhone: '+91 87654 32109'
      },
      packageType: 'Business Documents',
      weight: 1.2,
      fare: 250,
      distance: '12.5 km',
      priority: 'HIGH',
      driverName: 'Rajesh Kumar',
      createdAt: '2024-01-08T10:30:00Z'
    },
    {
      id: 'BIZ002',
      status: 'DELIVERED',
      pickup: {
        address: 'Office Complex, Powai',
        contactName: 'Admin Team',
        contactPhone: '+91 76543 21098'
      },
      dropoff: {
        address: 'Partner Office, Goregaon',
        contactName: 'Business Development',
        contactPhone: '+91 65432 10987'
      },
      packageType: 'Contracts & Legal',
      weight: 0.8,
      fare: 180,
      distance: '8.2 km',
      priority: 'MEDIUM',
      driverName: 'Priya Sharma',
      createdAt: '2024-01-08T09:15:00Z',
      deliveredAt: '2024-01-08T10:45:00Z'
    }
  ])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'bg-slate-100 text-slate-800'
      case 'MEDIUM': return 'bg-blue-100 text-blue-800'
      case 'HIGH': return 'bg-orange-100 text-orange-800'
      case 'URGENT': return 'bg-red-100 text-red-800'
      default: return 'bg-slate-100 text-slate-800'
    }
  }

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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">PakkaDrop Business</h1>
                <p className="text-sm text-slate-600">{user?.companyName}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <select 
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              
              <button className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2">
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
        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="border-b border-slate-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'deliveries', label: 'Deliveries', icon: Package },
                { id: 'analytics', label: 'Analytics', icon: TrendingUp },
                { id: 'team', label: 'Team', icon: Users }
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
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-slate-50 rounded-xl p-6">
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
                      <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                      <span className="text-green-600">+15% from last month</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-6">
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
                      <Clock className="w-4 h-4 text-orange-500 mr-1" />
                      <span className="text-orange-600">In progress</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Monthly Spend</p>
                        <p className="text-2xl font-bold text-slate-900">₹{stats.monthlySpent.toLocaleString()}</p>
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                      <span className="text-green-600">Average ₹100 per delivery</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Success Rate</p>
                        <p className="text-2xl font-bold text-slate-900">{stats.successRate}%</p>
                      </div>
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Star className="w-6 h-6 text-purple-600" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                      <span className="text-purple-600">Industry leading</span>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-slate-50 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-slate-900">Recent Deliveries</h3>
                      <button className="text-slate-600 hover:text-slate-900 text-sm font-medium">
                        View All →
                      </button>
                    </div>
                    <div className="space-y-3">
                      {recentDeliveries.slice(0, 3).map((delivery) => (
                        <div key={delivery.id} className="bg-white rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-slate-900">#{delivery.id}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(delivery.status)}`}>
                              {delivery.status}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 mb-1">{delivery.pickup.address}</p>
                          <p className="text-sm text-slate-600">→ {delivery.dropoff.address}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-sm text-slate-500">{delivery.distance}</span>
                            <span className="font-medium text-slate-900">₹{delivery.fare}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-slate-900">Cost Savings</h3>
                      <span className="text-sm text-slate-600">vs Traditional Services</span>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-white rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">This Month</span>
                          <span className="text-2xl font-bold text-green-600">₹{stats.costSavings.toLocaleString()}</span>
                        </div>
                        <div className="mt-2">
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div className="bg-green-600 h-2 rounded-full" style={{ width: '68%' }}></div>
                          </div>
                          <p className="text-sm text-slate-600 mt-1">68% cost reduction</p>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4">
                        <h4 className="font-medium text-slate-900 mb-2">Key Benefits</h4>
                        <ul className="space-y-1 text-sm text-slate-600">
                          <li>• No hidden charges or surge pricing</li>
                          <li>• Direct driver partnerships</li>
                          <li>• Bulk delivery discounts</li>
                          <li>• Real-time cost optimization</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'deliveries' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">Delivery Management</h3>
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search deliveries..."
                        className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                      />
                    </div>
                    <button className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50">
                      <Filter className="w-4 h-4 text-slate-600" />
                    </button>
                    <button className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50">
                      <Download className="w-4 h-4 text-slate-600" />
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-slate-200">
                  <div className="px-6 py-4 border-b border-slate-200">
                    <div className="grid grid-cols-12 gap-4 text-sm font-medium text-slate-600">
                      <div className="col-span-2">Delivery ID</div>
                      <div className="col-span-3">Route</div>
                      <div className="col-span-2">Status</div>
                      <div className="col-span-1">Priority</div>
                      <div className="col-span-2">Driver</div>
                      <div className="col-span-1">Fare</div>
                      <div className="col-span-1">Actions</div>
                    </div>
                  </div>
                  <div className="divide-y divide-slate-200">
                    {recentDeliveries.map((delivery) => (
                      <div key={delivery.id} className="px-6 py-4 hover:bg-slate-50">
                        <div className="grid grid-cols-12 gap-4 items-center">
                          <div className="col-span-2">
                            <span className="font-medium text-slate-900">#{delivery.id}</span>
                            <p className="text-xs text-slate-500">{new Date(delivery.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="col-span-3">
                            <p className="text-sm text-slate-900 truncate">{delivery.pickup.address}</p>
                            <p className="text-sm text-slate-600 truncate">→ {delivery.dropoff.address}</p>
                          </div>
                          <div className="col-span-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(delivery.status)}`}>
                              {delivery.status}
                            </span>
                          </div>
                          <div className="col-span-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(delivery.priority)}`}>
                              {delivery.priority}
                            </span>
                          </div>
                          <div className="col-span-2">
                            {delivery.driverName ? (
                              <div>
                                <p className="text-sm font-medium text-slate-900">{delivery.driverName}</p>
                                <div className="flex items-center">
                                  <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                  <span className="text-xs text-slate-600 ml-1">4.8</span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-slate-500">Assigning...</span>
                            )}
                          </div>
                          <div className="col-span-1">
                            <span className="font-medium text-slate-900">₹{delivery.fare}</span>
                          </div>
                          <div className="col-span-1">
                            <button className="text-slate-600 hover:text-slate-900">
                              <MapPin className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-900">Business Analytics</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg border border-slate-200 p-6">
                    <h4 className="font-semibold text-slate-900 mb-4">Delivery Performance</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Average Delivery Time</span>
                        <span className="font-medium text-slate-900">{stats.avgDeliveryTime} min</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">On-Time Delivery Rate</span>
                        <span className="font-medium text-slate-900">{stats.successRate}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Customer Satisfaction</span>
                        <span className="font-medium text-slate-900">4.8/5.0</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border border-slate-200 p-6">
                    <h4 className="font-semibold text-slate-900 mb-4">Cost Analysis</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Average Cost per Delivery</span>
                        <span className="font-medium text-slate-900">₹100</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Monthly Savings</span>
                        <span className="font-medium text-green-600">₹{stats.costSavings.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Cost Efficiency</span>
                        <span className="font-medium text-slate-900">68% better</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-slate-200 p-6">
                  <h4 className="font-semibold text-slate-900 mb-4">Monthly Trends</h4>
                  <div className="text-center py-12 text-slate-500">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4" />
                    <p>Analytics charts will be displayed here</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'team' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">Team Management</h3>
                  <button className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2">
                    <Plus className="w-4 h-4" />
                    <span>Add Team Member</span>
                  </button>
                </div>

                <div className="bg-white rounded-lg border border-slate-200 p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-900">{stats.teamMembers}</div>
                      <div className="text-sm text-slate-600">Team Members</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-900">8</div>
                      <div className="text-sm text-slate-600">Active Users</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-900">4</div>
                      <div className="text-sm text-slate-600">Departments</div>
                    </div>
                  </div>

                  <div className="text-center py-12 text-slate-500">
                    <Users className="w-12 h-12 mx-auto mb-4" />
                    <p>Team member management interface will be displayed here</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default BusinessDashboard