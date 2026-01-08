// Distance calculation service using Google Maps Distance Matrix API
// For demo purposes, we'll use mock data. In production, replace with actual API calls.

export interface Location {
  lat: number
  lng: number
  address: string
}

export interface DistanceResult {
  distance: number // in kilometers
  duration: number // in minutes
  status: 'OK' | 'ERROR'
}

// Mock Google Maps API key - replace with actual key in production
const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY'

/**
 * Calculate distance and duration between two locations
 * In production, this would make actual API calls to Google Maps Distance Matrix API
 */
export const calculateDistance = async (
  origin: Location,
  destination: Location
): Promise<DistanceResult> => {
  try {
    // For demo purposes, we'll calculate approximate distance using Haversine formula
    // In production, replace this with actual Google Maps API call
    
    if (GOOGLE_MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY') {
      // Mock calculation for demo
      const distance = calculateHaversineDistance(origin, destination)
      const duration = estimateDuration(distance)
      
      return {
        distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
        duration: Math.round(duration),
        status: 'OK'
      }
    }

    // Actual Google Maps API call (uncomment and configure for production)
    /*
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?` +
      `origins=${origin.lat},${origin.lng}&` +
      `destinations=${destination.lat},${destination.lng}&` +
      `units=metric&` +
      `key=${GOOGLE_MAPS_API_KEY}`
    )

    const data = await response.json()

    if (data.status === 'OK' && data.rows[0].elements[0].status === 'OK') {
      const element = data.rows[0].elements[0]
      return {
        distance: element.distance.value / 1000, // Convert meters to kilometers
        duration: element.duration.value / 60, // Convert seconds to minutes
        status: 'OK'
      }
    }
    */

    throw new Error('Failed to calculate distance')
  } catch (error) {
    console.error('Distance calculation error:', error)
    return {
      distance: 0,
      duration: 0,
      status: 'ERROR'
    }
  }
}

/**
 * Calculate distance between two points using Haversine formula
 * This is a fallback method for demo purposes
 */
function calculateHaversineDistance(point1: Location, point2: Location): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRadians(point2.lat - point1.lat)
  const dLng = toRadians(point2.lng - point1.lng)
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.lat)) * Math.cos(toRadians(point2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Estimate duration based on distance
 * Assumes average speed of 25 km/h in city traffic
 */
function estimateDuration(distance: number): number {
  const averageSpeed = 25 // km/h
  return (distance / averageSpeed) * 60 // Convert to minutes
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Get coordinates from address using Geocoding API
 * For demo purposes, returns mock coordinates
 */
export const geocodeAddress = async (address: string): Promise<Location | null> => {
  try {
    if (GOOGLE_MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY') {
      // Mock geocoding for demo - return coordinates for major Indian cities
      const mockCoordinates: { [key: string]: { lat: number, lng: number } } = {
        'mumbai': { lat: 19.0760, lng: 72.8777 },
        'delhi': { lat: 28.6139, lng: 77.2090 },
        'bangalore': { lat: 12.9716, lng: 77.5946 },
        'pune': { lat: 18.5204, lng: 73.8567 },
        'hyderabad': { lat: 17.3850, lng: 78.4867 },
        'chennai': { lat: 13.0827, lng: 80.2707 }
      }

      const city = address.toLowerCase()
      for (const [key, coords] of Object.entries(mockCoordinates)) {
        if (city.includes(key)) {
          return {
            lat: coords.lat + (Math.random() - 0.5) * 0.1, // Add some randomness
            lng: coords.lng + (Math.random() - 0.5) * 0.1,
            address
          }
        }
      }

      // Default to Mumbai with random offset
      return {
        lat: 19.0760 + (Math.random() - 0.5) * 0.1,
        lng: 72.8777 + (Math.random() - 0.5) * 0.1,
        address
      }
    }

    // Actual Geocoding API call (uncomment and configure for production)
    /*
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?` +
      `address=${encodeURIComponent(address)}&` +
      `key=${GOOGLE_MAPS_API_KEY}`
    )

    const data = await response.json()

    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0]
      return {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        address: result.formatted_address
      }
    }
    */

    return null
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
}

/**
 * Calculate fare based on distance and vehicle type
 */
export const calculateFare = (distance: number, vehicleType: string, duration: number) => {
  const baseFares: { [key: string]: number } = {
    bike: 30,
    auto: 50,
    'mini-truck': 200,
    pickup: 400
  }

  const perKmRates: { [key: string]: number } = {
    bike: 8,
    auto: 12,
    'mini-truck': 25,
    pickup: 35
  }

  const baseFare = baseFares[vehicleType] || 50
  const distanceCost = distance * (perKmRates[vehicleType] || 12)
  
  // Dynamic fuel adjustment based on current fuel prices
  const fuelAdjustment = Math.round(distanceCost * 0.15) // 15% fuel adjustment
  
  // Toll charges for longer distances
  const tollCharges = distance > 10 ? Math.round(distance * 2) : 0
  
  // Time-based surge pricing during peak hours
  const currentHour = new Date().getHours()
  const isPeakHour = (currentHour >= 8 && currentHour <= 10) || (currentHour >= 17 && currentHour <= 20)
  const surgeFactor = isPeakHour ? 1.2 : 1.0
  
  const subtotal = (baseFare + distanceCost + fuelAdjustment + tollCharges) * surgeFactor
  const platformCommission = Math.round(subtotal * 0.12) // 12% commission
  const totalFare = Math.round(subtotal)
  const driverEarnings = totalFare - platformCommission

  return {
    baseFare,
    distanceCost: Math.round(distanceCost),
    fuelAdjustment,
    tollCharges,
    waitingTime: 0, // Will be updated during delivery
    platformCommission,
    totalFare,
    driverEarnings,
    surgeFactor: isPeakHour ? surgeFactor : undefined,
    estimatedDuration: duration
  }
}