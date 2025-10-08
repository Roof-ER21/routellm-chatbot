import { NextRequest, NextResponse } from 'next/server'
import { sendNightlyRecap } from '@/lib/email-notifications'

/**
 * Admin API endpoint to manually trigger nightly recap email
 *
 * Can also be called via cron job or scheduled task
 *
 * Usage:
 * - Manual: Click button in admin panel
 * - Cron: POST to /api/admin/send-recap (add cron-secret header for security)
 */
export async function POST(req: NextRequest) {
  try {
    // Optional: Add cron secret validation for automated calls
    const cronSecret = req.headers.get('cron-secret')
    const expectedSecret = process.env.CRON_SECRET

    // If cron secret is configured, validate it
    if (expectedSecret && cronSecret !== expectedSecret) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: Invalid cron secret'
        },
        { status: 401 }
      )
    }

    console.log('[Send Recap] Triggering nightly recap email...')

    const success = await sendNightlyRecap()

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Nightly recap email sent successfully',
        timestamp: new Date().toISOString()
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to send nightly recap email. Check server logs for details.'
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('[Send Recap] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error.message
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint for testing/verification
 */
export async function GET(req: NextRequest) {
  return NextResponse.json({
    endpoint: '/api/admin/send-recap',
    description: 'Triggers nightly recap email',
    method: 'POST',
    headers: {
      'cron-secret': 'Optional - required if CRON_SECRET env var is set'
    },
    note: 'This endpoint can be called manually or via cron job to send daily recap emails'
  })
}
