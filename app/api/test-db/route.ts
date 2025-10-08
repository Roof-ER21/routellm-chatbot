import { NextResponse } from 'next/server'
import sql from '@/lib/railway-db'

export async function GET() {
  try {
    // Test 1: Basic connection
    const timeResult = await sql`SELECT NOW() as current_time`

    // Test 2: Check if tables exist
    const tablesResult = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('reps', 'chat_sessions', 'chat_messages')
      ORDER BY table_name
    `

    // Test 3: Count records
    const repsCount = await sql`SELECT COUNT(*) as count FROM reps`
    const sessionsCount = await sql`SELECT COUNT(*) as count FROM chat_sessions`
    const messagesCount = await sql`SELECT COUNT(*) as count FROM chat_messages`

    // Test 4: Get recent activity
    const recentSessions = await sql`
      SELECT id, rep_name, started_at, message_count
      FROM chat_sessions
      ORDER BY started_at DESC
      LIMIT 5
    `

    return NextResponse.json({
      success: true,
      timestamp: timeResult.rows[0].current_time,
      tables: tablesResult.rows.map(r => r.table_name),
      counts: {
        reps: parseInt(repsCount.rows[0].count),
        sessions: parseInt(sessionsCount.rows[0].count),
        messages: parseInt(messagesCount.rows[0].count)
      },
      recentSessions: recentSessions.rows,
      message: '✅ Database connection working! All tests passed.'
    })
  } catch (error: any) {
    console.error('Database test failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint,
      message: '❌ Database connection failed. Check Railway DATABASE_URL environment variable.'
    }, { status: 500 })
  }
}
