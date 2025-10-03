#!/usr/bin/env node

/**
 * Setup Insurance Companies Database
 *
 * This script creates the insurance companies tables and seeds the database
 * with 50+ insurance companies for the Susan AI-21 roofing assistant.
 *
 * Usage:
 *   node scripts/setup-insurance-db.js
 */

const fs = require('fs');
const path = require('path');

async function setupInsuranceDatabase() {
  console.log('🏢 Setting up Insurance Companies Database...\n');

  try {
    // Import Vercel Postgres
    const { sql } = require('@vercel/postgres');

    // Read schema file
    const schemaPath = path.join(__dirname, '../db/insurance_companies.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf-8');
    console.log('📄 Reading schema from:', schemaPath);

    // Read seed file
    const seedPath = path.join(__dirname, '../db/seed_insurance_companies.sql');
    const seedSQL = fs.readFileSync(seedPath, 'utf-8');
    console.log('📄 Reading seed data from:', seedPath);

    // Execute schema (split by semicolons and filter empty statements)
    console.log('\n📊 Creating tables and indexes...');
    const schemaStatements = schemaSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of schemaStatements) {
      if (statement.trim()) {
        await sql.query(statement);
      }
    }
    console.log('✅ Tables created successfully');

    // Execute seed data
    console.log('\n🌱 Seeding insurance companies...');
    const seedStatements = seedSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of seedStatements) {
      if (statement.trim()) {
        await sql.query(statement);
      }
    }
    console.log('✅ Insurance companies seeded successfully');

    // Get count of companies
    const result = await sql`SELECT COUNT(*) as count FROM insurance_companies`;
    const count = result.rows[0].count;

    console.log('\n🎉 Database setup complete!');
    console.log(`📊 Total insurance companies: ${count}`);
    console.log('\n✨ You can now use the Insurance Company Selector in Susan AI-21');

  } catch (error) {
    console.error('\n❌ Error setting up database:', error);
    console.error('\nError details:', error.message);

    if (error.message.includes('relation') && error.message.includes('does not exist')) {
      console.log('\n💡 Tip: Make sure the base schema is set up first.');
      console.log('   Run: node scripts/setup-database.js');
    }

    process.exit(1);
  }
}

// Run the setup
setupInsuranceDatabase();
