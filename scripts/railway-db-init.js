#!/usr/bin/env node

/**
 * Railway Database Initialization Script
 *
 * Initializes all required database tables on Railway deployment
 * Run via: railway run node scripts/railway-db-init.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function init() {
  console.log('\n🚀 Railway Database Initialization\n');
  console.log('===================================\n');

  const client = await pool.connect();

  try {
    // 1. Initialize Insurance Companies Tables
    console.log('📋 Step 1: Initialize Insurance Companies...');
    const insuranceSchema = fs.readFileSync(
      path.join(__dirname, '../db/insurance_companies.sql'),
      'utf-8'
    );
    await client.query(insuranceSchema);
    console.log('✅ Insurance Companies tables created\n');

    // 2. Seed Insurance Companies
    console.log('📋 Step 2: Seed Insurance Companies...');
    const insuranceSeed = fs.readFileSync(
      path.join(__dirname, '../db/seed_insurance_companies.sql'),
      'utf-8'
    );
    await client.query(insuranceSeed);
    const insuranceCount = await client.query('SELECT COUNT(*) FROM insurance_companies');
    console.log(`✅ ${insuranceCount.rows[0].count} insurance companies loaded\n`);

    // 3. Initialize RAG Tables
    console.log('📋 Step 3: Initialize RAG System...');
    const ragSchema = fs.readFileSync(
      path.join(__dirname, '../lib/db-schema-rag.sql'),
      'utf-8'
    );
    await client.query(ragSchema);
    console.log('✅ RAG tables created\n');

    // 4. Run Analytics Migration
    console.log('📋 Step 4: Run Analytics Migration...');
    const analyticsSchema = fs.readFileSync(
      path.join(__dirname, '../database/migrations/analytics_schema.sql'),
      'utf-8'
    );
    await client.query(analyticsSchema);
    console.log('✅ Analytics tables created\n');

    // 5. Verify all tables
    console.log('📋 Step 5: Verifying tables...');
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log(`✅ Found ${tables.rows.length} tables:\n`);
    tables.rows.forEach((row, i) => {
      console.log(`   ${i + 1}. ${row.table_name}`);
    });

    console.log('\n🎉 Database initialization complete!\n');
    console.log('Next steps:');
    console.log('  - Generate RAG embeddings: railway run npm run rag:build');
    console.log('  - Test deployment: https://sa21.up.railway.app\n');

  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('⚠️  Tables already exist, skipping creation');
    } else {
      console.error('❌ Error:', error.message);
      throw error;
    }
  } finally {
    client.release();
    await pool.end();
  }
}

init().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
