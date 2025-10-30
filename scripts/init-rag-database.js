#!/usr/bin/env node

/**
 * RAG Database Initialization Script
 *
 * Initializes PostgreSQL database with pgvector extension and RAG schema
 * Runs in Railway environment with access to DATABASE_URL
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
  console.log('🚀 RAG Database Initialization');
  console.log('===============================\n');

  // Get DATABASE_URL from environment
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable not set');
    console.error('   This script must run in Railway environment');
    console.error('   Use: railway run node scripts/init-rag-database.js');
    process.exit(1);
  }

  console.log('✓ DATABASE_URL found');
  console.log('✓ Connecting to PostgreSQL...\n');

  const client = new Client({
    connectionString: databaseUrl,
  });

  try {
    // Connect to database
    await client.connect();
    console.log('✓ Connected to PostgreSQL\n');

    // Read schema file
    const schemaPath = path.join(__dirname, '..', 'lib', 'db-schema-rag.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    console.log('📄 Executing schema...');
    console.log('   - Creating pgvector extension');
    console.log('   - Creating rag_documents table');
    console.log('   - Creating rag_chunks table');
    console.log('   - Creating rag_query_cache table');
    console.log('   - Creating rag_analytics table');
    console.log('   - Creating indexes and functions\n');

    // Execute schema
    await client.query(schema);

    console.log('✅ Schema executed successfully\n');

    // Verify pgvector extension
    const extResult = await client.query(
      "SELECT extname, extversion FROM pg_extension WHERE extname = 'vector'"
    );

    if (extResult.rows.length > 0) {
      console.log('✓ pgvector extension verified:');
      console.log(`  Version: ${extResult.rows[0].extversion}`);
    } else {
      console.warn('⚠️  pgvector extension not found');
      console.warn('   Make sure your PostgreSQL version supports pgvector');
    }

    // Verify tables created
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name LIKE 'rag_%'
      ORDER BY table_name
    `);

    console.log('\n✓ Tables created:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    // Get table counts
    console.log('\n📊 Current data:');

    const docCount = await client.query('SELECT COUNT(*) FROM rag_documents');
    console.log(`  Documents: ${docCount.rows[0].count}`);

    const chunkCount = await client.query('SELECT COUNT(*) FROM rag_chunks');
    console.log(`  Chunks: ${chunkCount.rows[0].count}`);

    const cacheCount = await client.query('SELECT COUNT(*) FROM rag_query_cache');
    console.log(`  Cached queries: ${cacheCount.rows[0].count}`);

    console.log('\n═══════════════════════════════════════');
    console.log('✨ DATABASE INITIALIZATION COMPLETE!');
    console.log('═══════════════════════════════════════\n');

    console.log('🔜 Next steps:');
    console.log('   1. ✅ Database initialized with RAG schema');
    console.log('   2. 🔄 Run: npm run rag:build');
    console.log('      (Generate embeddings for 123 KB documents)');
    console.log('   3. 🧪 Test RAG retrieval system');
    console.log('   4. 🔗 Integrate with chat API\n');

  } catch (error) {
    console.error('\n❌ Error initializing database:');
    console.error(error.message);

    if (error.message.includes('vector')) {
      console.error('\n💡 Tip: pgvector extension may need to be enabled manually');
      console.error('   Contact Railway support or enable in database settings');
    }

    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run initialization
initializeDatabase();
