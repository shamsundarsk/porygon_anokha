import React, { useState, useEffect } from 'react'
import { 
  Users, 
  Truck, 
  IndianRupee, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  Settings,
  Shield
} from 'lucide-react'

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeDrivers: 0,
    totalBookings: 0,
    revenue: 0,
    completionRate: 0,
    avgRating: 0
  })
  const [disputes, setDisputes] = useState([])
  const [recentBookings, setRecentBookings] = useState([])
  const [driverApplications, setDriverApplications] = useState([])

  useEffect(() => {
    fetchAdminStats()
    fetchDisputes()
    fetchRecentBookings()
    fetchDriverApplications()
  }, [])

  const fetchAdminStats = async () => {
    try {
      const token = localStorage.getItem('pakkadrop_token')
      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch admin stats:', error)
    }
  }

  const fetchDisputes = async () => {
    try {
      const token = localStorage.getItem('pakkadrop_token')
      const response = await fetch('/api/admin/disputes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setDisputes(data)
      }
    } catch (error) {
      console.error('Failed to fetch disputes:', error)
    }
  }

  const fetchRecentBookings = async () => {
    try {
      const token = localStorage.getItem('pakkadrop_token')
      const response = await fetch('/api/admin/deliveries', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setRecentBookings(data)
      }
    } catch (error) {
      console.error('Failed to fetch recent bookings:', error)
    }
  }

  const fetchDriverApplications = async () => {
    try {
      const token = localStorage.getItem('pakkadrop_token')
      const response = await fetch('/api/admin/drivers/applications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setDriverApplications(data)
      }
    } catch (error) {
      console.error('Failed to fetch driver applications:', error)
    }
  }

  const approveDriver = async (driverId: string) => {
    try {
      const token = localStorage.getItem('pakkadrop_token')
      const response = await fetch(`/api/admin/drivers/${driverId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        fetchDriverApplications()
        fetchAdminStats()
      }
    } catch (error) {
      console.error('Failed to approve driver:', error)
    }
  }

  const resolveDispute = async (disputeId: string, resolution: string) => {
    try {
      const token = localStorage.getItem('pakkadrop_token')
      const response = await fetch(`/api/admin/disputes/${disputeId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ resolution })
      })
      if (response.ok) {
        fetchDisputes()
      }
    } catch (error) {
      console.error('Failed to resolve dispute:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success-600" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'in-progress':
        return <Truck className="h-4 w-4 text-primary-600" />
      default:
        return <Clock className="h-4 w-4 text-warning-600" />
    }
  }

  const getDisputeStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'text-success-600 bg-success-50'
      case 'investigating':
        return 'text-warning-600 bg-warning-50'
      default:
        return 'text-red-600 bg-red-50'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Monitor platform health and manage operations
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-6 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Users className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-success-100 rounded-lg">
                <Truck className="h-6 w-6 text-success-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Drivers</p>
                <p className="text-2xl font-bold">{stats.activeDrivers}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-warning-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-warning-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold">{stats.totalBookings}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <IndianRupee className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Revenue</p>
                <p className="text-2xl font-bold">₹{stats.revenue}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold">{stats.completionRate}%</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Rating</p>
                <p className="text-2xl font-bold">{stats.avgRating.toFixed(1)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Pending Driver Applications */}
          <div className="card">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-primary-600" />
                <h2 className="text-xl font-semibold">Driver Applications</h2>
                <span className="bg-warning-100 text-warning-800 text-xs px-2 py-1 rounded-full">
                  {driverApplications.length} pending
                </span>
              </div>
            </div>
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {driverApplications.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No pending applications
                </div>
              ) : (
                driverApplications.map((application: any) => (
                  <div key={application.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{application.name}</p>
                        <p className="text-sm text-gray-600">{application.email}</p>
                        <p className="text-sm text-gray-600">
                          {application.vehicleType} - {application.vehicleNumber}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => approveDriver(application.id)}
                          className="btn-primary text-sm"
                        >
                          Approve
                        </button>
                        <button className="btn-secondary text-sm">
                          Review
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Active Disputes */}
          <div className="card">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <h2 className="text-xl font-semibold">Active Disputes</h2>
                <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                  {disputes.filter((d: any) => d.status !== 'resolved').length} open
                </span>
              </div>
            </div>
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {disputes.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No active disputes
                </div>
              ) : (
                disputes.map((dispute: any) => (
                  <div key={dispute.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDisputeStatusColor(dispute.status)}`}>
                        {dispute.status.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(dispute.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="font-medium text-sm mb-1">
                      {dispute.type.toUpperCase()} - Booking #{dispute.bookingId.slice(0, 8)}
                    </p>
                    <p className="text-sm text-gray-600 mb-3">
                      {dispute.description}
                    </p>
                    {dispute.status !== 'resolved' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => resolveDispute(dispute.id, 'resolved')}
                          className="btn-primary text-xs"
                        >
                          Resolve
                        </button>
                        <button className="btn-secondary text-xs">
                          Investigate
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="card mt-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Recent Bookings</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {recentBookings.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No recent bookings
              </div>
            ) : (
              recentBookings.slice(0, 10).map((booking: any) => (
                <div key={booking.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {getStatusIcon(booking.status)}
                        <span className="font-medium">#{booking.id.slice(0, 8)}</span>
                        <span className="text-sm text-gray-600">
                          {booking.customer?.name} → {booking.driver?.name || 'Unassigned'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {booking.pickup.address} → {booking.dropoff.address}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₹{booking.fareBreakdown.totalFare}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(booking.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-4 gap-4 mt-8">
          <button className="card p-6 text-center hover:shadow-lg transition-shadow">
            <Settings className="h-8 w-8 text-gray-600 mx-auto mb-2" />
            <span className="font-medium">Platform Settings</span>
          </button>
          <button className="card p-6 text-center hover:shadow-lg transition-shadow">
            <IndianRupee className="h-8 w-8 text-gray-600 mx-auto mb-2" />
            <span className="font-medium">Pricing Rules</span>
          </button>
          <button className="card p-6 text-center hover:shadow-lg transition-shadow">
            <Users className="h-8 w-8 text-gray-600 mx-auto mb-2" />
            <span className="font-medium">User Management</span>
          </button>
          <button className="card p-6 text-center hover:shadow-lg transition-shadow">
            <BarChart3 className="h-8 w-8 text-gray-600 mx-auto mb-2" />
            <span className="font-medium">Analytics</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard