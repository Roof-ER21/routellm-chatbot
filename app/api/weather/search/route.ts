/**
 * Storm Data Search API
 *
 * Searches for storm events by location (address, city, state, coordinates)
 * Supports GPS location detection and address geocoding
 */

import { NextRequest, NextResponse } from 'next/server'
import { searchStormsByLocation, getStormSummary } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      address,
      city,
      state,
      zipCode,
      latitude,
      longitude,
      radiusMiles = 25,
      startYear,
      endYear,
      includeSummary = true
    } = body

    console.log('[Storm Search] Request:', { address, city, state, zipCode, latitude, longitude })

    // If address provided but no coordinates, geocode it
    let lat = latitude
    let lng = longitude

    if (address && !lat && !lng) {
      // Geocode the address using free geocoding service
      const geocoded = await geocodeAddress(address)
      if (geocoded) {
        lat = geocoded.lat
        lng = geocoded.lng
      }
    }

    // Search for storms
    const storms = await searchStormsByLocation({
      address,
      city,
      state,
      zipCode,
      latitude: lat,
      longitude: lng,
      radiusMiles,
      startYear: startYear || new Date().getFullYear() - 2,
      endYear: endYear || new Date().getFullYear()
    })

    // Get summary if requested and coordinates available
    let summary = null
    if (includeSummary && lat && lng) {
      summary = await getStormSummary({
        latitude: lat,
        longitude: lng,
        radiusMiles,
        years: 2
      })
    }

    return NextResponse.json({
      success: true,
      location: {
        address,
        city,
        state,
        zipCode,
        latitude: lat,
        longitude: lng,
        radiusMiles
      },
      summary,
      storms,
      count: storms.length
    })

  } catch (error: any) {
    console.error('[Storm Search] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to search storm data'
      },
      { status: 500 }
    )
  }
}

// Free geocoding using OpenStreetMap Nominatim
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    // Add state restriction for better results (VA, MD, PA)
    const searchQuery = encodeURIComponent(address)
    const url = `https://nominatim.openstreetmap.org/search?q=${searchQuery}&format=json&limit=1&countrycodes=us`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Susan-AI-Roofing-Assistant/1.0'
      }
    })

    if (!response.ok) {
      console.error('[Geocoding] API error:', response.status)
      return null
    }

    const data = await response.json()

    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      }
    }

    return null
  } catch (error) {
    console.error('[Geocoding] Error:', error)
    return null
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    endpoint: '/api/weather/search',
    method: 'POST',
    description: 'Search for storm events by location',
    parameters: {
      address: 'Full address to search (will be geocoded)',
      city: 'City name',
      state: 'State code (VA, MD, PA)',
      zipCode: 'ZIP code',
      latitude: 'Latitude coordinate',
      longitude: 'Longitude coordinate',
      radiusMiles: 'Search radius in miles (default: 25)',
      startYear: 'Start year for search (default: current year - 2)',
      endYear: 'End year for search (default: current year)',
      includeSummary: 'Include summary statistics (default: true)'
    },
    example: {
      address: '123 Main St, Richmond, VA 23220',
      radiusMiles: 25,
      startYear: 2023,
      endYear: 2025
    }
  })
}
