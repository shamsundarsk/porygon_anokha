import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../providers/AuthProvider'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { UserType } from '../../types'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserType[]
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles 
}) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.userType)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}