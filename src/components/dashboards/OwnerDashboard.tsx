import React, { useState } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import { 
  Truck, 
  MapPin, 
  Clock, 
  DollarSign, 
  Users,
  TrendingUp,
  Package,
  Star,
  Navigation,
  Phone,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Calendar,
  Wallet,
  Settings,
  BarChart3
} from 'lucide-react'

const OwnerDashboard = () => {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState<'fleet' | 'drivers' | 'earnings' | 'analytics'>('fleet')
  
  // Mock data - replace with real API calls
  const [stats] = useState({
    totalVehicles: parseInt(user?.fleetSize || '5'),
    activeVehicles: 4,
    totalDrivers: 8,
    activeDrivers: 6,
    todayEarnings: 8500,
    monthlyEarnings: 245000,
    completedDeliveries: 1247,
    avgRating: 4.7
  })

  const [vehicles] = useState([
    {
      id: 'V001',
      number: 'MH01AB1234',
      type: 'Mini Truck',
      driver: 'Rajesh Kumar',
      status: 'ACTIVE',
      location: 'Bandra West, Mumbai',
      earnings: 1250,
      trips: 8
    },
    {
      id: 'V002',
      number: 'MH01CD5678',
      type: 'Pickup Truck',
      driver: 'Priya Sharma',
      status: 'ACTIVE',
      location: 'Andheri East, Mumbai',
      earnings: 1100,
      trips: 6
    },
    {
      id: 'V003',
      number: 'MH01EF9012',
      type: 'Auto Rickshaw',
      driver: 'Amit Patel',
      status: 'MAINTENANCE',
      location: 'Workshop, Goregaon',
      earnings: 0,
      trips: 0
    }
  ])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'MAINTENANCE': return 'bg-yellow-100 text-yellow-800'
      case 'OFFLINE': return 'bg-slate-100 text-slate-800'
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
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">PakkaDrop Fleet Owner</h1>
                <p className="text-sm text-slate-600">{user?.name} • {stats.totalVehicles} Vehicles</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="p-2 text-slate-600 hover:text-slate-900">
                <Settings className="w-5 h-5" />
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
                <p className="text-sm font-medium text-slate-600">Fleet Revenue</p>
                <p className="text-2xl font-bold text-slate-900">₹{stats.todayEarnings}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600">+18% from yesterday</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Active Vehicles</p>
                <p className="text-2xl font-bold text-slate-900">{stats.activeVehicles}/{stats.totalVehicles}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Truck className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <CheckCircle className="w-4 h-4 text-blue-500 mr-1" />
              <span className="text-blue-600">80% utilization</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Active Drivers</p>
                <p className="text-2xl font-bold text-slate-900">{stats.activeDrivers}/{stats.totalDrivers}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <Users className="w-4 h-4 text-purple-500 mr-1" />
              <span className="text-purple-600">75% online</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Fleet Rating</p>
                <p className="text-2xl font-bold text-slate-900">{stats.avgRating}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <Star className="w-4 h-4 text-yellow-500 mr-1" />
              <span className="text-yellow-600">Excellent service</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="border-b border-slate-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'fleet', label: 'Fleet Management', icon: Truck },
                { id: 'drivers', label: 'Driver Management', icon: Users },
                { id: 'earnings', label: 'Earnings', icon: Wallet },
                { id: 'analytics', label: 'Analytics', icon: BarChart3 }
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
            {activeTab === 'fleet' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">Fleet Overview</h3>
                  <button className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-medium">
                    Add Vehicle
                  </button>
                </div>

                <div className="grid gap-4">
                  {vehicles.map((vehicle) => (
                    <div key={vehicle.id} className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                            <Truck className="w-6 h-6 text-slate-600" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="font-semibold text-slate-900">{vehicle.number}</h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(vehicle.status)}`}>
                                {vehicle.status}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600">{vehicle.type} • {vehicle.driver}</p>
                            <p className="text-sm text-slate-500 flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {vehicle.location}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-lg font-bold text-slate-900">₹{vehicle.earnings}</p>
                          <p className="text-sm text-slate-600">{vehicle.trips} trips today</p>
                          <div className="flex items-center space-x-2 mt-2">
                            <button className="p-1 text-slate-400 hover:text-slate-600">
                              <Phone className="w-4 h-4" />
                            </button>
                            <button className="p-1 text-slate-400 hover:text-slate-600">
                              <MessageSquare className="w-4 h-4" />
                            </button>
                            <button className="p-1 text-slate-400 hover:text-slate-600">
                              <Navigation className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'drivers' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-900">Driver Management</h3>
                <div className="text-center py-12 text-slate-500">
                  <Users className="w-12 h-12 mx-auto mb-4" />
                  <p>Driver management interface will be displayed here</p>
                </div>
              </div>
            )}

            {activeTab === 'earnings' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-900">Fleet Earnings</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-slate-600">Today</p>
                    <p className="text-2xl font-bold text-slate-900">₹{stats.todayEarnings}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-slate-600">This Month</p>
                    <p className="text-2xl font-bold text-slate-900">₹{stats.monthlyEarnings}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-slate-600">Per Vehicle Avg</p>
                    <p className="text-2xl font-bold text-slate-900">₹{Math.round(stats.monthlyEarnings / stats.totalVehicles)}</p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-6">
                  <h4 className="font-semibold text-slate-900 mb-4">Vehicle Performance</h4>
                  <div className="space-y-3">
                    {vehicles.filter(v => v.status === 'ACTIVE').map((vehicle) => (
                      <div key={vehicle.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900">{vehicle.number}</p>
                          <p className="text-sm text-slate-600">{vehicle.trips} trips • {vehicle.driver}</p>
                        </div>
                        <p className="font-semibold text-slate-900">₹{vehicle.earnings}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-900">Fleet Analytics</h3>
                <div className="text-center py-12 text-slate-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4" />
                  <p>Analytics dashboard will be displayed here</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default OwnerDashboard