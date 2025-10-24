/**
 * RAG Search API Endpoint
 *
 * Test endpoint for RAG system
 * - Accepts text queries
 * - Returns relevant chunks with scores
 * - Useful for debugging and testing RAG performance
 */

import { NextRequest, NextResponse } from 'next/server';
import { ragService } from '@/lib/rag-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================================================
// POST /api/search - Search knowledge base
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, topK, minScore } = body;

    // Validate input
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }

    if (query.length < 3) {
      return NextResponse.json(
        { error: 'Query must be at least 3 characters' },
        { status: 400 }
      );
    }

    // Perform search
    const startTime = Date.now();
    const context = await ragService.search(
      query,
      topK || 5,
      minScore || 0.7
    );
    const searchTime = Date.now() - startTime;

    // Format results
    const results = context.chunks.map(result => ({
      text: result.chunk.text,
      score: result.score,
      relevance: result.relevance,
      metadata: result.chunk.metadata,
      id: result.chunk.id
    }));

    return NextResponse.json({
      success: true,
      query,
      results,
      totalResults: results.length,
      sources: context.sources,
      searchTime,
      cacheHit: context.cacheHit,
      timestamp: context.timestamp
    });

  } catch (error: any) {
    console.error('[Search API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Search failed',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET /api/search - Get RAG service status
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const status = ragService.getStatus();

    return NextResponse.json({
      success: true,
      status,
      message: status.loaded
        ? `RAG service operational with ${status.totalChunks} chunks`
        : 'RAG service not loaded - run npm run kb:build to generate embeddings'
    });

  } catch (error: any) {
    console.error('[Search API] Status check error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Status check failed'
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/search - Clear cache
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    ragService.clearCache();

    return NextResponse.json({
      success: true,
      message: 'Cache cleared successfully'
    });

  } catch (error: any) {
    console.error('[Search API] Cache clear error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Cache clear failed'
      },
      { status: 500 }
    );
  }
}
