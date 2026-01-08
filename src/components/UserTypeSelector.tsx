import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import { User, Building2, Truck } from 'lucide-react'

const UserTypeSelector: React.FC = () => {
  const [selectedType, setSelectedType] = useState<'CUSTOMER' | 'BUSINESS' | 'DRIVER' | 'ADMIN'>('CUSTOMER')
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleTypeSelection = () => {
    if (user) {
      // Store the selected user type
      localStorage.setItem(`userType_${user.id}`, selectedType)
      
      // Navigate directly to the appropriate dashboard
      switch (selectedType) {
        case 'CUSTOMER':
          navigate('/customer-dashboard')
          break
        case 'BUSINESS':
          navigate('/business-dashboard')
          break
        case 'DRIVER':
          navigate('/driver-dashboard')
          break
        case 'ADMIN':
          navigate('/owner-dashboard')
          break
        default:
          navigate('/customer-dashboard')
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">🚛</span>
            </div>
            <span className="text-2xl font-bold text-slate-900">PakkaDrop</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Choose Your Account Type</h2>
          <p className="text-slate-600 mt-2">Select how you'll be using PakkaDrop</p>
        </div>

        <div className="space-y-3 mb-6">
          {[
            { 
              value: 'CUSTOMER' as const, 
              label: 'Personal Customer', 
              icon: User, 
              description: 'Individual deliveries and personal use' 
            },
            { 
              value: 'BUSINESS' as const, 
              label: 'Business Account', 
              icon: Building2, 
              description: 'Enterprise logistics and team management' 
            },
            { 
              value: 'DRIVER' as const, 
              label: 'Driver', 
              icon: Truck, 
              description: 'Earn money by delivering packages' 
            },
            { 
              value: 'ADMIN' as const, 
              label: 'Fleet Owner', 
              icon: Building2, 
              description: 'Manage multiple vehicles and drivers' 
            }
          ].map((type) => (
            <button
              key={type.value}
              onClick={() => setSelectedType(type.value)}
              className={`w-full p-4 border rounded-lg text-left transition-colors ${
                selectedType === type.value
                  ? 'border-slate-900 bg-slate-50'
                  : 'border-slate-300 hover:border-slate-400'
              }`}
            >
              <div className="flex items-center space-x-3">
                <type.icon className={`w-6 h-6 ${
                  selectedType === type.value ? 'text-slate-900' : 'text-slate-600'
                }`} />
                <div>
                  <p className={`font-medium ${
                    selectedType === type.value ? 'text-slate-900' : 'text-slate-700'
                  }`}>
                    {type.label}
                  </p>
                  <p className="text-sm text-slate-600">{type.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={handleTypeSelection}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 px-4 rounded-lg font-medium transition-colors"
        >
          Continue to Dashboard
        </button>
      </div>
    </div>
  )
}

export default UserTypeSelector