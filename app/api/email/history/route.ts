import { NextRequest, NextResponse } from 'next/server'
import { getEmailHistory, getEmailById } from '@/lib/db'

/**
 * GET /api/email/history
 * Get email history
 *
 * Query params:
 * - sessionId?: number (optional, filter by session)
 * - limit?: number (optional, default 50)
 * - emailId?: number (optional, get specific email)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const sessionIdParam = searchParams.get('sessionId')
    const limitParam = searchParams.get('limit')
    const emailIdParam = searchParams.get('emailId')

    // Get specific email by ID
    if (emailIdParam) {
      const emailId = parseInt(emailIdParam, 10)
      if (isNaN(emailId)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid emailId parameter'
          },
          { status: 400 }
        )
      }

      const email = await getEmailById(emailId)
      if (!email) {
        return NextResponse.json(
          {
            success: false,
            error: 'Email not found'
          },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        email
      })
    }

    // Get email history
    const sessionId = sessionIdParam ? parseInt(sessionIdParam, 10) : undefined
    const limit = limitParam ? parseInt(limitParam, 10) : 50

    if (sessionIdParam && isNaN(sessionId as number)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid sessionId parameter'
        },
        { status: 400 }
      )
    }

    if (limitParam && (isNaN(limit) || limit < 1 || limit > 500)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid limit parameter (must be between 1 and 500)'
        },
        { status: 400 }
      )
    }

    const emails = await getEmailHistory(sessionId, limit)

    return NextResponse.json({
      success: true,
      emails,
      count: emails.length,
      sessionId: sessionId || null,
      limit
    })
  } catch (error) {
    console.error('Error in email history API:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
