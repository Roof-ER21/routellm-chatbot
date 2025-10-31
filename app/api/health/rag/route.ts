/**
 * RAG Database Health Check API
 *
 * Verifies:
 * - Database connection
 * - pgvector extension
 * - RAG tables existence
 * - Document and chunk counts
 * - Index status
 */

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const results: any = {
    status: 'unknown',
    timestamp: new Date().toISOString(),
    checks: {
      database: false,
      pgvector: false,
      tables: {
        rag_documents: false,
        rag_chunks: false,
      },
      counts: {
        documents: 0,
        chunks: 0,
      },
      indexes: {
        hnsw: false,
      },
    },
    issues: [] as string[],
  };

  try {
    // 1. Check database connection
    results.checks.database = true;

    // 2. Check pgvector extension
    const extResult = await query(
      "SELECT extname, extversion FROM pg_extension WHERE extname = 'vector'"
    );

    if (extResult.rows.length > 0) {
      results.checks.pgvector = true;
      results.pgvectorVersion = extResult.rows[0].extversion;
    } else {
      results.issues.push('pgvector extension not installed');
    }

    // 3. Check tables
    const tablesResult = await query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('rag_documents', 'rag_chunks')
      ORDER BY table_name
    `);

    const foundTables = tablesResult.rows.map((row: any) => row.table_name);

    if (foundTables.includes('rag_documents')) {
      results.checks.tables.rag_documents = true;
    } else {
      results.issues.push('rag_documents table not found');
    }

    if (foundTables.includes('rag_chunks')) {
      results.checks.tables.rag_chunks = true;
    } else {
      results.issues.push('rag_chunks table not found');
    }

    // 4. Check counts
    if (results.checks.tables.rag_documents) {
      try {
        const docCount = await query('SELECT COUNT(*) FROM rag_documents');
        results.checks.counts.documents = parseInt(docCount.rows[0].count);
      } catch (e) {
        results.issues.push('Error counting documents');
      }
    }

    if (results.checks.tables.rag_chunks) {
      try {
        const chunkCount = await query('SELECT COUNT(*) FROM rag_chunks');
        results.checks.counts.chunks = parseInt(chunkCount.rows[0].count);

        // Check if embeddings exist
        const embeddingCount = await query(`
          SELECT COUNT(*) as with_embedding
          FROM rag_chunks
          WHERE embedding IS NOT NULL
        `);
        results.checks.counts.chunksWithEmbeddings = parseInt(embeddingCount.rows[0].with_embedding);
      } catch (e) {
        results.issues.push('Error counting chunks');
      }
    }

    // 5. Check indexes
    if (results.checks.tables.rag_chunks) {
      try {
        const indexResult = await query(`
          SELECT indexname, indexdef
          FROM pg_indexes
          WHERE tablename = 'rag_chunks'
            AND indexname LIKE '%embedding%'
        `);

        if (indexResult.rows.length > 0) {
          const hasHNSW = indexResult.rows.some((row: any) =>
            row.indexdef.toLowerCase().includes('hnsw')
          );
          results.checks.indexes.hnsw = hasHNSW;
          results.checks.indexes.list = indexResult.rows.map((row: any) => row.indexname);
        } else {
          results.issues.push('No embedding index found');
        }
      } catch (e) {
        results.issues.push('Error checking indexes');
      }
    }

    // 6. Determine overall status
    const isHealthy =
      results.checks.database &&
      results.checks.pgvector &&
      results.checks.tables.rag_documents &&
      results.checks.tables.rag_chunks &&
      results.checks.counts.documents > 0 &&
      results.checks.counts.chunks > 0 &&
      results.checks.indexes.hnsw;

    results.status = isHealthy ? 'healthy' : 'degraded';

    // 7. Add recommendations
    if (results.issues.length > 0) {
      results.recommendations = [];

      if (!results.checks.pgvector) {
        results.recommendations.push('Enable pgvector extension: CREATE EXTENSION vector;');
      }

      if (!results.checks.tables.rag_documents || !results.checks.tables.rag_chunks) {
        results.recommendations.push('Initialize database: railway run node scripts/init-rag-database.js');
      }

      if (results.checks.counts.chunks === 0) {
        results.recommendations.push('Generate embeddings: npm run rag:build');
      }

      if (!results.checks.indexes.hnsw && results.checks.counts.chunks > 0) {
        results.recommendations.push('Create HNSW index for better performance');
      }
    }

    return NextResponse.json(results, {
      status: isHealthy ? 200 : 503,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
