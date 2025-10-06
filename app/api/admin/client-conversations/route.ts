import { NextRequest, NextResponse } from 'next/server'

/**
 * Admin API endpoint for retrieving client-side conversations
 * This endpoint is meant to be called from the browser's admin panel
 * It returns data that should be read from localStorage on the client side
 */
export async function GET(req: NextRequest) {
  try {
    // This endpoint returns instructions for client-side data access
    // The actual data is in localStorage and must be accessed client-side
    return NextResponse.json({
      success: true,
      message: 'Client-side conversations must be accessed via localStorage',
      storageKey: 'susan21_simple_auth',
      instructions: 'Use the client-side functions: getAllConversations(), getConversationStats()'
    })
  } catch (error) {
    console.error('Error in client conversations endpoint:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
