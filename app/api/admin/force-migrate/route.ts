import { NextResponse } from 'next/server'
import sql from '@/lib/railway-db'

export async function GET() {
  return POST()
}

export async function POST() {
  try {
    const results = []

    // Add last_active to reps
    try {
      await sql`ALTER TABLE reps ADD COLUMN IF NOT EXISTS last_active TIMESTAMP DEFAULT NOW()`
      results.push('✅ Added last_active to reps')
    } catch (e: any) {
      results.push(`⚠️ reps.last_active: ${e.message}`)
    }

    // Add total_chats to reps
    try {
      await sql`ALTER TABLE reps ADD COLUMN IF NOT EXISTS total_chats INTEGER DEFAULT 0`
      results.push('✅ Added total_chats to reps')
    } catch (e: any) {
      results.push(`⚠️ reps.total_chats: ${e.message}`)
    }

    // Add rep_name to chat_sessions
    try {
      await sql`ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS rep_name VARCHAR(255)`
      results.push('✅ Added rep_name to chat_sessions')
    } catch (e: any) {
      results.push(`⚠️ chat_sessions.rep_name: ${e.message}`)
    }

    // Add message_count to chat_sessions
    try {
      await sql`ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS message_count INTEGER DEFAULT 0`
      results.push('✅ Added message_count to chat_sessions')
    } catch (e: any) {
      results.push(`⚠️ chat_sessions.message_count: ${e.message}`)
    }

    // Add last_message_at to chat_sessions
    try {
      await sql`ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP DEFAULT NOW()`
      results.push('✅ Added last_message_at to chat_sessions')
    } catch (e: any) {
      results.push(`⚠️ chat_sessions.last_message_at: ${e.message}`)
    }

    // Verify columns exist
    const tableInfo = await sql`
      SELECT column_name, table_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name IN ('reps', 'chat_sessions')
      ORDER BY table_name, column_name
    `

    return NextResponse.json({
      success: true,
      migrations: results,
      columns: tableInfo.rows,
      message: '🎉 Migration complete! All columns should now exist.'
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      message: '❌ Migration failed'
    }, { status: 500 })
  }
}
