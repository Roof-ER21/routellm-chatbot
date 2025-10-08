import { NextRequest, NextResponse } from 'next/server'
import { getOrCreateRep, createChatSession, ensureTablesExist } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { repName } = await req.json()

    if (!repName || typeof repName !== 'string') {
      return NextResponse.json(
        { error: 'Rep name is required' },
        { status: 400 }
      )
    }

    // Ensure tables exist
    await ensureTablesExist()

    // Create or get rep from Railway PostgreSQL database
    const rep = await getOrCreateRep(repName)

    // Create a new chat session in Railway PostgreSQL database
    const session = await createChatSession(rep.id, repName)

    console.log(`[Session] Created for ${repName}: repId=${rep.id}, sessionId=${session.id}`)

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
