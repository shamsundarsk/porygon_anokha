// Simple maps service for development
const calculateFare = (distance, vehicleType = 'BIKE') => {
  const baseFares = {
    BIKE: 20,
    AUTO: 30,
    MINI_TRUCK: 50,
    PICKUP: 60
  }
  
  const perKmRates = {
    BIKE: 8,
    AUTO: 12,
    MINI_TRUCK: 15,
    PICKUP: 18
  }
  
  const baseFare = baseFares[vehicleType] || baseFares.BIKE
  const perKmRate = perKmRates[vehicleType] || perKmRates.BIKE
  
  const distanceCost = distance * perKmRate
  const fuelAdjustment = distance * 2
  const platformCommission = (baseFare + distanceCost) * 0.1
  const totalFare = baseFare + distanceCost + fuelAdjustment + platformCommission
  const driverEarnings = totalFare - platformCommission
  
  return {
    baseFare,
    distanceCost,
    fuelAdjustment,
    platformCommission,
    totalFare,
    driverEarnings,
    estimatedDistance: distance,
    estimatedDuration: Math.ceil(distance * 3) // 3 minutes per km
  }
}

const calculateDistance = (lat1, lng1, lat2, lng2) => {
  // Simple distance calculation (Haversine formula)
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

module.exports = {
  calculateFare,
  calculateDistance
}