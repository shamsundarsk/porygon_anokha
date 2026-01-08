import React from 'react'
import { Navigation, Phone, MessageCircle, Clock } from 'lucide-react'

const DriverMapView: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Map Container */}
      <div className="relative h-screen">
        {/* Placeholder for map */}
        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
          <div className="text-center">
            <Navigation className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Map will be integrated here</p>
            <p className="text-gray-500 text-sm">MapMyIndia / Mapbox integration</p>
          </div>
        </div>

        {/* Floating Action Buttons */}
        <div className="absolute top-4 right-4 space-y-2">
          <button className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center">
            <Navigation className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        {/* Current Delivery Card */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-white rounded-lg shadow-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Current Delivery</h3>
              <span className="bg-primary-100 text-primary-800 px-2 py-1 rounded text-sm">
                In Progress
              </span>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Pickup</p>
                <p className="font-medium">123 Main Street, Mumbai</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Drop</p>
                <p className="font-medium">456 Park Avenue, Mumbai</p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>Est. 25 min</span>
              </div>
              <div className="flex space-x-2">
                <button className="p-2 bg-primary-600 text-white rounded-lg">
                  <Phone className="h-4 w-4" />
                </button>
                <button className="p-2 bg-success-600 text-white rounded-lg">
                  <MessageCircle className="h-4 w-4" />
                </button>
              </div>
            </div>

            <button className="w-full mt-4 bg-success-600 hover:bg-success-700 text-white py-2 rounded-lg font-medium">
              Mark as Delivered
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DriverMapView