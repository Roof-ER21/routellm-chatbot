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

    // Create threat_alerts table
    await query(`
      CREATE TABLE IF NOT EXISTS threat_alerts (
        id SERIAL PRIMARY KEY,
        session_id INTEGER REFERENCES chat_sessions(id),
        message_id INTEGER REFERENCES chat_messages(id),
        rep_name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        pattern VARCHAR(500) NOT NULL,
        severity VARCHAR(20) NOT NULL,
        risk_score INTEGER NOT NULL,
        matched_text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)
    console.log('[Admin] Created threat_alerts table')

    // Create indexes for performance
    await query(`CREATE INDEX IF NOT EXISTS idx_threat_alerts_session ON threat_alerts(session_id)`)
    await query(`CREATE INDEX IF NOT EXISTS idx_threat_alerts_severity ON threat_alerts(severity)`)
    await query(`CREATE INDEX IF NOT EXISTS idx_threat_alerts_rep ON threat_alerts(rep_name)`)
    await query(`CREATE INDEX IF NOT EXISTS idx_threat_alerts_created ON threat_alerts(created_at)`)
    console.log('[Admin] Created threat_alerts indexes')

    // Test query to check if tables are accessible
    const testResult = await query(`
      SELECT COUNT(*) as count FROM chat_messages
    `)
    const alertsResult = await query(`
      SELECT COUNT(*) as count FROM threat_alerts
    `)
    console.log(`[Admin] Found ${testResult.rows[0].count} messages and ${alertsResult.rows[0].count} alerts in database`)

    return NextResponse.json({
      success: true,
      message: 'Database tables initialized successfully',
      messageCount: testResult.rows[0].count,
      alertCount: alertsResult.rows[0].count
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
        (SELECT COUNT(*) FROM reps) as reps,
        (SELECT COUNT(*) FROM threat_alerts) as alerts
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
