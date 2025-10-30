/**
 * RAG Database Initialization API Endpoint
 *
 * Initializes PostgreSQL database with pgvector extension and RAG schema
 * Can be called via HTTP to initialize the database from within Railway
 */

import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    console.log('[RAG Init] Starting database initialization...');

    // Check if already initialized
    const extCheck = await sql`
      SELECT extname, extversion
      FROM pg_extension
      WHERE extname = 'vector'
    `;

    if (extCheck.rows.length > 0) {
      console.log('[RAG Init] Database already initialized');
      return NextResponse.json({
        success: true,
        message: 'Database already initialized',
        pgvectorVersion: extCheck.rows[0].extversion,
        alreadyInitialized: true,
      });
    }

    // Read schema file
    const schemaPath = path.join(process.cwd(), 'lib', 'db-schema-rag.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    console.log('[RAG Init] Executing schema...');

    // Execute schema (split by semicolons and execute each statement)
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      try {
        await sql.query(statement);
      } catch (error: any) {
        // Ignore "already exists" errors
        if (!error.message.includes('already exists')) {
          console.error(`[RAG Init] Error executing statement:`, error.message);
        }
      }
    }

    console.log('[RAG Init] Schema executed successfully');

    // Verify pgvector extension
    const verification = await sql`
      SELECT extname, extversion
      FROM pg_extension
      WHERE extname = 'vector'
    `;

    // Get table counts
    const docCount = await sql`SELECT COUNT(*) FROM rag_documents`;
    const chunkCount = await sql`SELECT COUNT(*) FROM rag_chunks`;
    const cacheCount = await sql`SELECT COUNT(*) FROM rag_query_cache`;

    console.log('[RAG Init] Initialization complete!');

    return NextResponse.json({
      success: true,
      message: 'RAG database initialized successfully',
      pgvectorVersion: verification.rows[0]?.extversion || 'unknown',
      tables: {
        documents: parseInt(docCount.rows[0].count),
        chunks: parseInt(chunkCount.rows[0].count),
        cache: parseInt(cacheCount.rows[0].count),
      },
      nextSteps: [
        'Run embedding generation: POST /api/admin/generate-embeddings',
        'Or via CLI: railway run npm run rag:build',
      ],
    });

  } catch (error: any) {
    console.error('[RAG Init] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        hint: 'Make sure DATABASE_URL is configured and pgvector extension is available',
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check status
export async function GET() {
  try {
    // Check if initialized
    const extCheck = await sql`
      SELECT extname, extversion
      FROM pg_extension
      WHERE extname = 'vector'
    `;

    if (extCheck.rows.length === 0) {
      return NextResponse.json({
        initialized: false,
        message: 'RAG database not initialized. POST to this endpoint to initialize.',
      });
    }

    // Get counts
    const docCount = await sql`SELECT COUNT(*) FROM rag_documents`;
    const chunkCount = await sql`SELECT COUNT(*) FROM rag_chunks`;
    const cacheCount = await sql`SELECT COUNT(*) FROM rag_query_cache`;

    return NextResponse.json({
      initialized: true,
      pgvectorVersion: extCheck.rows[0].extversion,
      tables: {
        documents: parseInt(docCount.rows[0].count),
        chunks: parseInt(chunkCount.rows[0].count),
        cache: parseInt(cacheCount.rows[0].count),
      },
      status: parseInt(chunkCount.rows[0].count) > 0 ? 'ready' : 'needs_embeddings',
    });

  } catch (error: any) {
    return NextResponse.json(
      {
        initialized: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
