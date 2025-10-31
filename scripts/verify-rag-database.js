#!/usr/bin/env node

/**
 * RAG Database Verification Script
 *
 * Verifies PostgreSQL database schema, pgvector extension, and RAG data
 * Checks:
 * - Database connection
 * - pgvector extension
 * - Table existence (rag_documents, rag_chunks)
 * - Row counts
 * - Index existence (HNSW on embeddings)
 * - Sample data validation
 */

const { Client } = require('pg');

async function verifyDatabase() {
  console.log('🔍 RAG Database Verification');
  console.log('============================\n');

  // Get DATABASE_URL from environment
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable not set');
    console.error('   This script must run in Railway environment');
    console.error('   Use: railway run node scripts/verify-rag-database.js');
    process.exit(1);
  }

  console.log('✓ DATABASE_URL found');

  const client = new Client({
    connectionString: databaseUrl,
  });

  const results = {
    connection: false,
    pgvector: false,
    tables: {
      rag_documents: false,
      rag_chunks: false,
      rag_query_cache: false,
      rag_analytics: false,
    },
    counts: {
      documents: 0,
      chunks: 0,
    },
    indexes: {
      hnsw: false,
      chunks_metadata: false,
      documents_metadata: false,
    },
    sampleData: false,
    issues: [],
  };

  try {
    // 1. TEST CONNECTION
    console.log('\n1️⃣  Testing database connection...');
    await client.connect();
    results.connection = true;
    console.log('   ✅ Connected to PostgreSQL');

    // 2. VERIFY PGVECTOR EXTENSION
    console.log('\n2️⃣  Checking pgvector extension...');
    const extResult = await client.query(
      "SELECT extname, extversion FROM pg_extension WHERE extname = 'vector'"
    );

    if (extResult.rows.length > 0) {
      results.pgvector = true;
      console.log(`   ✅ pgvector extension installed (version ${extResult.rows[0].extversion})`);
    } else {
      results.issues.push('pgvector extension not installed');
      console.log('   ❌ pgvector extension NOT FOUND');
      console.log('   💡 Run: CREATE EXTENSION vector;');
    }

    // 3. VERIFY TABLES
    console.log('\n3️⃣  Checking RAG tables...');
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name LIKE 'rag_%'
      ORDER BY table_name
    `);

    const foundTables = tablesResult.rows.map(row => row.table_name);

    const requiredTables = ['rag_documents', 'rag_chunks'];
    const optionalTables = ['rag_query_cache', 'rag_analytics'];

    requiredTables.forEach(table => {
      if (foundTables.includes(table)) {
        results.tables[table] = true;
        console.log(`   ✅ ${table} exists`);
      } else {
        results.issues.push(`Required table ${table} missing`);
        console.log(`   ❌ ${table} NOT FOUND`);
      }
    });

    optionalTables.forEach(table => {
      if (foundTables.includes(table)) {
        results.tables[table] = true;
        console.log(`   ✅ ${table} exists (optional)`);
      } else {
        console.log(`   ⚠️  ${table} not found (optional)`);
      }
    });

    // 4. CHECK ROW COUNTS
    console.log('\n4️⃣  Checking data counts...');

    if (results.tables.rag_documents) {
      const docCount = await client.query('SELECT COUNT(*) FROM rag_documents');
      results.counts.documents = parseInt(docCount.rows[0].count);
      console.log(`   📄 Documents: ${results.counts.documents}`);

      if (results.counts.documents === 0) {
        results.issues.push('No documents found in rag_documents table');
        console.log('   ⚠️  No documents - embeddings not generated yet');
      } else if (results.counts.documents < 140) {
        results.issues.push(`Only ${results.counts.documents} documents (expected 140-142)`);
        console.log(`   ⚠️  Low document count (expected 140-142)`);
      } else {
        console.log('   ✅ Document count looks good');
      }
    }

    if (results.tables.rag_chunks) {
      const chunkCount = await client.query('SELECT COUNT(*) FROM rag_chunks');
      results.counts.chunks = parseInt(chunkCount.rows[0].count);
      console.log(`   📦 Chunks: ${results.counts.chunks}`);

      if (results.counts.chunks === 0) {
        results.issues.push('No chunks found in rag_chunks table');
        console.log('   ⚠️  No chunks - embeddings not generated yet');
      } else if (results.counts.chunks < 800) {
        results.issues.push(`Only ${results.counts.chunks} chunks (expected 800-1000)`);
        console.log(`   ⚠️  Low chunk count (expected 800-1000)`);
      } else {
        console.log('   ✅ Chunk count looks good');
      }
    }

    // 5. VERIFY INDEXES
    console.log('\n5️⃣  Checking indexes...');

    // Check for HNSW index on rag_chunks.embedding
    const hnswResult = await client.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'rag_chunks'
        AND indexname LIKE '%embedding%'
    `);

    if (hnswResult.rows.length > 0) {
      const hasHNSW = hnswResult.rows.some(row =>
        row.indexdef.toLowerCase().includes('hnsw')
      );

      if (hasHNSW) {
        results.indexes.hnsw = true;
        console.log('   ✅ HNSW index on embeddings found');
        hnswResult.rows.forEach(row => {
          console.log(`      - ${row.indexname}`);
        });
      } else {
        results.issues.push('HNSW index on embeddings not found');
        console.log('   ❌ HNSW index not found (critical for performance)');
      }
    } else {
      results.issues.push('No embedding index found');
      console.log('   ❌ No embedding index found');
    }

    // Check metadata indexes
    const metadataIndexes = await client.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename IN ('rag_chunks', 'rag_documents')
        AND indexname LIKE '%metadata%'
    `);

    if (metadataIndexes.rows.length > 0) {
      results.indexes.chunks_metadata = true;
      results.indexes.documents_metadata = true;
      console.log(`   ✅ Metadata indexes found (${metadataIndexes.rows.length})`);
    } else {
      console.log('   ⚠️  No metadata indexes found');
    }

    // 6. VERIFY SAMPLE DATA
    console.log('\n6️⃣  Checking sample data...');

    if (results.tables.rag_chunks && results.counts.chunks > 0) {
      // Check if embeddings exist (not NULL)
      const embeddingCheck = await client.query(`
        SELECT COUNT(*) as with_embedding
        FROM rag_chunks
        WHERE embedding IS NOT NULL
      `);

      const withEmbedding = parseInt(embeddingCheck.rows[0].with_embedding);

      if (withEmbedding === results.counts.chunks) {
        results.sampleData = true;
        console.log(`   ✅ All ${results.counts.chunks} chunks have embeddings`);
      } else if (withEmbedding > 0) {
        results.issues.push(`Only ${withEmbedding}/${results.counts.chunks} chunks have embeddings`);
        console.log(`   ⚠️  Only ${withEmbedding}/${results.counts.chunks} chunks have embeddings`);
      } else {
        results.issues.push('No embeddings found in chunks');
        console.log('   ❌ No embeddings found');
      }

      // Get sample chunk
      const sampleChunk = await client.query(`
        SELECT
          c.id,
          c.text,
          c.tokens,
          c.metadata,
          d.filename
        FROM rag_chunks c
        JOIN rag_documents d ON c.document_id = d.id
        WHERE c.embedding IS NOT NULL
        LIMIT 1
      `);

      if (sampleChunk.rows.length > 0) {
        const sample = sampleChunk.rows[0];
        console.log('\n   📝 Sample chunk:');
        console.log(`      File: ${sample.filename}`);
        console.log(`      Tokens: ${sample.tokens}`);
        console.log(`      Text: ${sample.text.substring(0, 100)}...`);
        if (sample.metadata && Object.keys(sample.metadata).length > 0) {
          console.log(`      Metadata: ${JSON.stringify(sample.metadata)}`);
        }
      }
    }

    // 7. GENERATE REPORT
    console.log('\n\n═══════════════════════════════════════');
    console.log('📊 VERIFICATION SUMMARY');
    console.log('═══════════════════════════════════════\n');

    const status = results.issues.length === 0 ? '✅ HEALTHY' : '⚠️  ISSUES FOUND';
    console.log(`Status: ${status}\n`);

    console.log('Database Connection:  ', results.connection ? '✅' : '❌');
    console.log('pgvector Extension:   ', results.pgvector ? '✅' : '❌');
    console.log('rag_documents Table:  ', results.tables.rag_documents ? '✅' : '❌');
    console.log('rag_chunks Table:     ', results.tables.rag_chunks ? '✅' : '❌');
    console.log('HNSW Index:           ', results.indexes.hnsw ? '✅' : '❌');
    console.log('Documents Count:      ', results.counts.documents);
    console.log('Chunks Count:         ', results.counts.chunks);
    console.log('Embeddings Complete:  ', results.sampleData ? '✅' : '❌');

    if (results.issues.length > 0) {
      console.log('\n\n🔧 ISSUES DETECTED:');
      console.log('═══════════════════════════════════════');
      results.issues.forEach((issue, i) => {
        console.log(`${i + 1}. ${issue}`);
      });

      console.log('\n\n💡 RECOMMENDED ACTIONS:');
      console.log('═══════════════════════════════════════');

      if (!results.pgvector) {
        console.log('1. Enable pgvector extension:');
        console.log('   railway run psql $DATABASE_URL -c "CREATE EXTENSION vector;"');
      }

      if (!results.tables.rag_documents || !results.tables.rag_chunks) {
        console.log('2. Initialize database schema:');
        console.log('   railway run node scripts/init-rag-database.js');
      }

      if (results.counts.chunks === 0) {
        console.log('3. Generate embeddings:');
        console.log('   npm run rag:build');
        console.log('   (This will process all documents and create embeddings)');
      }

      if (!results.indexes.hnsw && results.counts.chunks > 0) {
        console.log('4. Create HNSW index:');
        console.log('   railway run psql $DATABASE_URL -c "CREATE INDEX idx_chunks_embedding_hnsw ON rag_chunks USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);"');
      }
    } else {
      console.log('\n\n🎉 ALL CHECKS PASSED!');
      console.log('═══════════════════════════════════════');
      console.log('Your RAG database is properly configured and ready to use.');
      console.log('\nNext steps:');
      console.log('1. Test RAG retrieval with sample queries');
      console.log('2. Monitor query performance');
      console.log('3. Deploy to production');
    }

    console.log('\n');

  } catch (error) {
    console.error('\n❌ Error during verification:');
    console.error(error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run verification
verifyDatabase();
