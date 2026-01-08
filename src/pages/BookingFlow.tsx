import React, { useState, useEffect } from 'react'
import { useBooking } from '../contexts/BookingContext'
import { FareBreakdown as FareBreakdownType } from '../types'
import FareBreakdown from '../components/FareBreakdown'
import { 
  MapPin, 
  Navigation, 
  Truck, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Car
} from 'lucide-react'

const BookingFlow: React.FC = () => {
  const [step, setStep] = useState(1)
  const [deliveryData, setDeliveryData] = useState({
    pickup: { address: '', lat: 0, lng: 0, contactName: '', contactPhone: '', instructions: '' },
    dropoff: { address: '', lat: 0, lng: 0, contactName: '', contactPhone: '', instructions: '' },
    package: {
      type: 'parcel',
      weight: 1,
      fragile: false,
      description: '',
      value: 0
    },
    vehicleType: '',
    businessType: 'b2c',
    scheduledTime: '',
    customerNotes: ''
  })
  const [fareBreakdown, setFareBreakdown] = useState<FareBreakdownType | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { createDelivery, calculateFare, currentDelivery } = useBooking()

  const vehicleTypes = [
    { id: 'bike', name: 'Bike', icon: '🏍️', capacity: '10kg', price: 'from ₹30' },
    { id: 'auto', name: 'Auto Rickshaw', icon: '🛺', capacity: '50kg', price: 'from ₹50' },
    { id: 'mini-truck', name: 'Mini Truck', icon: '🚛', capacity: '500kg', price: 'from ₹200' },
    { id: 'pickup', name: 'Pickup Truck', icon: '🚚', capacity: '1000kg', price: 'from ₹400' }
  ]

  const handleLocationChange = (field: string, subfield: string, value: string) => {
    setDeliveryData({
      ...deliveryData,
      [field]: { ...deliveryData[field as keyof typeof deliveryData], [subfield]: value }
    })
  }

  const handleCalculateFare = async () => {
    if (!deliveryData.pickup.address || !deliveryData.dropoff.address || !deliveryData.vehicleType) {
      setError('Please fill all required fields')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Mock coordinates for demo
      const pickup = { ...deliveryData.pickup, lat: 19.0760, lng: 72.8777 }
      const dropoff = { ...deliveryData.dropoff, lat: 19.0896, lng: 72.8656 }
      
      const fare = await calculateFare(pickup, dropoff, deliveryData.vehicleType)
      setFareBreakdown(fare)
      setStep(4)
    } catch (err) {
      setError('Failed to calculate fare. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmDelivery = async () => {
    if (!fareBreakdown) return

    setLoading(true)
    setError('')

    try {
      await createDelivery({
        ...deliveryData,
        pickup: { ...deliveryData.pickup, lat: 19.0760, lng: 72.8777 },
        dropoff: { ...deliveryData.dropoff, lat: 19.0896, lng: 72.8656 },
        fareBreakdown
      })
      setStep(5)
    } catch (err) {
      setError('Failed to create delivery. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (currentDelivery && step === 5) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="card p-8 text-center">
            <CheckCircle className="h-16 w-16 text-success-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Delivery Confirmed!
            </h2>
            <p className="text-gray-600 mb-6">
              Your delivery request has been created. We're finding the best partner for you.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <p className="font-medium">Delivery ID: {currentDelivery.id}</p>
              <p className="text-sm text-gray-600">Status: {currentDelivery.status}</p>
            </div>
            <button 
              onClick={() => window.location.href = '/customer-dashboard'}
              className="btn-primary"
            >
              Track Your Delivery
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNum 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {stepNum}
                </div>
                {stepNum < 3 && (
                  <div className={`w-16 h-1 mx-2 ${
                    step > stepNum ? 'bg-primary-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">
                {step === 1 && 'Enter pickup and drop locations'}
                {step === 2 && 'Choose your vehicle'}
                {step === 3 && 'Review and confirm'}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Step 1: Locations */}
        {step === 1 && (
          <div className="card p-6">
            <h2 className="text-xl font-bold mb-6">Where are we picking up and dropping off?</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  Pickup Location
                </label>
                <input
                  type="text"
                  value={bookingData.pickup.address}
                  onChange={(e) => handleLocationChange('pickup', e.target.value)}
                  className="input-field"
                  placeholder="Enter pickup address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Navigation className="inline h-4 w-4 mr-1" />
                  Drop Location
                </label>
                <input
                  type="text"
                  value={bookingData.dropoff.address}
                  onChange={(e) => handleLocationChange('dropoff', e.target.value)}
                  className="input-field"
                  placeholder="Enter drop address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="inline h-4 w-4 mr-1" />
                  Schedule Time (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={bookingData.scheduledTime}
                  onChange={(e) => setBookingData({ ...bookingData, scheduledTime: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={bookingData.customerNotes}
                  onChange={(e) => setBookingData({ ...bookingData, customerNotes: e.target.value })}
                  className="input-field"
                  rows={3}
                  placeholder="Any special instructions for the driver"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setStep(2)}
                disabled={!bookingData.pickup.address || !bookingData.dropoff.address}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Vehicle Selection */}
        {step === 2 && (
          <div className="card p-6">
            <h2 className="text-xl font-bold mb-6">Choose your vehicle</h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              {vehicleTypes.map((vehicle) => (
                <button
                  key={vehicle.id}
                  onClick={() => setBookingData({ ...bookingData, vehicleType: vehicle.id })}
                  className={`p-4 border rounded-lg text-left hover:shadow-md transition-shadow ${
                    bookingData.vehicleType === vehicle.id
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{vehicle.icon}</span>
                    <div>
                      <h3 className="font-medium">{vehicle.name}</h3>
                      <p className="text-sm text-gray-600">Capacity: {vehicle.capacity}</p>
                      <p className="text-sm text-primary-600 font-medium">{vehicle.price}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="btn-secondary"
              >
                Back
              </button>
              <button
                onClick={handleCalculateFare}
                disabled={!bookingData.vehicleType || loading}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Calculating...' : 'Calculate Fare'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Fare Review */}
        {step === 3 && fareBreakdown && (
          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="text-xl font-bold mb-4">Trip Summary</h2>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">From:</span>
                  <span className="font-medium">{bookingData.pickup.address}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Navigation className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-gray-600">To:</span>
                  <span className="font-medium">{bookingData.dropoff.address}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Car className="h-4 w-4 text-primary-600" />
                  <span className="text-sm text-gray-600">Vehicle:</span>
                  <span className="font-medium">
                    {vehicleTypes.find(v => v.id === bookingData.vehicleType)?.name}
                  </span>
                </div>
              </div>
            </div>

            <FareBreakdown fareBreakdown={fareBreakdown} />

            <div className="flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="btn-secondary"
              >
                Back
              </button>
              <button
                onClick={handleConfirmBooking}
                disabled={loading}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Confirming...' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default BookingFlow