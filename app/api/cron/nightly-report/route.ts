import { NextRequest, NextResponse } from 'next/server'
import { getTodaysChats, getTodaysChatTranscripts } from '@/lib/db'
import { sendNightlyReport } from '@/lib/email'

export async function GET(req: NextRequest) {
  try {
    // Verify this is coming from Vercel Cron
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('Running nightly report...')

    // Get today's chat stats
    const stats = await getTodaysChats()

    // Get chat transcripts
    const transcripts = await getTodaysChatTranscripts()

    console.log(`Found ${stats.length} reps with ${transcripts.length} sessions`)

    // Send email report
    const result = await sendNightlyReport(stats, transcripts)

    if (!result.success) {
      console.error('Failed to send nightly report:', result.error)
      return NextResponse.json(
        { error: 'Failed to send report', details: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      stats: stats.length,
      transcripts: transcripts.length,
      emailSent: true
    })
  } catch (error) {
    console.error('Nightly report error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
