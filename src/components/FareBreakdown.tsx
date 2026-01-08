import React from 'react'
import { DollarSign, MapPin, Clock, Fuel, AlertCircle } from 'lucide-react'

interface FareBreakdownProps {
  baseFare: number
  distanceCost: number
  fuelAdjustment?: number
  tollCharges?: number
  waitingCharges?: number
  platformCommission?: number
  totalFare: number
  driverEarnings?: number
  distance?: string
  estimatedTime?: string
}

const FareBreakdown: React.FC<FareBreakdownProps> = ({
  baseFare,
  distanceCost,
  fuelAdjustment = 0,
  tollCharges = 0,
  waitingCharges = 0,
  platformCommission = 0,
  totalFare,
  driverEarnings,
  distance,
  estimatedTime
}) => {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center space-x-2 mb-4">
        <DollarSign className="w-5 h-5 text-slate-600" />
        <h3 className="text-lg font-semibold text-slate-900">Fare Breakdown</h3>
      </div>

      {/* Trip Details */}
      {(distance || estimatedTime) && (
        <div className="flex items-center space-x-4 mb-4 p-3 bg-slate-50 rounded-lg">
          {distance && (
            <div className="flex items-center space-x-1 text-sm text-slate-600">
              <MapPin className="w-4 h-4" />
              <span>{distance}</span>
            </div>
          )}
          {estimatedTime && (
            <div className="flex items-center space-x-1 text-sm text-slate-600">
              <Clock className="w-4 h-4" />
              <span>{estimatedTime}</span>
            </div>
          )}
        </div>
      )}

      {/* Fare Components */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-slate-600">Base Fare</span>
          <span className="font-medium text-slate-900">₹{baseFare}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-slate-600">Distance Cost</span>
          <span className="font-medium text-slate-900">₹{distanceCost}</span>
        </div>

        {fuelAdjustment > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <Fuel className="w-4 h-4 text-slate-500" />
              <span className="text-slate-600">Fuel Adjustment</span>
            </div>
            <span className="font-medium text-slate-900">₹{fuelAdjustment}</span>
          </div>
        )}

        {tollCharges > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Toll Charges</span>
            <span className="font-medium text-slate-900">₹{tollCharges}</span>
          </div>
        )}

        {waitingCharges > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Waiting Charges</span>
            <span className="font-medium text-slate-900">₹{waitingCharges}</span>
          </div>
        )}

        {platformCommission > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Platform Fee</span>
            <span className="font-medium text-slate-900">₹{platformCommission}</span>
          </div>
        )}
      </div>

      {/* Total */}
      <div className="border-t border-slate-200 pt-3">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-slate-900">Total Fare</span>
          <span className="text-xl font-bold text-slate-900">₹{totalFare}</span>
        </div>
        
        {driverEarnings && (
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm text-slate-600">Driver Earnings</span>
            <span className="text-sm font-medium text-green-600">₹{driverEarnings}</span>
          </div>
        )}
      </div>

      {/* Fair Pricing Notice */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800">Fair & Transparent Pricing</p>
            <p className="text-xs text-blue-700 mt-1">
              No surge pricing or hidden charges. What you see is what you pay.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FareBreakdown