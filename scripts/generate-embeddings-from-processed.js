#!/usr/bin/env node

/**
 * Generate Embeddings from Processed JSON Documents
 *
 * This script loads the 142 processed documents from data/processed-kb/documents/
 * and generates embeddings for them in the RAG database.
 */

const { Pool } = require('pg');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;
const CHUNK_SIZE = 500; // tokens
const CHUNK_OVERLAP = 50;
const BATCH_SIZE = 10;
const RATE_LIMIT_DELAY = 100;

// Processed documents directory
const PROCESSED_DOCS_DIR = path.join(__dirname, '../data/processed-kb/documents');

// Chunking function
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
      total_chunks: 0,
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

// Generate embedding for single text
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

// Generate embeddings in batches
async function generateEmbeddingsBatch(texts) {
  const embeddings = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);

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

// Load processed documents from JSON files
function loadProcessedDocuments() {
  console.log(`📂 Loading documents from: ${PROCESSED_DOCS_DIR}`);

  if (!fs.existsSync(PROCESSED_DOCS_DIR)) {
    throw new Error(`Processed documents directory not found: ${PROCESSED_DOCS_DIR}`);
  }

  const files = fs.readdirSync(PROCESSED_DOCS_DIR)
    .filter(file => file.endsWith('.json'));

  console.log(`📄 Found ${files.length} JSON files`);

  const documents = files.map((file, index) => {
    const filePath = path.join(PROCESSED_DOCS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const doc = JSON.parse(content);

    // Create a unique ID from the filename
    const id = `processed_${file.replace('.json', '')}`;

    return {
      id,
      filename: doc.filename || file,
      filepath: filePath,
      extractedText: doc.extractedText || doc.content || '',
      qualityScore: doc.qualityScore || 0,
      processingMethod: doc.processingMethod || 'unknown',
      metadata: {
        textLength: doc.textLength || 0,
        technicalTerms: doc.technicalTerms || [],
        documentStructure: doc.documentStructure || {},
        ...doc.metadata,
      },
    };
  });

  return documents;
}

async function main() {
  console.log('=== Generate Embeddings from Processed Documents ===\n');

  // Validate environment
  if (!OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not set');
    process.exit(1);
  }

  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not set');
    process.exit(1);
  }

  // Load processed documents
  const documents = loadProcessedDocuments();
  console.log(`✅ Loaded ${documents.length} processed documents\n`);

  // Connect to database
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 1,
  });

  try {
    await pool.query('SELECT 1'); // Test connection
    console.log('✅ Connected to database\n');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }

  let totalChunks = 0;
  let totalTokens = 0;
  let processedDocs = 0;
  let skippedDocs = 0;

  // Process each document
  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];

    const fullContent = doc.extractedText || '';
    if (!fullContent || fullContent.length < 10) {
      console.log(`[${i + 1}/${documents.length}] ${doc.filename} - skipped (no content)`);
      skippedDocs++;
      continue;
    }

    const hash = crypto.createHash('sha256').update(fullContent).digest('hex');

    // Check if document exists
    const existingDoc = await pool.query(
      'SELECT id, hash FROM rag_documents WHERE id = $1',
      [doc.id]
    );

    if (existingDoc.rows.length > 0 && existingDoc.rows[0].hash === hash) {
      console.log(`[${i + 1}/${documents.length}] ${doc.filename} - skipped (already processed)`);
      skippedDocs++;
      continue;
    }

    console.log(`[${i + 1}/${documents.length}] ${doc.filename} - processing...`);

    // Insert/update document
    await pool.query(`
      INSERT INTO rag_documents (id, filename, filepath, type, content, summary, metadata, hash)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE SET
        content = EXCLUDED.content,
        metadata = EXCLUDED.metadata,
        hash = EXCLUDED.hash,
        version = rag_documents.version + 1,
        updated_at = NOW()
    `, [
      doc.id,
      doc.filename,
      doc.filepath,
      'processed', // type
      fullContent,
      '', // summary
      JSON.stringify(doc.metadata),
      hash,
    ]);

    // Chunk the document
    const chunks = chunkText(fullContent, CHUNK_SIZE, CHUNK_OVERLAP);
    totalChunks += chunks.length;
    totalTokens += chunks.reduce((sum, c) => sum + c.tokens, 0);

    // Generate embeddings
    const chunkTexts = chunks.map(c => c.text);
    const embeddings = await generateEmbeddingsBatch(chunkTexts);

    // Insert chunks
    for (let j = 0; j < chunks.length; j++) {
      const chunk = chunks[j];
      const embedding = embeddings[j];
      const chunkId = `${doc.id}_chunk_${j}`;

      await pool.query(`
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

    processedDocs++;

    // Progress indicator
    if (processedDocs % 10 === 0) {
      console.log(`   Progress: ${processedDocs}/${documents.length} documents, ${totalChunks} chunks`);
    }
  }

  // Create HNSW index
  console.log('\n📊 Creating HNSW index...');
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_chunks_embedding_hnsw
    ON rag_chunks USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64)
  `);

  // Get final counts
  const docCount = await pool.query('SELECT COUNT(*) FROM rag_documents');
  const chunkCount = await pool.query('SELECT COUNT(*) FROM rag_chunks');

  await pool.end();

  const estimatedCost = ((totalTokens / 1_000_000) * 0.02).toFixed(4);

  console.log('\n=== Embedding Generation Complete! ===');
  console.log(`✅ Processed: ${processedDocs} documents`);
  console.log(`⏭️  Skipped: ${skippedDocs} documents`);
  console.log(`📦 Total chunks: ${totalChunks}`);
  console.log(`💰 Estimated cost: $${estimatedCost}`);
  console.log(`📊 Database: ${docCount.rows[0].count} docs, ${chunkCount.rows[0].count} chunks\n`);

  process.exit(0);
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
