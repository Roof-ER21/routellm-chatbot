/**
 * GET /api/admin/all-conversations
 *
 * Admin only: Get ALL conversations from ALL users
 * Optional filters: ?flagged=true, ?severity=critical
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAllConversations, ensureSyncTablesExist, getFullConversation } from '@/lib/sync-db'

const ADMIN_PASSCODE = '2110'

/**
 * Verify admin access
 */
function verifyAdmin(request: NextRequest): boolean {
  // Check header
  const headerPasscode = request.headers.get('x-admin-passcode')
  if (headerPasscode === ADMIN_PASSCODE) {
    return true
  }

  // Check query param
  const searchParams = request.nextUrl.searchParams
  const queryPasscode = searchParams.get('passcode')
  if (queryPasscode === ADMIN_PASSCODE) {
    return true
  }

  return false
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    if (!verifyAdmin(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Admin passcode required.' },
        { status: 401 }
      )
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const flaggedParam = searchParams.get('flagged')
    const severityParam = searchParams.get('severity')
    const conversationIdParam = searchParams.get('conversationId')

    // Ensure tables exist
    await ensureSyncTablesExist()

    // If specific conversation requested, return full details
    if (conversationIdParam) {
      const conversation = await getFullConversation(conversationIdParam)

      if (!conversation) {
        return NextResponse.json(
          { success: false, error: 'Conversation not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        conversation
      })
    }

    // Build filters
    const filters: any = {}

    if (flaggedParam === 'true') {
      filters.flagged = true
    }

    if (severityParam) {
      filters.severity = severityParam
    }

    // Get all conversations
    const conversations = await getAllConversations(filters)

    // Calculate summary stats
    const stats = {
      totalConversations: conversations.length,
      totalMessages: conversations.reduce((sum, c) => sum + (parseInt(c.message_count) || 0), 0),
      totalAlerts: conversations.reduce((sum, c) => sum + (parseInt(c.alert_count) || 0), 0),
      flaggedConversations: conversations.filter(c => (parseInt(c.flagged_alert_count) || 0) > 0).length,
      criticalAlertConversations: conversations.filter(c => (parseInt(c.critical_alert_count) || 0) > 0).length
    }

    // Return success with conversations and stats
    return NextResponse.json({
      success: true,
      conversations,
      stats,
      count: conversations.length
    })

  } catch (error: any) {
    console.error('Error in admin all-conversations endpoint:', error)

    // Handle database connection errors gracefully
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return NextResponse.json(
        { success: false, error: 'Database temporarily unavailable. Please try again later.' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error. Please try again.' },
      { status: 500 }
    )
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-admin-passcode'
    }
  })
}
