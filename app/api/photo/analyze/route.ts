/**
 * Photo Analysis API Endpoint
 *
 * Analyzes a single roof photo for damage detection
 * Returns comprehensive damage assessment with severity scoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { photoIntelligence } from '@/lib/photo-intelligence';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds for Vercel Pro

export async function POST(request: NextRequest) {
  try {
    // Parse the multipart form data
    const formData = await request.formData();
    const photo = formData.get('photo') as File;

    if (!photo) {
      return NextResponse.json(
        { success: false, error: 'No photo provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!photo.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (photo.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'Image size must be less than 10MB' },
        { status: 400 }
      );
    }

    // Get optional context parameters
    const propertyAddress = formData.get('propertyAddress') as string || undefined;
    const claimDate = formData.get('claimDate') as string || undefined;
    const roofAge = formData.get('roofAge') as string;
    const hailSize = formData.get('hailSize') as string || undefined;

    // Convert file to buffer
    const bytes = await photo.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Build analysis context
    const context = {
      propertyAddress,
      claimDate,
      roof_age: roofAge ? parseInt(roofAge) : undefined,
      hail_size: hailSize,
      photoId: `photo_${Date.now()}`
    };

    console.log('[Photo Analyze API] Starting analysis with context:', context);

    // Analyze the photo
    const result = await photoIntelligence.analyzePhoto(buffer, context);

    console.log('[Photo Analyze API] Analysis complete:', {
      success: result.success,
      damage_detected: result.damage_detected,
      severity_score: result.severity?.score
    });

    return NextResponse.json(result, { status: 200 });

  } catch (error: any) {
    console.error('[Photo Analyze API] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'Photo Analysis API',
    version: '1.0.0',
    capabilities: [
      'Hail damage detection',
      'Wind damage detection',
      'Missing shingles detection',
      'Granule loss detection',
      'Flashing issues detection',
      'Age-related wear detection',
      'Severity scoring (1-10 scale)',
      'Code violation identification',
      'Professional assessment generation'
    ]
  });
}
