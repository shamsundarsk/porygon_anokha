const express = require('express')
const { calculateDistance, geocodeAddress } = require('../services/maps')

const router = express.Router()

// Geocode address to coordinates
router.post('/geocode', async (req, res) => {
  try {
    const { address } = req.body

    if (!address) {
      return res.status(400).json({ error: 'Address is required' })
    }

    const result = await geocodeAddress(address)
    res.json(result)
  } catch (error) {
    console.error('Geocoding error:', error)
    res.status(500).json({ error: 'Failed to geocode address' })
  }
})

// Get route between two points
router.post('/route', async (req, res) => {
  try {
    const { pickup, dropoff } = req.body

    if (!pickup || !dropoff) {
      return res.status(400).json({ error: 'Pickup and dropoff locations are required' })
    }

    const result = await calculateDistance(pickup, dropoff)
    res.json(result)
  } catch (error) {
    console.error('Route calculation error:', error)
    res.status(500).json({ error: 'Failed to calculate route' })
  }
})

module.exports = router