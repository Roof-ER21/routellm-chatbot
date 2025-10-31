/**
 * Generate RAG Embeddings API Endpoint
 *
 * Triggers the embedding generation process on Railway
 * This endpoint executes the same logic as scripts/generate-embeddings-v2.js
 * but runs within the Railway environment with access to DATABASE_URL
 */

import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;
const CHUNK_SIZE = 500; // tokens
const CHUNK_OVERLAP = 50;
const BATCH_SIZE = 10; // Reduced to save memory
const RATE_LIMIT_DELAY = 100; // Reduced delay since smaller batches

// Chunking function
function chunkText(text: string, chunkSize = 500, overlap = 50) {
  const chunks: Array<{
    text: string;
    tokens: number;
    chunk_index: number;
    total_chunks: number;
    position_start: number;
    position_end: number;
  }> = [];

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
      total_chunks: 0, // Will be updated after
      position_start: start,
      position_end: end,
    });

    start = end - overlapChars;
    chunkIndex++;
  }

  // Update total_chunks
  chunks.forEach(chunk => {
    chunk.total_chunks = chunks.length;
  });

  return chunks;
}

// Generate embedding for single text
async function generateEmbedding(text: string): Promise<number[]> {
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
async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];

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
  const docsDir = path.join(process.cwd(), 'data/processed-kb/documents');

  if (!fs.existsSync(docsDir)) {
    console.error('[Embedding Generation] Processed documents directory not found:', docsDir);
    return [];
  }

  const files = fs.readdirSync(docsDir).filter(file => file.endsWith('.json'));
  console.log(`[Embedding Generation] Found ${files.length} JSON files`);

  return files.map((file, index) => {
    const filePath = path.join(docsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const doc = JSON.parse(content);

    return {
      id: `processed_${file.replace('.json', '')}`,
      filename: doc.filename || file,
      filepath: filePath,
      extractedText: doc.extractedText || doc.content || '',
      qualityScore: doc.qualityScore || 0,
      metadata: {
        textLength: doc.textLength || 0,
        technicalTerms: doc.technicalTerms || [],
        ...doc.metadata,
      },
    };
  });
}

export async function POST(request: Request) {
  try {
    console.log('[Embedding Generation] Starting...');

    // Validate environment
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'OPENAI_API_KEY not configured' },
        { status: 500 }
      );
    }

    if (!DATABASE_URL) {
      return NextResponse.json(
        { success: false, error: 'DATABASE_URL not configured' },
        { status: 500 }
      );
    }

    // Start generation in background (don't await)
    generateEmbeddingsBackground().catch(err => {
      console.error('[Embedding Generation Background] Fatal error:', err);
    });

    // Return immediately
    return NextResponse.json({
      success: true,
      message: 'Embedding generation started in background',
      estimatedTime: '2-5 minutes',
      checkStatus: 'GET /api/admin/generate-embeddings',
    });

  } catch (error: any) {
    console.error('[Embedding Generation] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// Background generation function
async function generateEmbeddingsBackground() {
  let pool: Pool | null = null;

  try {
    // Connect to database
    pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 1, // Limit connections to reduce memory
    });

    console.log('[Embedding Generation] Connected to database');

    // Load processed documents from JSON files
    const documents = loadProcessedDocuments();
    console.log(`[Embedding Generation] Processing ${documents.length} processed documents`);

    let totalChunks = 0;
    let totalTokens = 0;
    let processedDocs = 0;
    let skippedDocs = 0;

    // Process one document at a time to reduce memory usage
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];

      // Use extracted text as full content
      const fullContent = doc.extractedText || '';

      if (!fullContent || fullContent.length < 10) {
        console.log(`[${i + 1}/${documents.length}] ${doc.filename} - skipped (no content)`);
        skippedDocs++;
        continue;
      }

      // Calculate hash
      const hash = crypto.createHash('sha256').update(fullContent).digest('hex');

      // Check if document exists and is unchanged
      const existingDoc = await pool.query(
        'SELECT id, hash FROM rag_documents WHERE id = $1',
        [doc.id]
      );

      if (existingDoc.rows.length > 0 && existingDoc.rows[0].hash === hash) {
        console.log(`[${i + 1}/${documents.length}] ${doc.filename} - skipped (already processed)`);
        skippedDocs++;
        continue;
      }

      console.log(`[${i + 1}/${documents.length}] ${doc.filename} - processing`);

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

      // Force garbage collection hint after each document (if available)
      if (global.gc) {
        try {
          global.gc();
        } catch (e) {
          // GC not exposed
        }
      }
    }

    // Create HNSW index
    console.log('[Embedding Generation] Creating HNSW index...');
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

    console.log('[Embedding Generation] Complete!');
    console.log(`[Embedding Generation] Stats: ${processedDocs} docs, ${totalChunks} chunks, $${estimatedCost}`);
    console.log(`[Embedding Generation] Database: ${docCount.rows[0].count} docs, ${chunkCount.rows[0].count} chunks`);

  } catch (error: any) {
    console.error('[Embedding Generation Background] Error:', error);
  }
}

// GET endpoint to check status
export async function GET() {
  try {
    if (!DATABASE_URL) {
      return NextResponse.json({
        ready: false,
        error: 'DATABASE_URL not configured',
      });
    }

    const pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });

    const docCount = await pool.query('SELECT COUNT(*) FROM rag_documents');
    const chunkCount = await pool.query('SELECT COUNT(*) FROM rag_chunks');

    await pool.end();

    const documents = parseInt(docCount.rows[0].count);
    const chunks = parseInt(chunkCount.rows[0].count);

    return NextResponse.json({
      ready: chunks > 0,
      status: chunks > 0 ? 'ready' : 'needs_generation',
      documents,
      chunks,
      message: chunks > 0
        ? 'RAG system ready to use'
        : 'Run POST /api/admin/generate-embeddings to generate embeddings',
    });

  } catch (error: any) {
    return NextResponse.json(
      {
        ready: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
