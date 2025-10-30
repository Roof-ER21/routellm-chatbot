#!/usr/bin/env node

/**
 * Generate Embeddings for RAG System
 *
 * Processes the existing 123 KB documents and generates vector embeddings
 * using OpenAI's text-embedding-3-small model ($0.02/1M tokens)
 *
 * This script:
 * 1. Loads all 123 documents from insurance-argumentation-kb.ts
 * 2. Chunks each document into ~500 token segments
 * 3. Generates embeddings for each chunk using OpenAI
 * 4. Stores embeddings in PostgreSQL with pgvector
 * 5. Creates HNSW indexes for fast similarity search
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// ============================================================================
// CONFIGURATION
// ============================================================================

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

// Embedding configuration
const EMBEDDING_MODEL = 'text-embedding-3-small'; // $0.02/1M tokens
const EMBEDDING_DIMENSIONS = 1536; // Default for text-embedding-3-small
const CHUNK_SIZE = 500; // Tokens per chunk (approximate)
const CHUNK_OVERLAP = 50; // Overlap between chunks

// Processing configuration
const BATCH_SIZE = 100; // Process 100 chunks at a time
const RATE_LIMIT_DELAY = 1000; // 1 second between batches

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Simple text chunking by character count (approximation of tokens)
 * 1 token ≈ 4 characters for English text
 */
function chunkText(text, chunkSize = 500, overlap = 50) {
  const chunks = [];
  const chunkChars = chunkSize * 4; // Approximate characters
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

    start = end - overlapChars; // Move forward with overlap
    chunkIndex++;
  }

  // Set total_chunks for all chunks
  chunks.forEach(chunk => {
    chunk.total_chunks = chunks.length;
  });

  return chunks;
}

/**
 * Generate embeddings using OpenAI API
 */
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

/**
 * Generate embeddings in batches with rate limiting
 */
async function generateEmbeddingsBatch(texts) {
  const embeddings = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);

    console.log(`  Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(texts.length / BATCH_SIZE)} (${batch.length} chunks)`);

    const batchEmbeddings = await Promise.all(
      batch.map(text => generateEmbedding(text))
    );

    embeddings.push(...batchEmbeddings);

    // Rate limiting
    if (i + BATCH_SIZE < texts.length) {
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
    }
  }

  return embeddings;
}

/**
 * Load documents from TypeScript knowledge base
 */
function loadDocuments() {
  console.log('📚 Loading documents from knowledge base...\n');

  // Import the KB module
  const kbPath = path.join(__dirname, '..', 'lib', 'insurance-argumentation-kb.ts');

  // Since it's TypeScript, we need to parse it
  // For now, we'll use a simple approach - load the compiled JS version
  // In production, we'd use ts-node or compile first

  try {
    // Try to load from compiled JS
    const { INSURANCE_KB_DOCUMENTS } = require('../lib/insurance-argumentation-kb');
    return INSURANCE_KB_DOCUMENTS;
  } catch (error) {
    console.error('❌ Could not load knowledge base');
    console.error('   Make sure the project is built: npm run build');
    console.error('   Error:', error.message);
    process.exit(1);
  }
}

// ============================================================================
// MAIN PROCESSING FUNCTION
// ============================================================================

async function generateEmbeddings() {
  console.log('🚀 RAG Embedding Generation');
  console.log('============================\n');

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
  console.log(`✓ Chunk size: ${CHUNK_SIZE} tokens (~${CHUNK_SIZE * 4} chars)`);
  console.log(`✓ Chunk overlap: ${CHUNK_OVERLAP} tokens\n`);

  // Load documents
  const documents = loadDocuments();
  console.log(`✓ Loaded ${documents.length} documents\n`);

  // Connect to database
  console.log('🔌 Connecting to PostgreSQL...');
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  console.log('✓ Connected\n');

  try {
    // Process each document
    let totalChunks = 0;
    let totalTokens = 0;

    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      const docNum = i + 1;

      console.log(`[${docNum}/${documents.length}] ${doc.filename}`);
      console.log(`  Category: ${doc.category}`);
      console.log(`  Title: ${doc.title}`);

      // Combine document content
      const fullContent = `${doc.title}\n\n${doc.summary}\n\n${doc.content}`;

      // Calculate hash for version tracking
      const crypto = require('crypto');
      const hash = crypto.createHash('sha256').update(fullContent).digest('hex');

      // Check if document already exists
      const existingDoc = await client.query(
        'SELECT id, hash FROM rag_documents WHERE id = $1',
        [doc.id]
      );

      if (existingDoc.rows.length > 0 && existingDoc.rows[0].hash === hash) {
        console.log('  ⏭️  Already processed (same hash) - skipping\n');
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
        doc.filename,
        doc.filename, // filepath same as filename for KB docs
        'docx', // Default type
        fullContent,
        doc.summary,
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

      // Insert chunks with embeddings
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
          `[${embedding.join(',')}]`, // pgvector format
        ]);
      }

      console.log('  ✅ Complete\n');

      // Progress update every 10 documents
      if (docNum % 10 === 0) {
        console.log(`📊 Progress: ${((docNum / documents.length) * 100).toFixed(1)}% (${docNum}/${documents.length})\n`);
      }
    }

    // Create HNSW index for fast vector search
    console.log('🔍 Creating HNSW index for vector search...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_chunks_embedding_hnsw
      ON rag_chunks USING hnsw (embedding vector_cosine_ops)
      WITH (m = 16, ef_construction = 64)
    `);
    console.log('✓ HNSW index created\n');

    // Final statistics
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
    console.log('   2. ✅ HNSW index created for fast search');
    console.log('   3. 🧪 Test RAG retrieval: npm run test:rag');
    console.log('   4. 🔗 Integrate with chat API\n');

  } catch (error) {
    console.error('\n❌ Error generating embeddings:');
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the script
generateEmbeddings();
