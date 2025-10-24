import { NextRequest, NextResponse } from 'next/server'
import { trackEvent } from '@/lib/analytics'

/**
 * Generic event tracking endpoint
 * POST /api/analytics/track
 *
 * Body: {
 *   eventType: string
 *   eventCategory: string
 *   eventSubcategory?: string
 *   repName: string
 *   sessionId?: number
 *   repId?: number
 *   eventData?: Record<string, any>
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const {
      eventType,
      eventCategory,
      eventSubcategory,
      repName,
      sessionId,
      repId,
      eventData
    } = body

    // Validation
    if (!eventType || !eventCategory || !repName) {
      return NextResponse.json(
        { error: 'Missing required fields: eventType, eventCategory, repName' },
        { status: 400 }
      )
    }

    // Track the event
    const eventId = await trackEvent({
      eventType,
      eventCategory,
      eventSubcategory,
      repName,
      sessionId,
      repId,
      eventData
    })

    return NextResponse.json({
      success: true,
      eventId
    })
  } catch (error: any) {
    console.error('[Analytics API] Error tracking event:', error)
    return NextResponse.json(
      { error: 'Failed to track event', details: error.message },
      { status: 500 }
    )
  }
}
