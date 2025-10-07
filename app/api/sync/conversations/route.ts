/**
 * GET /api/sync/conversations?userId=xxx
 *
 * Get all conversations for a specific user
 */

import { NextRequest, NextResponse } from 'next/server'
import { getUserConversations, ensureSyncTablesExist } from '@/lib/sync-db'

export async function GET(request: NextRequest) {
  try {
    // Get userId from query params
    const searchParams = request.nextUrl.searchParams
    const userIdParam = searchParams.get('userId')

    // Validate userId
    if (!userIdParam) {
      return NextResponse.json(
        { success: false, error: 'userId query parameter is required' },
        { status: 400 }
      )
    }

    const userId = parseInt(userIdParam, 10)

    if (isNaN(userId)) {
      return NextResponse.json(
        { success: false, error: 'userId must be a valid number' },
        { status: 400 }
      )
    }

    // Ensure tables exist
    await ensureSyncTablesExist()

    // Get conversations
    const conversations = await getUserConversations(userId)

    // Return success with conversations
    return NextResponse.json({
      success: true,
      conversations,
      count: conversations.length
    })

  } catch (error: any) {
    console.error('Error in get conversations endpoint:', error)

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
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })
}
