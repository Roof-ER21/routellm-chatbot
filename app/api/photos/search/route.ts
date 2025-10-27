/**
 * Photo Search API
 * Provides endpoints for searching roofing photo examples
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchPhotos, getPhotosByTerm, getPhotoIndexStats } from '@/lib/photo-index';
import { searchPhotoExamples, analyzeQueryForPhotos } from '@/lib/photo-search';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const term = searchParams.get('term');
    const limit = parseInt(searchParams.get('limit') || '10');
    const stats = searchParams.get('stats');

    // Get index statistics
    if (stats === 'true') {
      const indexStats = getPhotoIndexStats();
      return NextResponse.json({
        success: true,
        stats: indexStats
      });
    }

    // Search by specific term
    if (term) {
      const photos = getPhotosByTerm(term);
      return NextResponse.json({
        success: true,
        term,
        count: photos.length,
        examples: photos.slice(0, limit)
      });
    }

    // Search by query
    if (query) {
      const analysis = analyzeQueryForPhotos(query);
      return NextResponse.json({
        success: true,
        query,
        hasVisualIntent: analysis.hasVisualIntent,
        suggestedTerms: analysis.suggestedTerms,
        photoReferences: analysis.photoReferences
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Missing required parameter: q (query), term, or stats=true'
    }, { status: 400 });

  } catch (error) {
    console.error('Photo search API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, limit = 10 } = body;

    if (!query) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameter: query'
      }, { status: 400 });
    }

    const analysis = analyzeQueryForPhotos(query);

    return NextResponse.json({
      success: true,
      query,
      hasVisualIntent: analysis.hasVisualIntent,
      suggestedTerms: analysis.suggestedTerms,
      photoReferences: analysis.photoReferences.map(ref => ({
        term: ref.searchTerm,
        count: ref.totalFound,
        knowledgeBaseUrl: ref.knowledgeBaseUrl,
        examples: ref.examples.slice(0, limit)
      }))
    });

  } catch (error) {
    console.error('Photo search API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
