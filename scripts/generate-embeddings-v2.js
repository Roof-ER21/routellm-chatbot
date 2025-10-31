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
// LOAD DOCUMENTS FROM DISK (processed JSON)
// ============================================================================

function slugifyId(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64);
}

function pickTypeFromFilename(name = '') {
  const ext = path.extname(name).toLowerCase();
  if (ext === '.pdf') return 'pdf';
  if (ext === '.docx' || ext === '.doc') return 'docx';
  if (['.jpg', '.jpeg', '.png'].includes(ext)) return 'image';
  return 'docx';
}

function safeReadJSON(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`   ⚠️  Skipping invalid JSON: ${filePath} (${e.message})`);
    return null;
  }
}

function normalizeDoc(json, filePath) {
  const baseName = path.basename(filePath);
  const sourceFile = json?.sourceFile || json?.filename || baseName.replace(/\.json$/i, '');
  const title = json?.title || json?.name || sourceFile?.replace(/\.[^/.]+$/, '') || baseName;

  // Prefer rich content fields in order
  const content = (
    json?.content ||
    json?.extractedText ||
    json?.extracted_text ||
    json?.text ||
    json?.body ||
    ''
  ).toString();

  const summary = (json?.summary || json?.description || '').toString();
  const category = json?.category || 'reference';
  const scenarios = json?.scenarios || json?.metadata?.scenarios || [];
  const states = json?.states || json?.metadata?.states || [];
  const tags = json?.tags || json?.metadata?.tags || [];

  const id = json?.id || slugifyId(`${title}_${category}`) || slugifyId(baseName);

  return {
    id,
    filename: sourceFile || baseName,
    category,
    title: title || baseName,
    content,
    summary,
    scenarios,
    applicableStates: states,
    tags,
    _raw: json,
  };
}

async function loadDocumentsFromKB() {
  console.log('📚 Loading documents from processed JSON...\n');

  const kbDir = path.join(__dirname, '..', 'data', 'processed-kb');
  const candidates = [];

  const subdirs = [
    path.join(kbDir, 'documents'),
    path.join(kbDir, 'documents-ready'),
    kbDir,
  ];

  // Collect JSON files from known locations
  for (const dir of subdirs) {
    if (!fs.existsSync(dir)) continue;
    const items = fs.readdirSync(dir);
    for (const name of items) {
      const p = path.join(dir, name);
      const st = (() => { try { return fs.statSync(p); } catch { return null; } })();
      if (!st) continue;
      if (st.isDirectory()) continue;
      if (!name.toLowerCase().endsWith('.json')) continue;
      // Skip obvious non-doc records
      if (/manifest|processing-summary|progress|processing-report|sample-processed-doc/i.test(name)) continue;
      candidates.push(p);
    }
  }

  if (!candidates.length) {
    console.log('   ⚠️  No processed JSON documents found under data/processed-kb');
    console.log('   Falling back to lib/insurance-argumentation-kb.ts if available...');
    try {
      const KB = require('../lib/insurance-argumentation-kb');
      const docs = KB.INSURANCE_KB_DOCUMENTS || KB.default?.INSURANCE_KB_DOCUMENTS;
      if (!docs || !Array.isArray(docs)) throw new Error('INSURANCE_KB_DOCUMENTS missing');
      console.log(`✓ Loaded ${docs.length} documents from TypeScript KB fallback\n`);
      return docs;
    } catch (e) {
      console.error('❌ No JSON docs and could not load TypeScript KB.');
      console.error('   Checked:', subdirs.join(', '));
      console.error('   Error:', e.message);
      process.exit(1);
    }
  }

  console.log(`   Found ${candidates.length} JSON files`);

  const docs = [];
  for (const file of candidates) {
    const json = safeReadJSON(file);
    if (!json) continue;
    const normalized = normalizeDoc(json, file);
    // Require content to embed
    if (!normalized.content || !normalized.content.trim()) {
      console.log(`   ⏭️  ${path.basename(file)} has no content field — skipping`);
      continue;
    }
    docs.push(normalized);
  }

  if (!docs.length) {
    console.log('   ⚠️  Found JSON files but none contained content to embed.');
    console.log('   Falling back to parsing TypeScript KB (lib/insurance-argumentation-kb.ts)...');
    try {
      const fallbackDocs = parseTypeScriptKB();
      console.log(`✓ Loaded ${fallbackDocs.length} documents from TypeScript KB fallback\n`);
      return fallbackDocs;
    } catch (e) {
      console.error('❌ No embeddable JSON docs and TypeScript KB fallback failed.');
      console.error('   Error:', e.message);
      process.exit(1);
    }
  }

  console.log(`✓ Loaded ${docs.length} processed documents from data/processed-kb\n`);
  return docs;
}

// ----------------------------------------------------------------------------
// Fallback: Parse the TypeScript KB file directly without a build step
// ----------------------------------------------------------------------------
function parseTypeScriptKB() {
  const tsPath = path.join(__dirname, '..', 'lib', 'insurance-argumentation-kb.ts');
  if (!fs.existsSync(tsPath)) {
    throw new Error('lib/insurance-argumentation-kb.ts not found');
  }

  const tsCode = fs.readFileSync(tsPath, 'utf-8');

  // Extract only the exported KB array and evaluate it as JS
  const match = tsCode.match(/export\s+const\s+INSURANCE_KB_DOCUMENTS[\s\S]*?=\s*\[([\s\S]*?)\];/);
  if (!match) {
    throw new Error('Could not find INSURANCE_KB_DOCUMENTS array in TS file');
  }

  const arrayBlock = match[0]
    // Drop the type annotation and export keyword
    .replace(/export\s+const\s+INSURANCE_KB_DOCUMENTS\s*:[^=]+=/, 'const INSURANCE_KB_DOCUMENTS =')
    .trim();

  const Module = require('module');
  const m = new Module();
  // Append an export so we can read the value
  const toEval = `${arrayBlock}\nmodule.exports = INSURANCE_KB_DOCUMENTS;`;
  try {
    m._compile(toEval, 'kb-inline-eval.js');
  } catch (e) {
    throw new Error(`Failed to evaluate KB array: ${e.message}`);
  }

  const docs = m.exports;
  if (!Array.isArray(docs)) {
    throw new Error('Parsed KB did not yield an array');
  }
  return docs;
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
      const docType = pickTypeFromFilename(doc.filename || doc.id || '');

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
        docType,
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
