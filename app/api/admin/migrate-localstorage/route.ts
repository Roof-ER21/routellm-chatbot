import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/railway-db'

/**
 * Migrate localStorage conversations to PostgreSQL
 * Accepts conversation data from client and saves to database
 */
export async function POST(req: NextRequest) {
  try {
    const { conversations } = await req.json()

    if (!conversations || !Array.isArray(conversations)) {
      return NextResponse.json(
        { error: 'conversations array is required' },
        { status: 400 }
      )
    }

    console.log(`[Migrate] Received ${conversations.length} conversations from localStorage`)

    let migratedSessions = 0
    let migratedMessages = 0
    let errors = 0

    for (const conv of conversations) {
      try {
        const { displayName, messages, date } = conv

        if (!displayName || !messages || !Array.isArray(messages)) {
          console.warn('[Migrate] Skipping invalid conversation:', conv)
          errors++
          continue
        }

        // Get or create rep
        let rep = await query(
          `SELECT id FROM reps WHERE name = $1`,
          [displayName]
        )

        if (rep.rows.length === 0) {
          rep = await query(
            `INSERT INTO reps (name) VALUES ($1) RETURNING id`,
            [displayName]
          )
        }

        const repId = rep.rows[0].id

        // Create session
        const sessionResult = await query(
          `INSERT INTO chat_sessions (rep_id, rep_name, started_at, last_message_at, message_count)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id`,
          [
            repId,
            displayName,
            new Date(date),
            new Date(date),
            messages.length
          ]
        )

        const sessionId = sessionResult.rows[0].id
        migratedSessions++

        // Insert all messages
        for (const msg of messages) {
          await query(
            `INSERT INTO chat_messages (session_id, rep_id, rep_name, role, content, created_at)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              sessionId,
              repId,
              displayName,
              msg.role,
              msg.content,
              new Date(msg.timestamp)
            ]
          )
          migratedMessages++
        }

        console.log(`[Migrate] Migrated session for ${displayName} with ${messages.length} messages`)
      } catch (error: any) {
        console.error('[Migrate] Error migrating conversation:', error)
        errors++
      }
    }

    return NextResponse.json({
      success: true,
      migratedSessions,
      migratedMessages,
      errors,
      message: `Migrated ${migratedSessions} conversations with ${migratedMessages} messages (${errors} errors)`
    })
  } catch (error: any) {
    console.error('[Migrate] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Migration failed',
        details: error.message
      },
      { status: 500 }
    )
  }
}
