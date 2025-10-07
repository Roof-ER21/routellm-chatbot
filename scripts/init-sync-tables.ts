/**
 * Initialize Conversation Sync Database Tables
 *
 * Run this script to create all required tables for the sync system
 * Usage: tsx scripts/init-sync-tables.ts
 */

import { ensureSyncTablesExist } from '../lib/sync-db'
import { pool } from '../lib/railway-db'

async function main() {
  console.log('Initializing conversation sync tables...\n')

  try {
    // Create tables
    await ensureSyncTablesExist()

    // Verify tables were created
    const client = await pool.connect()

    try {
      const result = await client.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name LIKE 'sync_%'
        ORDER BY table_name
      `)

      console.log('✓ Tables created successfully:\n')
      result.rows.forEach(row => {
        console.log(`  - ${row.table_name}`)
      })

      // Check indexes
      const indexResult = await client.query(`
        SELECT
          tablename,
          indexname
        FROM pg_indexes
        WHERE tablename LIKE 'sync_%'
        ORDER BY tablename, indexname
      `)

      console.log('\n✓ Indexes created:\n')
      indexResult.rows.forEach(row => {
        console.log(`  - ${row.tablename}.${row.indexname}`)
      })

      // Get row counts
      const tables = ['sync_users', 'sync_conversations', 'sync_messages', 'sync_alerts']
      console.log('\nCurrent row counts:\n')

      for (const table of tables) {
        const countResult = await client.query(`SELECT COUNT(*) FROM ${table}`)
        console.log(`  - ${table}: ${countResult.rows[0].count} rows`)
      }

      console.log('\n✓ Database initialization complete!\n')
    } finally {
      client.release()
    }

  } catch (error) {
    console.error('Error initializing database:', error)
    process.exit(1)
  }

  // Close pool
  await pool.end()
}

main()
