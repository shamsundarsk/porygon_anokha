import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Package, Truck, CreditCard, CheckCircle } from 'lucide-react'

const DeliveryFlow: React.FC = () => {
  const [step, setStep] = useState(1)

  const steps = [
    { id: 1, name: 'Pickup & Drop', icon: MapPin },
    { id: 2, name: 'Package Details', icon: Package },
    { id: 3, name: 'Vehicle Type', icon: Truck },
    { id: 4, name: 'Payment', icon: CreditCard },
    { id: 5, name: 'Confirmation', icon: CheckCircle }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {steps.map((stepItem, index) => (
              <div key={stepItem.id} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepItem.id 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  <stepItem.icon className="h-5 w-5" />
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-1 mx-2 ${
                    step > stepItem.id ? 'bg-primary-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-4">
            <p className="text-sm text-gray-600">
              Step {step} of {steps.length}: {steps[step - 1]?.name}
            </p>
          </div>
        </div>

        {/* Step Content */}
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-lg shadow p-8"
        >
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Pickup & Drop Locations</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pickup Location
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Enter pickup address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Drop Location
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Enter drop address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Schedule Time (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Package Details</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Package Type
                  </label>
                  <select className="input-field">
                    <option>Document</option>
                    <option>Parcel</option>
                    <option>Food</option>
                    <option>Electronics</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      className="input-field"
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Value (₹)
                    </label>
                    <input
                      type="number"
                      className="input-field"
                      placeholder="1000"
                    />
                  </div>
                </div>
                <div>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm text-gray-700">Fragile item</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Choose Vehicle Type</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { id: 'bike', name: 'Bike', capacity: '10kg', price: 'from ₹30' },
                  { id: 'auto', name: 'Auto Rickshaw', capacity: '50kg', price: 'from ₹50' },
                  { id: 'mini-truck', name: 'Mini Truck', capacity: '500kg', price: 'from ₹200' },
                  { id: 'pickup', name: 'Pickup Truck', capacity: '1000kg', price: 'from ₹400' }
                ].map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className="p-4 border rounded-lg hover:border-primary-600 cursor-pointer"
                  >
                    <h3 className="font-medium">{vehicle.name}</h3>
                    <p className="text-sm text-gray-600">Capacity: {vehicle.capacity}</p>
                    <p className="text-sm text-primary-600 font-medium">{vehicle.price}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Payment & Confirmation</h2>
              <div className="bg-gray-50 p-6 rounded-lg mb-6">
                <h3 className="font-semibold mb-4">Fare Breakdown</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Base Fare</span>
                    <span>₹50</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Distance Cost</span>
                    <span>₹60</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fuel Adjustment</span>
                    <span>₹9</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg border-t pt-2">
                    <span>Total</span>
                    <span>₹119</span>
                  </div>
                </div>
              </div>
              <button className="w-full btn-primary py-3">
                Confirm & Pay
              </button>
            </div>
          )}

          {step === 5 && (
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-success-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">Delivery Confirmed!</h2>
              <p className="text-gray-600 mb-6">
                Your delivery request has been created. We're finding the best partner for you.
              </p>
              <button className="btn-primary">
                Track Your Delivery
              </button>
            </div>
          )}

          {/* Navigation */}
          {step < 5 && (
            <div className="flex justify-between mt-8">
              <button
                onClick={() => setStep(Math.max(1, step - 1))}
                disabled={step === 1}
                className="btn-secondary disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={() => setStep(Math.min(5, step + 1))}
                className="btn-primary"
              >
                {step === 4 ? 'Confirm' : 'Continue'}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default DeliveryFlow