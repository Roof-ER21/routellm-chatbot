/**
 * GET /api/admin/sync-stats
 *
 * Admin only: Get system-wide statistics for conversation sync
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSystemStats, ensureSyncTablesExist } from '@/lib/sync-db'

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

    // Ensure tables exist
    await ensureSyncTablesExist()

    // Get system stats
    const stats = await getSystemStats()

    // Format stats for response
    const response = {
      success: true,
      stats: {
        totalUsers: parseInt(stats.total_users) || 0,
        totalConversations: parseInt(stats.total_conversations) || 0,
        totalMessages: parseInt(stats.total_messages) || 0,
        totalAlerts: parseInt(stats.total_alerts) || 0,
        criticalAlerts: parseInt(stats.critical_alerts) || 0,
        highAlerts: parseInt(stats.high_alerts) || 0,
        flaggedAlerts: parseInt(stats.flagged_alerts) || 0
      },
      userStats: stats.user_stats.map((user: any) => ({
        userId: user.id,
        name: user.name,
        displayName: user.display_name,
        lastActive: user.last_active,
        conversationCount: parseInt(user.conversation_count) || 0,
        messageCount: parseInt(user.message_count) || 0,
        alertCount: parseInt(user.alert_count) || 0,
        criticalAlertCount: parseInt(user.critical_alert_count) || 0
      }))
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('Error in admin sync-stats endpoint:', error)

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
