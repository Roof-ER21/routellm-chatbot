#!/usr/bin/env node

/**
 * Smart RAG Initialization Script
 *
 * Checks if embeddings exist in the database before running generation.
 * Runs on Railway startup to ensure RAG system is ready.
 */

const { Client } = require('pg');
const { execSync } = require('child_process');

const DATABASE_URL = process.env.DATABASE_URL;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function checkEmbeddingsExist() {
  if (!DATABASE_URL) {
    console.log('❌ DATABASE_URL not set. Cannot check embeddings.');
    return false;
  }

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();

    // Check if tables exist
    const tableCheck = await client.query(`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_name IN ('rag_documents', 'rag_chunks')
    `);

    if (parseInt(tableCheck.rows[0].count) < 2) {
      console.log('⚠️  RAG tables do not exist. Need to initialize database.');
      await client.end();
      return false;
    }

    // Check document count
    const docCount = await client.query('SELECT COUNT(*) as count FROM rag_documents');
    const chunkCount = await client.query('SELECT COUNT(*) as count FROM rag_chunks');

    const docs = parseInt(docCount.rows[0].count);
    const chunks = parseInt(chunkCount.rows[0].count);

    console.log(`📊 Current RAG status: ${docs} documents, ${chunks} chunks`);

    await client.end();

    // Consider embeddings ready if we have at least 100 documents
    // (262 JSON files exist, so we should have close to that)
    return docs >= 100;

  } catch (error) {
    console.error('❌ Error checking embeddings:', error.message);
    try { await client.end(); } catch {}
    return false;
  }
}

async function main() {
  console.log('=== Smart RAG Initialization ===\n');

  if (!OPENAI_API_KEY) {
    console.log('⚠️  OPENAI_API_KEY not set. Cannot generate embeddings.');
    console.log('   Set OPENAI_API_KEY in Railway environment variables.\n');
    process.exit(0);
  }

  const embeddingsExist = await checkEmbeddingsExist();

  if (embeddingsExist) {
    console.log('✅ Embeddings already exist. Skipping generation.\n');
    process.exit(0);
  }

  console.log('🚀 Embeddings not found or incomplete. Starting generation...\n');

  try {
    // Run the embedding generation script
    execSync('node scripts/generate-embeddings-v2.js', {
      stdio: 'inherit',
      env: process.env,
    });

    console.log('\n✅ Embedding generation completed successfully!\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Embedding generation failed:', error.message);
    console.error('   The application will start anyway, but RAG features may not work.\n');
    process.exit(0); // Don't fail the deployment
  }
}

main();
