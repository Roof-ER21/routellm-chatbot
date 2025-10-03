/**
 * Database Migration Runner
 * Runs SQL migration files against Railway PostgreSQL database
 */

import { readFileSync } from 'fs';
import { pool } from '../lib/railway-db';
import path from 'path';

async function runMigration(filePath: string) {
  console.log(`\n📋 Running migration: ${path.basename(filePath)}`);

  try {
    const sql = readFileSync(filePath, 'utf-8');
    const client = await pool.connect();

    try {
      // Run migration in a transaction
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');

      console.log(`✅ Migration completed successfully: ${path.basename(filePath)}`);
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`❌ Migration failed: ${path.basename(filePath)}`);
      console.error(error);
      return false;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`❌ Error reading migration file: ${filePath}`);
    console.error(error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting database migrations...\n');

  const migrationsDir = path.join(process.cwd(), 'db', 'migrations');

  // Run migrations in order
  const migrations = [
    path.join(migrationsDir, '001_add_digital_and_intelligence_fields.sql'),
    path.join(migrationsDir, '002_populate_intelligence_data.sql'),
  ];

  let successCount = 0;
  let failCount = 0;

  for (const migration of migrations) {
    const success = await runMigration(migration);
    if (success) {
      successCount++;
    } else {
      failCount++;
      console.log('\n⚠️  Migration failed. Stopping migration process.');
      break;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Migration Summary:');
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log('='.repeat(50) + '\n');

  // Close pool
  await pool.end();

  process.exit(failCount > 0 ? 1 : 0);
}

main();
