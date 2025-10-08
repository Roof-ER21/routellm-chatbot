import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/railway-db'

/**
 * Initialize Database Tables
 * Creates all required tables if they don't exist
 */
export async function POST(req: NextRequest) {
  try {
    console.log('[Admin] Initializing database tables...')

    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        {
          success: false,
          error: 'DATABASE_URL environment variable is not set'
        },
        { status: 500 }
      )
    }

    console.log('[Admin] DATABASE_URL is set')

    // Create reps table
    await query(`
      CREATE TABLE IF NOT EXISTS reps (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('[Admin] Created reps table')

    // Create chat_sessions table
    await query(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id SERIAL PRIMARY KEY,
        rep_id INTEGER REFERENCES reps(id),
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('[Admin] Created chat_sessions table')

    // Create chat_messages table
    await query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        session_id INTEGER REFERENCES chat_sessions(id),
        rep_id INTEGER REFERENCES reps(id),
        rep_name VARCHAR(255),
        role VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('[Admin] Created chat_messages table')

    // Test query to check if tables are accessible
    const testResult = await query(`
      SELECT COUNT(*) as count FROM chat_messages
    `)
    console.log(`[Admin] Found ${testResult.rows[0].count} messages in database`)

    return NextResponse.json({
      success: true,
      message: 'Database tables initialized successfully',
      messageCount: testResult.rows[0].count
    })
  } catch (error: any) {
    console.error('[Admin] Error initializing database:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to initialize database',
        details: error.message,
        stack: error.stack
      },
      { status: 500 }
    )
  }
}

/**
 * Check Database Status
 */
export async function GET(req: NextRequest) {
  try {
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        success: false,
        error: 'DATABASE_URL environment variable is not set',
        hasUrl: false
      })
    }

    // Try to query the database
    const result = await query(`
      SELECT
        (SELECT COUNT(*) FROM chat_messages) as messages,
        (SELECT COUNT(*) FROM chat_sessions) as sessions,
        (SELECT COUNT(*) FROM reps) as reps
    `)

    return NextResponse.json({
      success: true,
      hasUrl: true,
      connected: true,
      stats: result.rows[0]
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      hasUrl: !!process.env.DATABASE_URL,
      connected: false,
      error: error.message
    })
  }
}
