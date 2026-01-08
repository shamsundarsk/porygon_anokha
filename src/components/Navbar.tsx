import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Truck, User, LogOut } from 'lucide-react'

const Navbar: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const getDashboardLink = () => {
    if (!user) return '/'
    switch (user.userType) {
      case 'customer': return '/customer-dashboard'
      case 'enterprise': return '/enterprise-dashboard'
      case 'driver': return '/driver-dashboard'
      case 'admin': return '/admin-dashboard'
      default: return '/'
    }
  }

  return (
    <nav className="bg-white shadow-md border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Truck className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-bold text-gray-900">FairLoad</span>
          </Link>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link 
                  to={getDashboardLink()}
                  className="flex items-center space-x-2 text-gray-700 hover:text-primary-600"
                >
                  <User className="h-5 w-5" />
                  <span>{user.name}</span>
                </Link>
                {(user.userType === 'customer' || user.userType === 'enterprise') && (
                  <Link to="/book" className="btn-primary">
                    New Delivery
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 text-gray-700 hover:text-red-600"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="text-gray-700 hover:text-primary-600">
                  Login
                </Link>
                <Link to="/register" className="btn-primary">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar