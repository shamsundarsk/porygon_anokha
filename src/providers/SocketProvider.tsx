import React, { createContext, useContext, useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from './AuthProvider'

interface SocketContextType {
  socket: Socket | null
  connected: boolean
  emitDriverLocation: (location: { lat: number; lng: number; heading?: number }) => void
  trackDelivery: (deliveryId: string) => void
  stopTrackingDelivery: (deliveryId: string) => void
  sendVoiceCommand: (command: string) => void
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      // Initialize socket connection
      const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5004', {
        auth: {
          token: localStorage.getItem('pakkadrop_token')
        }
      })

      newSocket.on('connect', () => {
        console.log('🔌 Connected to server')
        setConnected(true)
      })

      newSocket.on('disconnect', () => {
        console.log('🔌 Disconnected from server')
        setConnected(false)
      })

      // Listen for delivery updates
      newSocket.on('delivery-update', (delivery) => {
        console.log('📦 Delivery update:', delivery)
        // Handle delivery updates (could dispatch to a global state)
      })

      // Listen for new deliveries (for drivers)
      newSocket.on('new-delivery', (delivery) => {
        console.log('🆕 New delivery available:', delivery)
        // Show notification for drivers
        if (user.userType === 'DRIVER') {
          // Could show a toast notification or update available deliveries
        }
      })

      // Listen for driver location updates (for customers)
      newSocket.on('driver-location', (data) => {
        console.log('📍 Driver location update:', data)
        // Update driver location on map
      })

      // Listen for voice responses
      newSocket.on('voice-response', (data) => {
        console.log('🎤 Voice response:', data)
        // Handle voice command responses
      })

      setSocket(newSocket)

      return () => {
        newSocket.close()
      }
    } else {
      // Disconnect socket if user logs out
      if (socket) {
        socket.close()
        setSocket(null)
        setConnected(false)
      }
    }
  }, [user])

  const emitDriverLocation = (location: { lat: number; lng: number; heading?: number }) => {
    if (socket && user?.userType === 'DRIVER') {
      socket.emit('driver-location-update', {
        driverId: user.id,
        ...location
      })
    }
  }

  const trackDelivery = (deliveryId: string) => {
    if (socket) {
      socket.emit('track-delivery', deliveryId)
    }
  }

  const stopTrackingDelivery = (deliveryId: string) => {
    if (socket) {
      socket.emit('stop-tracking-delivery', deliveryId)
    }
  }

  const sendVoiceCommand = (command: string) => {
    if (socket && user) {
      socket.emit('voice-command', {
        command,
        userId: user.id
      })
    }
  }

  return (
    <SocketContext.Provider value={{
      socket,
      connected,
      emitDriverLocation,
      trackDelivery,
      stopTrackingDelivery,
      sendVoiceCommand
    }}>
      {children}
    </SocketContext.Provider>
  )
}