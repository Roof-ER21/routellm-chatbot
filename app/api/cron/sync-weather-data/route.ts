import { NextRequest, NextResponse } from 'next/server'
import { syncNOAAData } from '@/lib/noaa-weather-api'

/**
 * GET /api/cron/sync-weather-data
 *
 * Daily cron job to sync NOAA weather data for VA, MD, PA
 * Should be triggered by Vercel Cron or similar scheduling service
 *
 * Query Parameters:
 * - states: Comma-separated list of states (default: VA,MD,PA)
 * - days: Number of days to sync backwards (default: 30)
 *
 * Vercel cron configuration (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/sync-weather-data",
 *     "schedule": "0 2 * * *"
 *   }]
 * }
 */
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret (optional but recommended for security)
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = req.nextUrl.searchParams

    // Get states to sync (default: VA, MD, PA)
    const statesParam = searchParams.get('states') || 'VA,MD,PA'
    const states = statesParam.split(',').map(s => s.trim().toUpperCase())

    // Get number of days to sync backwards (default: 30)
    const daysParam = searchParams.get('days')
    const days = daysParam ? parseInt(daysParam) : 30

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    console.log(`Starting NOAA data sync for ${states.join(', ')} from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`)

    // Sync each state
    const results = []
    for (const state of states) {
      console.log(`Syncing ${state}...`)

      const result = await syncNOAAData(state, startDate, endDate)

      results.push({
        state,
        ...result,
      })

      // Rate limit: wait 2 seconds between states to avoid NOAA API throttling
      if (states.indexOf(state) < states.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    // Calculate totals
    const totalAdded = results.reduce((sum, r) => sum + r.added, 0)
    const totalUpdated = results.reduce((sum, r) => sum + r.updated, 0)
    const allSuccess = results.every(r => r.success)

    console.log(`Sync complete: ${totalAdded} added, ${totalUpdated} updated`)

    return NextResponse.json({
      success: allSuccess,
      timestamp: new Date().toISOString(),
      dateRange: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
      },
      results: results,
      totals: {
        added: totalAdded,
        updated: totalUpdated,
      },
    })
  } catch (error) {
    console.error('Error in sync-weather-data cron:', error)
    return NextResponse.json(
      {
        error: 'Sync failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/cron/sync-weather-data
 *
 * Manual trigger for weather data sync (for testing)
 */
export async function POST(req: NextRequest) {
  // Re-use GET handler
  return GET(req)
}
