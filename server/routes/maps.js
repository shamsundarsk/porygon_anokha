const express = require('express')
const { calculateDistance } = require('../services/maps')

const router = express.Router()

// Geocode address (demo)
router.post('/geocode', async (req, res) => {
  try {
    const { address } = req.body
    
    // Demo geocoding - return random coordinates
    const result = {
      address,
      lat: 12.9716 + (Math.random() - 0.5) * 0.1,
      lng: 77.5946 + (Math.random() - 0.5) * 0.1,
      formatted_address: address
    }
    
    res.json(result)
  } catch (error) {
    console.error('Geocoding error:', error)
    res.status(500).json({ error: 'Geocoding failed' })
  }
})

// Calculate distance
router.post('/distance', async (req, res) => {
  try {
    const { origins, destinations } = req.body
    
    const distance = calculateDistance(
      origins[0].lat, origins[0].lng,
      destinations[0].lat, destinations[0].lng
    )
    
    res.json({
      distance: distance,
      duration: Math.ceil(distance * 3) // 3 minutes per km
    })
  } catch (error) {
    console.error('Distance calculation error:', error)
    res.status(500).json({ error: 'Distance calculation failed' })
  }
})

module.exports = router