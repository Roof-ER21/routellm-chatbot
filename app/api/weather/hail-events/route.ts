import { NextRequest, NextResponse } from 'next/server'
import { queryHailEvents, WeatherQueryParams } from '@/lib/noaa-weather-api'

/**
 * GET /api/weather/hail-events
 *
 * Query hail events from the database with various filters
 *
 * Query Parameters:
 * - state: State abbreviation (VA, MD, PA)
 * - zip: Zip code
 * - lat: Latitude
 * - lon: Longitude
 * - radius: Search radius in miles (default: 50)
 * - startDate: Start date (YYYY-MM-DD)
 * - endDate: End date (YYYY-MM-DD)
 * - minHailSize: Minimum hail size in inches
 *
 * Examples:
 * - /api/weather/hail-events?state=VA&zip=22101&radius=50
 * - /api/weather/hail-events?date=2024-10-15&state=VA
 * - /api/weather/hail-events?lat=38.8816&lon=-77.1910&radius=25
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams

    // Parse query parameters
    const params: WeatherQueryParams = {}

    // State filter
    const state = searchParams.get('state')
    if (state) {
      params.state = state.toUpperCase()
      // Validate state
      if (!['VA', 'MD', 'PA'].includes(params.state)) {
        return NextResponse.json(
          { error: 'Invalid state. Must be VA, MD, or PA.' },
          { status: 400 }
        )
      }
    }

    // Zip code filter
    const zip = searchParams.get('zip') || searchParams.get('zipCode')
    if (zip) {
      params.zipCode = zip
    }

    // Location filter (lat/lon with radius)
    const lat = searchParams.get('lat') || searchParams.get('latitude')
    const lon = searchParams.get('lon') || searchParams.get('longitude')
    const radius = searchParams.get('radius')

    if (lat && lon) {
      params.latitude = parseFloat(lat)
      params.longitude = parseFloat(lon)
      params.radius = radius ? parseFloat(radius) : 50 // Default 50 miles
    }

    // Date filters
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const date = searchParams.get('date')

    if (date) {
      // If single date specified, search within 7 days before and after
      const dateObj = new Date(date)
      params.startDate = new Date(dateObj.getTime() - 7 * 24 * 60 * 60 * 1000)
      params.endDate = new Date(dateObj.getTime() + 7 * 24 * 60 * 60 * 1000)
    } else {
      if (startDate) {
        params.startDate = new Date(startDate)
      } else {
        // Default to last 3 years
        params.startDate = new Date()
        params.startDate.setFullYear(params.startDate.getFullYear() - 3)
      }

      if (endDate) {
        params.endDate = new Date(endDate)
      } else {
        params.endDate = new Date()
      }
    }

    // Minimum hail size filter
    const minHailSize = searchParams.get('minHailSize')
    if (minHailSize) {
      params.minHailSize = parseFloat(minHailSize)
    }

    // Query the database
    const events = await queryHailEvents(params)

    return NextResponse.json({
      success: true,
      count: events.length,
      events: events,
      query: {
        state: params.state,
        zipCode: params.zipCode,
        location: params.latitude && params.longitude
          ? { lat: params.latitude, lon: params.longitude, radius: params.radius }
          : null,
        dateRange: {
          start: params.startDate?.toISOString().split('T')[0],
          end: params.endDate?.toISOString().split('T')[0],
        },
        minHailSize: params.minHailSize,
      },
    })
  } catch (error) {
    console.error('Error querying hail events:', error)
    return NextResponse.json(
      {
        error: 'Failed to query hail events',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
