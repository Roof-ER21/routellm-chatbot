import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/railway-db'
import fs from 'fs'
import path from 'path'

/**
 * Run Analytics Database Migration
 * POST /api/admin/run-analytics-migration
 *
 * Executes the analytics schema migration SQL file
 * Creates all new analytics tables, indexes, and views
 */
export async function POST(req: NextRequest) {
  try {
    console.log('[Analytics Migration] Starting migration...')

    // Read migration file
    const migrationPath = path.join(process.cwd(), 'database', 'migrations', 'analytics_schema.sql')

    if (!fs.existsSync(migrationPath)) {
      return NextResponse.json(
        { error: 'Migration file not found', path: migrationPath },
        { status: 404 }
      )
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')
    console.log('[Analytics Migration] Loaded migration file')

    // Split into individual statements
    // This is a basic splitter - handles most cases but not all edge cases
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => {
        // Filter out empty statements and comments
        return s.length > 0 &&
               !s.startsWith('--') &&
               !s.startsWith('/*') &&
               s !== '$$' // Exclude function delimiters
      })

    console.log(`[Analytics Migration] Found ${statements.length} SQL statements to execute`)

    let successCount = 0
    let errorCount = 0
    const errors: Array<{ statement: string; error: string }> = []
    const successes: string[] = []

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]

      // Skip empty statements
      if (!statement || statement.length < 5) continue

      try {
        // Log statement being executed (truncated for readability)
        const preview = statement.substring(0, 100).replace(/\s+/g, ' ')
        console.log(`[Analytics Migration] [${i + 1}/${statements.length}] Executing: ${preview}...`)

        await query(statement)
        successCount++
        successes.push(preview)
      } catch (error: any) {
        // Some errors are expected (e.g., "relation already exists")
        const errorMsg = error.message || 'Unknown error'

        // Check if it's a benign error
        const isBenignError =
          errorMsg.includes('already exists') ||
          errorMsg.includes('does not exist') ||
          errorMsg.includes('duplicate')

        if (isBenignError) {
          console.warn(`[Analytics Migration] Benign error (ignoring): ${errorMsg}`)
          successCount++ // Count as success
        } else {
          errorCount++
          errors.push({
            statement: statement.substring(0, 200),
            error: errorMsg
          })
          console.error(`[Analytics Migration] ERROR: ${errorMsg}`)
        }
      }
    }

    console.log(`[Analytics Migration] Completed: ${successCount} successful, ${errorCount} errors`)

    // Try to refresh materialized views
    try {
      console.log('[Analytics Migration] Refreshing materialized views...')
      await query('SELECT refresh_all_analytics_views()')
      console.log('[Analytics Migration] Materialized views refreshed successfully')
    } catch (viewError: any) {
      console.warn('[Analytics Migration] Could not refresh views (may not exist yet):', viewError.message)
    }

    // Verify tables were created
    try {
      const tableCheck = await query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name IN (
            'analytics_events',
            'email_generation_analytics',
            'template_analytics',
            'argument_analytics',
            'question_analytics',
            'user_feedback',
            'feature_usage_analytics',
            'performance_metrics'
          )
        ORDER BY table_name
      `)

      const createdTables = tableCheck.rows.map(row => row.table_name)
      console.log('[Analytics Migration] Created tables:', createdTables)

      return NextResponse.json({
        success: errorCount === 0,
        message: `Analytics migration completed: ${successCount} successful, ${errorCount} errors`,
        details: {
          successCount,
          errorCount,
          totalStatements: statements.length,
          createdTables,
          errors: errorCount > 0 ? errors : undefined
        }
      })
    } catch (checkError: any) {
      console.error('[Analytics Migration] Error checking tables:', checkError)
      return NextResponse.json({
        success: false,
        message: 'Migration may have partially succeeded, but table verification failed',
        error: checkError.message
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('[Analytics Migration] Fatal error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Migration failed',
        details: error.message,
        stack: error.stack
      },
      { status: 500 }
    )
  }
}

/**
 * Check migration status
 * GET /api/admin/run-analytics-migration
 */
export async function GET(req: NextRequest) {
  try {
    // Check if analytics tables exist
    const tableCheck = await query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN (
          'analytics_events',
          'email_generation_analytics',
          'template_analytics',
          'argument_analytics',
          'question_analytics',
          'user_feedback',
          'feature_usage_analytics',
          'performance_metrics'
        )
      ORDER BY table_name
    `)

    const existingTables = tableCheck.rows.map(row => row.table_name)
    const expectedTables = [
      'analytics_events',
      'email_generation_analytics',
      'template_analytics',
      'argument_analytics',
      'question_analytics',
      'user_feedback',
      'feature_usage_analytics',
      'performance_metrics'
    ]

    const allTablesExist = expectedTables.every(table => existingTables.includes(table))

    // Get row counts if tables exist
    const counts: Record<string, number> = {}
    for (const table of existingTables) {
      try {
        const countResult = await query(`SELECT COUNT(*) as count FROM ${table}`)
        counts[table] = parseInt(countResult.rows[0]?.count || 0)
      } catch (error) {
        counts[table] = -1 // Error counting
      }
    }

    return NextResponse.json({
      success: true,
      migrated: allTablesExist,
      existingTables,
      missingTables: expectedTables.filter(table => !existingTables.includes(table)),
      counts
    })
  } catch (error: any) {
    console.error('[Analytics Migration] Status check error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check migration status',
        details: error.message
      },
      { status: 500 }
    )
  }
}
