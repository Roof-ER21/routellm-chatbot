import { NextRequest, NextResponse } from 'next/server'
import { getTodaysChatTranscripts } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const transcripts = await getTodaysChatTranscripts()

    return NextResponse.json({
      success: true,
      transcripts
    })
  } catch (error) {
    console.error('Error fetching chat transcripts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chat transcripts' },
      { status: 500 }
    )
  }
}
