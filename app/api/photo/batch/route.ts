/**
 * Batch Photo Analysis API Endpoint
 *
 * Analyzes multiple roof photos and generates comprehensive assessment
 * Provides aggregated damage analysis across all photos
 */

import { NextRequest, NextResponse } from 'next/server';
import { photoIntelligence } from '@/lib/photo-intelligence';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for batch processing (Vercel Pro)

export async function POST(request: NextRequest) {
  try {
    // Parse the multipart form data
    const formData = await request.formData();

    // Get all photo files
    const photos: File[] = [];
    let photoIndex = 0;

    // Collect all photos (supports photo0, photo1, photo2, etc. or photos[])
    while (true) {
      const photo = formData.get(`photo${photoIndex}`) || formData.get(`photos[${photoIndex}]`);
      if (!photo || !(photo instanceof File)) break;
      photos.push(photo);
      photoIndex++;
    }

    // Also check for 'photos' field (array)
    const photosArray = formData.getAll('photos');
    if (photosArray.length > 0) {
      photosArray.forEach(photo => {
        if (photo instanceof File) {
          photos.push(photo);
        }
      });
    }

    if (photos.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No photos provided' },
        { status: 400 }
      );
    }

    // Validate photo count (max 20 photos)
    if (photos.length > 20) {
      return NextResponse.json(
        { success: false, error: 'Maximum 20 photos allowed per batch' },
        { status: 400 }
      );
    }

    // Validate all files
    for (const photo of photos) {
      if (!photo.type.startsWith('image/')) {
        return NextResponse.json(
          { success: false, error: `File ${photo.name} is not an image` },
          { status: 400 }
        );
      }

      if (photo.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: `Image ${photo.name} exceeds 10MB size limit` },
          { status: 400 }
        );
      }
    }

    // Get optional context parameters
    const propertyAddress = formData.get('propertyAddress') as string || undefined;
    const claimDate = formData.get('claimDate') as string || undefined;
    const roofAge = formData.get('roofAge') as string;
    const hailSize = formData.get('hailSize') as string || undefined;
    const documentedAngles = formData.get('documentedAngles') as string;

    // Convert all photos to buffers
    const photoBuffers: Buffer[] = [];
    for (const photo of photos) {
      const bytes = await photo.arrayBuffer();
      photoBuffers.push(Buffer.from(bytes));
    }

    // Build analysis context
    const context = {
      propertyAddress,
      claimDate,
      roof_age: roofAge ? parseInt(roofAge) : undefined,
      hail_size: hailSize,
      totalPhotos: photos.length,
      documented_angles: documentedAngles
        ? documentedAngles.split(',').map(s => s.trim())
        : undefined
    };

    console.log('[Photo Batch API] Starting batch analysis:', {
      photo_count: photos.length,
      context
    });

    // Analyze all photos
    const result = await photoIntelligence.analyzeBatch(photoBuffers, context);

    console.log('[Photo Batch API] Batch analysis complete:', {
      success: result.success,
      photos_analyzed: result.photos_analyzed,
      successful_analyses: result.successful_analyses,
      total_detections: result.total_detections,
      overall_severity: result.overall_severity
    });

    return NextResponse.json(result, { status: 200 });

  } catch (error: any) {
    console.error('[Photo Batch API] Error:', error);

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
    service: 'Batch Photo Analysis API',
    version: '1.0.0',
    max_photos: 20,
    capabilities: [
      'Multi-photo batch analysis',
      'Aggregated damage assessment',
      'Cross-photo pattern recognition',
      'Coverage completeness validation',
      'Comprehensive batch reporting'
    ]
  });
}
