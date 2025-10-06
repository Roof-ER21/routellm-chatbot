import { NextRequest, NextResponse } from 'next/server'
import { getOrCreateRep, createChatSession, ensureTablesExist } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    // Skip database for now - use in-memory session
    const { repName } = await req.json()

    if (!repName || typeof repName !== 'string') {
      return NextResponse.json(
        { error: 'Rep name is required' },
        { status: 400 }
      )
    }

    // Return mock session for now (database optional)
    return NextResponse.json({
      success: true,
      repId: Date.now(),
      sessionId: Date.now() + 1
    })
  } catch (error) {
    console.error('Session creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    )
  }
}
