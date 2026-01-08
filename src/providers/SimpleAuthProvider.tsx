import React, { createContext, useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

interface User {
  id: string
  name: string
  email: string
  userType: 'CUSTOMER' | 'ENTERPRISE' | 'DRIVER' | 'ADMIN'
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (userData: any) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const SimpleAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const login = async (email: string, password: string) => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock user based on email
      const mockUser: User = {
        id: '1',
        name: email.split('@')[0],
        email,
        userType: email.includes('driver') ? 'DRIVER' : 
                  email.includes('admin') ? 'ADMIN' :
                  email.includes('enterprise') ? 'ENTERPRISE' : 'CUSTOMER'
      }
      
      setUser(mockUser)
      toast.success('Login successful!')
      
      // Navigate based on user type
      switch (mockUser.userType) {
        case 'CUSTOMER':
        case 'ENTERPRISE':
          navigate('/customer/dashboard')
          break
        case 'DRIVER':
          navigate('/driver/dashboard')
          break
        case 'ADMIN':
          navigate('/admin/dashboard')
          break
        default:
          navigate('/')
      }
    } catch (error) {
      toast.error('Login failed')
    } finally {
      setLoading(false)
    }
  }

  const register = async (userData: any) => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockUser: User = {
        id: '1',
        name: userData.name,
        email: userData.email,
        userType: userData.userType
      }
      
      setUser(mockUser)
      toast.success('Registration successful!')
      
      // Navigate based on user type
      switch (mockUser.userType) {
        case 'CUSTOMER':
        case 'ENTERPRISE':
          navigate('/customer/dashboard')
          break
        case 'DRIVER':
          navigate('/driver/dashboard')
          break
        default:
          navigate('/')
      }
    } catch (error) {
      toast.error('Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    navigate('/')
    toast.success('Logged out successfully')
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  )
}