import React, { createContext, useContext, useState, useEffect } from 'react'
import { DeliveryRequest, FareBreakdown } from '../types'
import io from 'socket.io-client'

interface BookingContextType {
  currentDelivery: DeliveryRequest | null
  deliveries: DeliveryRequest[]
  createDelivery: (deliveryData: any) => Promise<DeliveryRequest>
  cancelDelivery: (deliveryId: string) => Promise<void>
  calculateFare: (pickup: any, dropoff: any, vehicleType: string) => Promise<FareBreakdown>
  trackDelivery: (deliveryId: string) => void
  stopTracking: () => void
}

const BookingContext = createContext<BookingContextType | undefined>(undefined)

export const useBooking = () => {
  const context = useContext(BookingContext)
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider')
  }
  return context
}

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentDelivery, setCurrentDelivery] = useState<DeliveryRequest | null>(null)
  const [deliveries, setDeliveries] = useState<DeliveryRequest[]>([])
  const [socket, setSocket] = useState<any>(null)

  useEffect(() => {
    const newSocket = io('http://localhost:5001')
    setSocket(newSocket)

    return () => newSocket.close()
  }, [])

  const createDelivery = async (deliveryData: any): Promise<DeliveryRequest> => {
    const token = localStorage.getItem('fairload_token')
    const response = await fetch('/api/deliveries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(deliveryData)
    })

    if (!response.ok) {
      throw new Error('Failed to create delivery')
    }

    const delivery = await response.json()
    setCurrentDelivery(delivery)
    return delivery
  }

  const cancelDelivery = async (deliveryId: string) => {
    const token = localStorage.getItem('fairload_token')
    const response = await fetch(`/api/deliveries/${deliveryId}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to cancel delivery')
    }

    setCurrentDelivery(null)
  }

  const calculateFare = async (pickup: any, dropoff: any, vehicleType: string): Promise<FareBreakdown> => {
    const response = await fetch('/api/deliveries/calculate-fare', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ pickup, dropoff, vehicleType })
    })

    if (!response.ok) {
      throw new Error('Failed to calculate fare')
    }

    return response.json()
  }

  const trackDelivery = (deliveryId: string) => {
    if (socket) {
      socket.emit('track-delivery', deliveryId)
      socket.on('delivery-update', (delivery: DeliveryRequest) => {
        setCurrentDelivery(delivery)
      })
    }
  }

  const stopTracking = () => {
    if (socket) {
      socket.off('delivery-update')
    }
  }

  return (
    <BookingContext.Provider value={{
      currentDelivery,
      deliveries,
      createDelivery,
      cancelDelivery,
      calculateFare,
      trackDelivery,
      stopTracking
    }}>
      {children}
    </BookingContext.Provider>
  )
}