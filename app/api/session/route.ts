import { NextRequest, NextResponse } from 'next/server'
import { getOrCreateRep, createChatSession, ensureTablesExist } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    await ensureTablesExist()

    const { repName } = await req.json()

    if (!repName || typeof repName !== 'string') {
      return NextResponse.json(
        { error: 'Rep name is required' },
        { status: 400 }
      )
    }

    // Get or create rep
    const rep = await getOrCreateRep(repName)

    // Create new chat session
    const session = await createChatSession(rep.id, repName)

    return NextResponse.json({
      success: true,
      repId: rep.id,
      sessionId: session.id
    })
  } catch (error) {
    console.error('Session creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    )
  }
}
