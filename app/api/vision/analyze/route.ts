/**
 * Vision Analysis API Endpoint
 *
 * Dedicated endpoint for heavy vision analysis operations
 * Uses cost-effective Hugging Face Inference API
 * Separated from main chat to prevent blocking
 *
 * COST: FREE tier (30K requests/month) or $0.00006 per request
 * MODELS: BLIP, DETR, ViT from Hugging Face
 */

import { NextRequest, NextResponse } from 'next/server';
import { getVisionService } from '@/lib/vision-service';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds for complex analysis

/**
 * POST /api/vision/analyze
 *
 * Analyzes a single image for roofing damage or general content
 *
 * Request:
 * - Content-Type: multipart/form-data
 * - Body: { image: File, context?: string }
 *
 * Response:
 * - 200: { success: true, analysis: VisionAnalysisResult }
 * - 400: { success: false, error: string }
 * - 500: { success: false, error: string }
 */
export async function POST(request: NextRequest) {
  console.log('[Vision Analysis API] Received analysis request');

  try {
    // Get vision service
    const visionService = getVisionService();

    if (!visionService) {
      return NextResponse.json(
        {
          success: false,
          error: 'Vision service not configured. Please set HUGGINGFACE_API_KEY environment variable.',
          setup_instructions: 'Get your free API key at https://huggingface.co/settings/tokens'
        },
        { status: 503 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const image = formData.get('image') as File;
    const context = formData.get('context') as string || undefined;

    // Validate image
    if (!image) {
      return NextResponse.json(
        {
          success: false,
          error: 'No image provided. Please upload an image file.'
        },
        { status: 400 }
      );
    }

    // Validate file type
    if (!image.type.startsWith('image/')) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid file type: ${image.type}. Please upload an image (JPEG, PNG, etc.)`
        },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (image.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        {
          success: false,
          error: 'Image size exceeds 10MB limit. Please upload a smaller image.'
        },
        { status: 400 }
      );
    }

    console.log('[Vision Analysis API] Processing image:', {
      name: image.name,
      type: image.type,
      size: `${(image.size / 1024).toFixed(2)} KB`,
      context: context || 'none'
    });

    // Convert to buffer
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Analyze image
    const startTime = Date.now();
    const analysis = await visionService.analyzeRoofImage(buffer);
    const totalTime = Date.now() - startTime;

    console.log('[Vision Analysis API] Analysis complete:', {
      success: analysis.success,
      is_roof: analysis.is_roof_image,
      confidence: analysis.confidence,
      damage_indicators: analysis.damage_indicators?.length || 0,
      processing_time: `${totalTime}ms`,
      model_used: analysis.model_used
    });

    // Return analysis result
    return NextResponse.json({
      success: analysis.success,
      timestamp: analysis.timestamp,
      image_info: {
        name: image.name,
        size_bytes: image.size,
        type: image.type
      },
      analysis: {
        description: analysis.description,
        confidence: analysis.confidence,
        is_roof_image: analysis.is_roof_image,
        damage_indicators: analysis.damage_indicators,
        materials_detected: analysis.materials_detected,
        objects: analysis.objects,
        model_used: analysis.model_used,
        processing_time_ms: analysis.processing_time_ms,
        fallback_used: analysis.fallback_used
      },
      error: analysis.error,
      context: context
    }, { status: analysis.success ? 200 : 400 });

  } catch (error: any) {
    console.error('[Vision Analysis API] Error:', error);

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

/**
 * GET /api/vision/analyze
 *
 * Returns API information and status
 */
export async function GET() {
  const visionService = getVisionService();
  const isConfigured = visionService !== null;

  return NextResponse.json({
    service: 'Vision Analysis API',
    version: '1.0.0',
    status: isConfigured ? 'operational' : 'not_configured',
    provider: 'Hugging Face Inference API',
    pricing: {
      free_tier: '30,000 requests per month',
      paid_tier: '$0.00006 per request (~$6 per 100K images)',
      comparison: {
        anthropic_vision: '$0.015 per image (250x more expensive)',
        openai_vision: '$0.01 per image (167x more expensive)',
        huggingface: '$0.00006 per image (baseline)'
      }
    },
    models: {
      image_captioning: 'Salesforce/blip-image-captioning-large',
      object_detection: 'facebook/detr-resnet-50',
      image_classification: 'google/vit-base-patch16-224'
    },
    capabilities: [
      'General image understanding',
      'Roof damage detection',
      'Object detection',
      'Material identification',
      'Damage indicator extraction',
      'Roofing validation (no dog photos!)'
    ],
    configuration: {
      required_env_vars: ['HUGGINGFACE_API_KEY'],
      configured: isConfigured,
      setup_url: 'https://huggingface.co/settings/tokens'
    },
    usage: {
      endpoint: '/api/vision/analyze',
      method: 'POST',
      content_type: 'multipart/form-data',
      parameters: {
        image: 'File (required) - Image file to analyze',
        context: 'string (optional) - Additional context for analysis'
      }
    },
    limits: {
      max_file_size: '10MB',
      max_duration: '60 seconds',
      supported_formats: ['JPEG', 'PNG', 'WebP', 'HEIC']
    }
  });
}
