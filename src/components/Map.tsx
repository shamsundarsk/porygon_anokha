import React, { useState, useEffect } from 'react'
import { MapPin, Navigation, Truck, Package } from 'lucide-react'

interface MapProps {
  pickup?: { lat: number; lng: number; address: string }
  dropoff?: { lat: number; lng: number; address: string }
  driverLocation?: { lat: number; lng: number }
  showRoute?: boolean
  height?: string
}

const Map: React.FC<MapProps> = ({ 
  pickup, 
  dropoff, 
  driverLocation, 
  showRoute = true,
  height = "400px" 
}) => {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate map loading
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div 
        className="bg-slate-100 rounded-lg flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto mb-2"></div>
          <p className="text-slate-600 text-sm">Loading map...</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="bg-gradient-to-br from-blue-50 to-green-50 rounded-lg relative overflow-hidden border border-slate-200"
      style={{ height }}
    >
      {/* Map Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#94a3b8" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Route Line */}
      {showRoute && pickup && dropoff && (
        <svg className="absolute inset-0 w-full h-full">
          <line
            x1="20%"
            y1="70%"
            x2="80%"
            y2="30%"
            stroke="#3b82f6"
            strokeWidth="3"
            strokeDasharray="5,5"
            className="animate-pulse"
          />
        </svg>
      )}

      {/* Pickup Location */}
      {pickup && (
        <div className="absolute" style={{ left: '20%', top: '70%', transform: 'translate(-50%, -50%)' }}>
          <div className="bg-green-500 rounded-full p-2 shadow-lg">
            <Package className="w-4 h-4 text-white" />
          </div>
          <div className="bg-white rounded-lg shadow-md p-2 mt-2 min-w-max">
            <p className="text-xs font-medium text-slate-900">Pickup</p>
            <p className="text-xs text-slate-600">{pickup.address}</p>
          </div>
        </div>
      )}

      {/* Dropoff Location */}
      {dropoff && (
        <div className="absolute" style={{ left: '80%', top: '30%', transform: 'translate(-50%, -50%)' }}>
          <div className="bg-red-500 rounded-full p-2 shadow-lg">
            <MapPin className="w-4 h-4 text-white" />
          </div>
          <div className="bg-white rounded-lg shadow-md p-2 mt-2 min-w-max">
            <p className="text-xs font-medium text-slate-900">Dropoff</p>
            <p className="text-xs text-slate-600">{dropoff.address}</p>
          </div>
        </div>
      )}

      {/* Driver Location */}
      {driverLocation && (
        <div className="absolute" style={{ left: '45%', top: '55%', transform: 'translate(-50%, -50%)' }}>
          <div className="bg-blue-500 rounded-full p-2 shadow-lg animate-bounce">
            <Truck className="w-4 h-4 text-white" />
          </div>
          <div className="bg-white rounded-lg shadow-md p-2 mt-2 min-w-max">
            <p className="text-xs font-medium text-slate-900">Driver</p>
            <p className="text-xs text-slate-600">En route</p>
          </div>
        </div>
      )}

      {/* Map Controls */}
      <div className="absolute top-4 right-4 space-y-2">
        <button className="bg-white rounded-lg p-2 shadow-md hover:shadow-lg transition-shadow">
          <Navigation className="w-4 h-4 text-slate-600" />
        </button>
        <button className="bg-white rounded-lg p-2 shadow-md hover:shadow-lg transition-shadow">
          <MapPin className="w-4 h-4 text-slate-600" />
        </button>
      </div>

      {/* Map Info */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-3">
        <div className="flex items-center space-x-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-slate-600">Live Tracking</span>
        </div>
        {showRoute && (
          <p className="text-xs text-slate-500 mt-1">
            Estimated time: 25 minutes
          </p>
        )}
      </div>
    </div>
  )
}

export default Map