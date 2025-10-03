import { NextRequest, NextResponse } from 'next/server'
import { verifyHailClaim } from '@/lib/noaa-weather-api'

/**
 * GET /api/weather/verify-claim
 *
 * Verify if a hail event occurred at a specific location and date
 * for insurance claim validation
 *
 * Query Parameters:
 * - date: Claim date (YYYY-MM-DD) - REQUIRED
 * - location: Location string (City, State or zip code) - REQUIRED
 * - radius: Search radius in miles (default: 50)
 *
 * Examples:
 * - /api/weather/verify-claim?date=2024-10-15&location=Richmond,VA
 * - /api/weather/verify-claim?date=2024-10-15&location=22101&radius=25
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams

    // Get required parameters
    const dateStr = searchParams.get('date')
    const location = searchParams.get('location')

    if (!dateStr || !location) {
      return NextResponse.json(
        {
          error: 'Missing required parameters',
          required: {
            date: 'Claim date in YYYY-MM-DD format',
            location: 'Location as "City, State" or zip code',
          },
        },
        { status: 400 }
      )
    }

    // Parse date
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD.' },
        { status: 400 }
      )
    }

    // Parse radius (optional)
    const radius = searchParams.get('radius')
      ? parseFloat(searchParams.get('radius')!)
      : 50

    // Verify the claim
    const result = await verifyHailClaim(date, location, radius)

    // Generate verification report
    const report = {
      verified: result.verified,
      confidence: result.confidence,
      claimDate: dateStr,
      location: location,
      searchRadius: radius,
      eventsFound: result.events.length,
      events: result.events.map(event => ({
        date: event.eventDate.toISOString().split('T')[0],
        time: event.beginTime?.toLocaleTimeString() || 'Unknown',
        location: `${event.city || event.county || 'Unknown'}, ${event.state}`,
        hailSize: event.hailSize ? `${event.hailSize} inches` : 'Unknown',
        magnitude: event.magnitude,
        narrative: event.eventNarrative,
        distance: null, // Could calculate if lat/lon available
      })),
      recommendation: generateRecommendation(result),
    }

    return NextResponse.json({
      success: true,
      report: report,
    })
  } catch (error) {
    console.error('Error verifying claim:', error)
    return NextResponse.json(
      {
        error: 'Failed to verify claim',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Generate recommendation based on verification results
 */
function generateRecommendation(result: {
  verified: boolean
  events: any[]
  confidence: string
}): string {
  if (!result.verified) {
    return 'No hail events found in the NOAA database for the specified location and date range. This does not conclusively prove no hail occurred, as not all weather events are recorded. Consider additional verification methods.'
  }

  if (result.confidence === 'high') {
    return 'High confidence: Multiple hail events recorded on or very close to the claim date. This strongly supports the insurance claim. Document the NOAA event IDs for claim submission.'
  }

  if (result.confidence === 'medium') {
    return 'Medium confidence: Hail events found within the date range but not on the exact claim date. This provides supporting evidence for the claim. Additional documentation (photos, witness statements) recommended.'
  }

  return 'Low confidence: Limited data available. Recommend gathering additional evidence to support the claim.'
}
