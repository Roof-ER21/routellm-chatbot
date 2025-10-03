#!/usr/bin/env node

/**
 * NOAA Weather Database Migration Script
 *
 * Runs the database migration to create hail_events tables
 * Usage: node scripts/migrate-noaa-schema.js
 */

const { sql } = require('@vercel/postgres');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('🌩️  Starting NOAA Weather Database Migration...\n');

  try {
    // Check database connection
    console.log('1. Testing database connection...');
    const testResult = await sql`SELECT NOW()`;
    console.log('   ✅ Database connected successfully\n');

    // Read schema file
    console.log('2. Reading schema file...');
    const schemaPath = path.join(__dirname, '../db/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    console.log('   ✅ Schema file loaded\n');

    // Check if tables already exist
    console.log('3. Checking existing tables...');
    const existingTables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('hail_events', 'weather_sync_log')
    `;

    if (existingTables.rows.length > 0) {
      console.log('   ⚠️  Tables already exist:');
      existingTables.rows.forEach(row => {
        console.log(`      - ${row.table_name}`);
      });
      console.log('   ℹ️  Using CREATE TABLE IF NOT EXISTS (safe to proceed)\n');
    } else {
      console.log('   ℹ️  No existing NOAA tables found\n');
    }

    // Run migration
    console.log('4. Running migration...');

    // Split schema into individual statements
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    // Execute NOAA-related statements only
    const noaaStatements = statements.filter(
      s => s.includes('hail_events') || s.includes('weather_sync_log')
    );

    for (const statement of noaaStatements) {
      try {
        await sql.query(statement);
        if (statement.includes('CREATE TABLE')) {
          const tableName = statement.match(/CREATE TABLE.*?(\w+)\s*\(/i)?.[1];
          console.log(`   ✅ Created table: ${tableName}`);
        } else if (statement.includes('CREATE INDEX')) {
          const indexName = statement.match(/CREATE INDEX.*?(\w+)\s+ON/i)?.[1];
          console.log(`   ✅ Created index: ${indexName}`);
        }
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`   ℹ️  Skipped (already exists)`);
        } else {
          throw error;
        }
      }
    }

    console.log('\n5. Verifying tables...');
    const verifyTables = await sql`
      SELECT table_name, pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) as size
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('hail_events', 'weather_sync_log')
    `;

    console.log('   ✅ Tables verified:');
    verifyTables.rows.forEach(row => {
      console.log(`      - ${row.table_name} (${row.size})`);
    });

    // Check indexes
    console.log('\n6. Verifying indexes...');
    const verifyIndexes = await sql`
      SELECT indexname, tablename
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND tablename IN ('hail_events', 'weather_sync_log')
    `;

    console.log(`   ✅ Created ${verifyIndexes.rows.length} indexes`);

    // Count existing events
    console.log('\n7. Checking data...');
    const eventCount = await sql`SELECT COUNT(*) as count FROM hail_events`;
    const syncCount = await sql`SELECT COUNT(*) as count FROM weather_sync_log`;

    console.log(`   ℹ️  Hail events: ${eventCount.rows[0].count}`);
    console.log(`   ℹ️  Sync logs: ${syncCount.rows[0].count}`);

    if (eventCount.rows[0].count === 0) {
      console.log('\n📋 Next Steps:');
      console.log('   Run initial data sync:');
      console.log('   curl -X POST https://your-domain.vercel.app/api/cron/sync-weather-data\n');
    }

    console.log('✅ Migration completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

// Run migration
runMigration().then(() => {
  console.log('🎉 Done!');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
