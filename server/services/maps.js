const axios = require('axios')

// MapMyIndia API integration
class MapService {
  constructor() {
    this.mapMyIndiaKey = process.env.MAPMYINDIA_API_KEY
    this.mapboxToken = process.env.MAPBOX_ACCESS_TOKEN
  }

  // Calculate distance and duration between two points
  async calculateDistance(pickup, dropoff) {
    try {
      // Try MapMyIndia first (Indian maps provider)
      if (this.mapMyIndiaKey && this.mapMyIndiaKey !== 'demo-mapmyindia-key') {
        return await this.calculateDistanceMapMyIndia(pickup, dropoff)
      }
      
      // Fallback to Mapbox
      if (this.mapboxToken && this.mapboxToken !== 'demo-mapbox-token') {
        return await this.calculateDistanceMapbox(pickup, dropoff)
      }

      // Demo calculation using Haversine formula
      return this.calculateDistanceDemo(pickup, dropoff)
    } catch (error) {
      console.error('Distance calculation error:', error)
      return this.calculateDistanceDemo(pickup, dropoff)
    }
  }

  // MapMyIndia Distance Matrix API
  async calculateDistanceMapMyIndia(pickup, dropoff) {
    try {
      const url = `https://apis.mapmyindia.com/advancedmaps/v1/${this.mapMyIndiaKey}/distance_matrix/driving/${pickup.lng},${pickup.lat};${dropoff.lng},${dropoff.lat}`
      
      const response = await axios.get(url, {
        params: {
          sources: 0,
          destinations: 1
        }
      })

      const data = response.data
      if (data.results && data.results[0] && data.results[0][0]) {
        const result = data.results[0][0]
        return {
          success: true,
          distance: result.distance / 1000, // Convert to km
          duration: result.duration / 60, // Convert to minutes
          provider: 'MapMyIndia'
        }
      }

      throw new Error('Invalid response from MapMyIndia')
    } catch (error) {
      console.error('MapMyIndia API error:', error)
      throw error
    }
  }

  // Mapbox Directions API
  async calculateDistanceMapbox(pickup, dropoff) {
    try {
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${pickup.lng},${pickup.lat};${dropoff.lng},${dropoff.lat}`
      
      const response = await axios.get(url, {
        params: {
          access_token: this.mapboxToken,
          geometries: 'geojson',
          overview: 'simplified'
        }
      })

      const data = response.data
      if (data.routes && data.routes[0]) {
        const route = data.routes[0]
        return {
          success: true,
          distance: route.distance / 1000, // Convert to km
          duration: route.duration / 60, // Convert to minutes
          geometry: route.geometry,
          provider: 'Mapbox'
        }
      }

      throw new Error('Invalid response from Mapbox')
    } catch (error) {
      console.error('Mapbox API error:', error)
      throw error
    }
  }

  // Demo calculation using Haversine formula
  calculateDistanceDemo(pickup, dropoff) {
    const R = 6371 // Earth's radius in km
    const dLat = this.toRadians(dropoff.lat - pickup.lat)
    const dLng = this.toRadians(dropoff.lng - pickup.lng)
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(pickup.lat)) * Math.cos(this.toRadians(dropoff.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c

    // Estimate duration based on average city speed (25 km/h)
    const duration = (distance / 25) * 60

    return {
      success: true,
      distance: Math.round(distance * 100) / 100,
      duration: Math.round(duration),
      provider: 'Demo'
    }
  }

  // Geocoding - convert address to coordinates
  async geocodeAddress(address) {
    try {
      // Try MapMyIndia geocoding
      if (this.mapMyIndiaKey && this.mapMyIndiaKey !== 'demo-mapmyindia-key') {
        return await this.geocodeMapMyIndia(address)
      }

      // Fallback to Mapbox
      if (this.mapboxToken && this.mapboxToken !== 'demo-mapbox-token') {
        return await this.geocodeMapbox(address)
      }

      // Demo geocoding
      return this.geocodeDemo(address)
    } catch (error) {
      console.error('Geocoding error:', error)
      return this.geocodeDemo(address)
    }
  }

  async geocodeMapMyIndia(address) {
    try {
      const url = `https://apis.mapmyindia.com/advancedmaps/v1/${this.mapMyIndiaKey}/geo_code`
      
      const response = await axios.get(url, {
        params: {
          addr: address,
          itemCount: 1
        }
      })

      const data = response.data
      if (data.copResults && data.copResults.length > 0) {
        const result = data.copResults[0]
        return {
          success: true,
          lat: parseFloat(result.latitude),
          lng: parseFloat(result.longitude),
          formattedAddress: result.formatted_address,
          provider: 'MapMyIndia'
        }
      }

      throw new Error('No results found')
    } catch (error) {
      console.error('MapMyIndia geocoding error:', error)
      throw error
    }
  }

  async geocodeMapbox(address) {
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json`
      
      const response = await axios.get(url, {
        params: {
          access_token: this.mapboxToken,
          country: 'IN', // Restrict to India
          limit: 1
        }
      })

      const data = response.data
      if (data.features && data.features.length > 0) {
        const feature = data.features[0]
        return {
          success: true,
          lat: feature.center[1],
          lng: feature.center[0],
          formattedAddress: feature.place_name,
          provider: 'Mapbox'
        }
      }

      throw new Error('No results found')
    } catch (error) {
      console.error('Mapbox geocoding error:', error)
      throw error
    }
  }

  geocodeDemo(address) {
    // Mock coordinates for major Indian cities
    const mockCoordinates = {
      'mumbai': { lat: 19.0760, lng: 72.8777 },
      'delhi': { lat: 28.6139, lng: 77.2090 },
      'bangalore': { lat: 12.9716, lng: 77.5946 },
      'pune': { lat: 18.5204, lng: 73.8567 },
      'hyderabad': { lat: 17.3850, lng: 78.4867 },
      'chennai': { lat: 13.0827, lng: 80.2707 },
      'kolkata': { lat: 22.5726, lng: 88.3639 },
      'ahmedabad': { lat: 23.0225, lng: 72.5714 },
      'jaipur': { lat: 26.9124, lng: 75.7873 },
      'surat': { lat: 21.1702, lng: 72.8311 }
    }

    const city = address.toLowerCase()
    for (const [key, coords] of Object.entries(mockCoordinates)) {
      if (city.includes(key)) {
        return {
          success: true,
          lat: coords.lat + (Math.random() - 0.5) * 0.02, // Add small random offset
          lng: coords.lng + (Math.random() - 0.5) * 0.02,
          formattedAddress: address,
          provider: 'Demo'
        }
      }
    }

    // Default to Mumbai with random offset
    return {
      success: true,
      lat: 19.0760 + (Math.random() - 0.5) * 0.1,
      lng: 72.8777 + (Math.random() - 0.5) * 0.1,
      formattedAddress: address,
      provider: 'Demo'
    }
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180)
  }
}

// Fare calculation service
class FareService {
  constructor() {
    this.pricingRules = {
      BIKE: { baseFare: 30, perKmRate: 8, perMinuteRate: 1 },
      AUTO: { baseFare: 50, perKmRate: 12, perMinuteRate: 1.5 },
      MINI_TRUCK: { baseFare: 200, perKmRate: 25, perMinuteRate: 3 },
      PICKUP: { baseFare: 400, perKmRate: 35, perMinuteRate: 4 }
    }
  }

  async calculateFare({ distance, duration, vehicleType, packageWeight = 1 }) {
    try {
      const rules = this.pricingRules[vehicleType] || this.pricingRules.AUTO

      // Base calculations
      const baseFare = rules.baseFare
      const distanceCost = distance * rules.perKmRate
      
      // Dynamic fuel adjustment (15% of distance cost)
      const fuelAdjustment = Math.round(distanceCost * 0.15)
      
      // Toll charges for longer distances
      const tollCharges = distance > 10 ? Math.round(distance * 2) : 0
      
      // Weight surcharge for heavy packages
      const weightSurcharge = packageWeight > 5 ? (packageWeight - 5) * 10 : 0
      
      // Peak hour surge pricing
      const currentHour = new Date().getHours()
      const isPeakHour = (currentHour >= 8 && currentHour <= 10) || (currentHour >= 17 && currentHour <= 20)
      const surgeFactor = isPeakHour ? 1.2 : 1.0
      
      // Calculate subtotal
      const subtotal = (baseFare + distanceCost + fuelAdjustment + tollCharges + weightSurcharge) * surgeFactor
      
      // Platform commission (12%)
      const platformCommission = Math.round(subtotal * 0.12)
      
      // Final amounts
      const totalFare = Math.round(subtotal)
      const driverEarnings = totalFare - platformCommission

      return {
        baseFare,
        distanceCost: Math.round(distanceCost),
        fuelAdjustment,
        tollCharges,
        weightSurcharge,
        surgeFactor: isPeakHour ? surgeFactor : undefined,
        platformCommission,
        totalFare,
        driverEarnings,
        breakdown: {
          distance: `${distance} km`,
          duration: `${duration} min`,
          vehicleType,
          packageWeight: `${packageWeight} kg`,
          isPeakHour
        }
      }
    } catch (error) {
      console.error('Fare calculation error:', error)
      throw new Error('Failed to calculate fare')
    }
  }
}

// Export instances
const mapService = new MapService()
const fareService = new FareService()

module.exports = {
  calculateDistance: (pickup, dropoff) => mapService.calculateDistance(pickup, dropoff),
  geocodeAddress: (address) => mapService.geocodeAddress(address),
  calculateFare: (params) => fareService.calculateFare(params)
}