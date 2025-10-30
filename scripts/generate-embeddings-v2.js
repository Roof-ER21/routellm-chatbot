#!/usr/bin/env node

/**
 * Generate Embeddings for RAG System - Version 2
 *
 * Works with TypeScript files directly using tsx or by building first
 * Simpler, more reliable approach
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// ============================================================================
// CONFIGURATION
// ============================================================================

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;
const CHUNK_SIZE = 500; // tokens
const CHUNK_OVERLAP = 50;
const BATCH_SIZE = 100;
const RATE_LIMIT_DELAY = 1000;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function chunkText(text, chunkSize = 500, overlap = 50) {
  const chunks = [];
  const chunkChars = chunkSize * 4;
  const overlapChars = overlap * 4;

  let start = 0;
  let chunkIndex = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkChars, text.length);
    const chunk = text.substring(start, end);

    chunks.push({
      text: chunk,
      tokens: Math.ceil(chunk.length / 4),
      chunk_index: chunkIndex,
      position_start: start,
      position_end: end,
    });

    start = end - overlapChars;
    chunkIndex++;
  }

  chunks.forEach(chunk => {
    chunk.total_chunks = chunks.length;
  });

  return chunks;
}

async function generateEmbedding(text) {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: text,
      dimensions: EMBEDDING_DIMENSIONS,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

async function generateEmbeddingsBatch(texts) {
  const embeddings = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    console.log(`  Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(texts.length / BATCH_SIZE)} (${batch.length} chunks)`);

    const batchEmbeddings = await Promise.all(
      batch.map(text => generateEmbedding(text))
    );

    embeddings.push(...batchEmbeddings);

    if (i + BATCH_SIZE < texts.length) {
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
    }
  }

  return embeddings;
}

// ============================================================================
// LOAD DOCUMENTS FROM KB
// ============================================================================

async function loadDocumentsFromKB() {
  console.log('📚 Loading documents from knowledge base...\n');

  // Try to build the project if not already built
  const jsPath = path.join(__dirname, '..', 'lib', 'insurance-argumentation-kb.js');

  if (!fs.existsSync(jsPath)) {
    console.log('   TypeScript file needs compilation...');
    console.log('   Running: npm run kb:build\n');

    try {
      const { stdout, stderr } = await execAsync('npm run kb:build');
      if (stdout) console.log(stdout);
      if (stderr && !stderr.includes('npm WARN')) console.error(stderr);
      console.log('   ✓ Build complete\n');
    } catch (error) {
      console.error('   ⚠️  Build failed, trying direct import...\n');
    }
  }

  // Try to load the compiled version
  try {
    const KB = require('../lib/insurance-argumentation-kb');
    const documents = KB.INSURANCE_KB_DOCUMENTS || KB.default?.INSURANCE_KB_DOCUMENTS;

    if (!documents || !Array.isArray(documents)) {
      throw new Error('INSURANCE_KB_DOCUMENTS not found or not an array');
    }

    console.log(`✓ Loaded ${documents.length} documents from knowledge base\n`);
    return documents;

  } catch (error) {
    console.error('❌ Could not load knowledge base');
    console.error('   Error:', error.message);
    console.error('\n💡 Please ensure the knowledge base file exists and is properly formatted');
    console.error('   File: lib/insurance-argumentation-kb.ts');
    process.exit(1);
  }
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

async function generateEmbeddings() {
  console.log('🚀 RAG Embedding Generation - V2');
  console.log('==================================\n');

  // Validate environment
  if (!OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY environment variable not set');
    process.exit(1);
  }

  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable not set');
    console.error('   This script must run in Railway environment');
    console.error('   Use: railway run npm run rag:build');
    process.exit(1);
  }

  console.log('✓ OPENAI_API_KEY configured');
  console.log('✓ DATABASE_URL configured');
  console.log(`✓ Embedding model: ${EMBEDDING_MODEL}`);
  console.log(`✓ Chunk size: ${CHUNK_SIZE} tokens`);
  console.log(`✓ Chunk overlap: ${CHUNK_OVERLAP} tokens\n`);

  // Load documents
  const documents = await loadDocumentsFromKB();

  // Connect to database
  console.log('🔌 Connecting to PostgreSQL...');
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  console.log('✓ Connected\n');

  try {
    let totalChunks = 0;
    let totalTokens = 0;

    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      const docNum = i + 1;

      console.log(`[${docNum}/${documents.length}] ${doc.filename || doc.id}`);
      console.log(`  Category: ${doc.category}`);
      console.log(`  Title: ${doc.title}`);

      // Combine document content
      const fullContent = `${doc.title}\n\n${doc.summary || ''}\n\n${doc.content || ''}`;

      // Calculate hash
      const crypto = require('crypto');
      const hash = crypto.createHash('sha256').update(fullContent).digest('hex');

      // Check if document exists
      const existingDoc = await client.query(
        'SELECT id, hash FROM rag_documents WHERE id = $1',
        [doc.id]
      );

      if (existingDoc.rows.length > 0 && existingDoc.rows[0].hash === hash) {
        console.log('  ⏭️  Already processed - skipping\n');
        continue;
      }

      // Insert/update document
      await client.query(`
        INSERT INTO rag_documents (id, filename, filepath, type, content, summary, metadata, hash)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          content = EXCLUDED.content,
          summary = EXCLUDED.summary,
          metadata = EXCLUDED.metadata,
          hash = EXCLUDED.hash,
          version = rag_documents.version + 1,
          updated_at = NOW()
      `, [
        doc.id,
        doc.filename || doc.id,
        doc.filename || doc.id,
        'docx',
        fullContent,
        doc.summary || '',
        JSON.stringify({
          category: doc.category,
          scenarios: doc.scenarios || [],
          states: doc.applicableStates || [],
          tags: doc.tags || [],
        }),
        hash,
      ]);

      // Chunk the document
      const chunks = chunkText(fullContent, CHUNK_SIZE, CHUNK_OVERLAP);
      console.log(`  Chunks: ${chunks.length}`);

      totalChunks += chunks.length;
      totalTokens += chunks.reduce((sum, c) => sum + c.tokens, 0);

      // Generate embeddings
      console.log(`  Generating embeddings...`);
      const chunkTexts = chunks.map(c => c.text);
      const embeddings = await generateEmbeddingsBatch(chunkTexts);

      // Insert chunks
      console.log(`  Storing in database...`);

      for (let j = 0; j < chunks.length; j++) {
        const chunk = chunks[j];
        const embedding = embeddings[j];
        const chunkId = `${doc.id}_chunk_${j}`;

        await client.query(`
          INSERT INTO rag_chunks (
            id, document_id, text, tokens, chunk_index, total_chunks,
            position_start, position_end, embedding
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (id) DO UPDATE SET
            text = EXCLUDED.text,
            tokens = EXCLUDED.tokens,
            embedding = EXCLUDED.embedding,
            updated_at = NOW()
        `, [
          chunkId,
          doc.id,
          chunk.text,
          chunk.tokens,
          chunk.chunk_index,
          chunk.total_chunks,
          chunk.position_start,
          chunk.position_end,
          `[${embedding.join(',')}]`,
        ]);
      }

      console.log('  ✅ Complete\n');

      if (docNum % 10 === 0) {
        console.log(`📊 Progress: ${((docNum / documents.length) * 100).toFixed(1)}% (${docNum}/${documents.length})\n`);
      }
    }

    // Create HNSW index
    console.log('🔍 Creating HNSW index for vector search...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_chunks_embedding_hnsw
      ON rag_chunks USING hnsw (embedding vector_cosine_ops)
      WITH (m = 16, ef_construction = 64)
    `);
    console.log('✓ HNSW index created\n');

    // Statistics
    const docCount = await client.query('SELECT COUNT(*) FROM rag_documents');
    const chunkCount = await client.query('SELECT COUNT(*) FROM rag_chunks');

    console.log('═══════════════════════════════════════');
    console.log('✨ EMBEDDING GENERATION COMPLETE!');
    console.log('═══════════════════════════════════════\n');

    console.log('📊 Statistics:');
    console.log(`   Documents: ${docCount.rows[0].count}`);
    console.log(`   Chunks: ${chunkCount.rows[0].count}`);
    console.log(`   Total tokens: ~${totalTokens.toLocaleString()}`);
    console.log(`   Estimated cost: $${((totalTokens / 1_000_000) * 0.02).toFixed(4)}`);

    console.log('\n🔜 Next steps:');
    console.log('   1. ✅ Embeddings generated and stored');
    console.log('   2. ✅ HNSW index created');
    console.log('   3. 🧪 Test RAG: npm run test:rag');
    console.log('   4. 🔗 Integrate with chat API\n');

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run
generateEmbeddings();
