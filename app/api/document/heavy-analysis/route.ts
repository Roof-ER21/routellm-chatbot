/**
 * Heavy Document Analysis API Endpoint
 *
 * Dedicated endpoint for intensive document processing operations
 * Separated from main chat API to prevent blocking
 * Uses queuing and async processing for large document sets
 *
 * Features:
 * - Multi-document batch processing
 * - OCR for image-based PDFs
 * - Vision analysis for document images
 * - Structured data extraction
 * - AI-powered insights
 */

import { NextRequest, NextResponse } from 'next/server';
import { documentProcessor, abacusAnalyzer } from '@/lib/document-processor';
import { getVisionService } from '@/lib/vision-service';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds for heavy processing

/**
 * POST /api/document/heavy-analysis
 *
 * Comprehensive document analysis with vision support
 * Handles multiple files concurrently
 */
export async function POST(request: NextRequest) {
  console.log('[Heavy Document Analysis API] Received analysis request');

  const startTime = Date.now();

  try {
    // Parse form data
    const formData = await request.formData();

    // Extract files
    const files: Array<{ file: File; fileName: string; mimeType: string }> = [];
    const fileEntries = Array.from(formData.entries()).filter(([key]) => key.startsWith('file'));

    if (fileEntries.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No files provided'
        },
        { status: 400 }
      );
    }

    console.log(`[Heavy Document Analysis API] Processing ${fileEntries.length} file(s)`);

    // Validate and collect files
    for (const [key, value] of fileEntries) {
      if (value instanceof File) {
        const file = value as File;

        // Validate file size (max 10MB per file)
        if (file.size > 10 * 1024 * 1024) {
          return NextResponse.json(
            {
              success: false,
              error: `File ${file.name} exceeds 10MB limit`
            },
            { status: 400 }
          );
        }

        // Check if file type is supported
        if (!documentProcessor.isSupportedFileType(file.name, file.type)) {
          return NextResponse.json(
            {
              success: false,
              error: `Unsupported file type: ${file.name}`
            },
            { status: 400 }
          );
        }

        files.push({
          file,
          fileName: file.name,
          mimeType: file.type
        });
      }
    }

    // Extract optional metadata
    const propertyAddress = formData.get('propertyAddress') as string || undefined;
    const claimDate = formData.get('claimDate') as string || undefined;
    const additionalNotes = formData.get('additionalNotes') as string || undefined;
    const useVision = formData.get('useVision') === 'true'; // Enable vision analysis

    console.log('[Heavy Document Analysis API] Files validated, starting processing...');
    console.log('[Heavy Document Analysis API] Vision analysis:', useVision ? 'enabled' : 'disabled');

    // Process all files
    const processedDocuments = await documentProcessor.processMultipleFiles(files);

    console.log('[Heavy Document Analysis API] File processing complete');
    console.log(`[Heavy Document Analysis API] Successfully processed: ${processedDocuments.filter(d => d.success).length}/${processedDocuments.length}`);

    // Enhanced vision analysis for images
    if (useVision) {
      const visionService = getVisionService();

      if (visionService) {
        console.log('[Heavy Document Analysis API] Running enhanced vision analysis...');

        // Analyze image documents with vision AI
        for (const doc of processedDocuments) {
          if (doc.fileType === 'image' && doc.success) {
            try {
              // Get image buffer
              const fileObj = files.find(f => f.fileName === doc.fileName);
              if (fileObj) {
                const buffer = Buffer.from(await fileObj.file.arrayBuffer());
                const visionResult = await visionService.analyzeRoofImage(buffer);

                // Add vision analysis to document
                doc.extractedText = visionResult.description;
                doc.metadata.visionAnalysis = {
                  confidence: visionResult.confidence,
                  is_roof: visionResult.is_roof_image,
                  damage_indicators: visionResult.damage_indicators,
                  materials: visionResult.materials_detected,
                  objects: visionResult.objects
                };

                console.log(`[Heavy Document Analysis API] Vision analysis for ${doc.fileName}:`, {
                  is_roof: visionResult.is_roof_image,
                  damage_count: visionResult.damage_indicators?.length || 0
                });
              }
            } catch (visionError: any) {
              console.warn(`[Heavy Document Analysis API] Vision analysis failed for ${doc.fileName}:`, visionError.message);
              // Continue without vision - not critical
            }
          }
        }
      } else {
        console.log('[Heavy Document Analysis API] Vision service not configured, skipping vision analysis');
      }
    }

    // Get API credentials
    const deploymentToken = process.env.DEPLOYMENT_TOKEN;
    const deploymentId = process.env.ABACUS_DEPLOYMENT_ID || '6a1d18f38';

    if (!deploymentToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'Abacus AI deployment token not configured'
        },
        { status: 500 }
      );
    }

    console.log('[Heavy Document Analysis API] Starting AI analysis...');

    // Analyze with Abacus AI
    const analysisResult = await abacusAnalyzer.analyzeDocuments(
      processedDocuments,
      deploymentToken,
      deploymentId
    );

    console.log('[Heavy Document Analysis API] AI analysis complete');

    // Add context metadata if provided
    if (propertyAddress || claimDate || additionalNotes) {
      analysisResult.insuranceData = {
        ...analysisResult.insuranceData,
        propertyAddress: analysisResult.insuranceData.propertyAddress || propertyAddress,
        dateOfLoss: analysisResult.insuranceData.dateOfLoss || claimDate
      };
    }

    const totalTime = Date.now() - startTime;

    // Return comprehensive analysis
    return NextResponse.json({
      success: true,
      timestamp: analysisResult.timestamp,
      processing_time_ms: totalTime,
      documentsProcessed: analysisResult.documentsProcessed,
      successfulProcessing: processedDocuments.filter(d => d.success).length,
      totalSize: analysisResult.totalSize,

      // Processed documents with previews
      documents: processedDocuments.map(doc => ({
        fileName: doc.fileName,
        fileType: doc.fileType,
        fileSize: doc.fileSize,
        preview: doc.preview,
        success: doc.success,
        error: doc.error,
        metadata: {
          pageCount: doc.metadata.pageCount,
          wordCount: doc.metadata.wordCount,
          sheetNames: doc.metadata.sheetNames,
          visionAnalysis: doc.metadata.visionAnalysis // Include vision results
        },
        processingTime: doc.processingTime
      })),

      // Extracted insurance data
      insuranceData: analysisResult.insuranceData,

      // AI analysis
      analysis: analysisResult.analysis,

      // Combined extracted text (for debugging/export)
      combinedText: analysisResult.combinedText,

      // Metadata
      metadata: {
        propertyAddress,
        claimDate,
        additionalNotes,
        visionAnalysisUsed: useVision
      },

      // Performance metrics
      performance: {
        total_time_ms: totalTime,
        avg_time_per_doc_ms: Math.round(totalTime / files.length),
        vision_analysis_used: useVision
      }
    });

  } catch (error: any) {
    console.error('[Heavy Document Analysis API] Error:', error);

    const totalTime = Date.now() - startTime;

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
        timestamp: new Date().toISOString(),
        processing_time_ms: totalTime
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/document/heavy-analysis
 *
 * Returns API info and capabilities
 */
export async function GET() {
  const visionService = getVisionService();
  const visionEnabled = visionService !== null;

  return NextResponse.json({
    endpoint: '/api/document/heavy-analysis',
    method: 'POST',
    description: 'Heavy document analysis with vision support - separated from main chat',
    status: 'operational',

    features: [
      'Multi-format document processing (PDF, Word, Excel, Text)',
      'Image analysis with vision AI (if enabled)',
      'Insurance data extraction',
      'AI-powered insights',
      'Batch processing support',
      'Async operation (no chat blocking)'
    ],

    supportedFormats: {
      documents: ['PDF', 'Word (.docx, .doc)', 'Excel (.xlsx, .xls)', 'Text (.txt)'],
      images: ['JPEG', 'PNG', 'HEIC', 'HEIF', 'WebP']
    },

    parameters: {
      required: [
        'file0, file1, ... (multipart/form-data) - Document/image files'
      ],
      optional: [
        'propertyAddress (string) - Property address',
        'claimDate (string) - Date of claim/loss',
        'additionalNotes (string) - Additional context',
        'useVision (boolean) - Enable vision analysis for images'
      ]
    },

    limits: {
      maxFileSize: '10MB per file',
      maxFiles: 20,
      timeout: '60 seconds'
    },

    vision: {
      enabled: visionEnabled,
      provider: visionEnabled ? 'Hugging Face' : 'Not configured',
      cost: visionEnabled ? 'FREE (30K/month) or $0.00006 per image' : 'N/A',
      setup: visionEnabled ? 'Configured' : 'Set HUGGINGFACE_API_KEY to enable'
    },

    performance: {
      avg_processing_time: '2-5 seconds per document',
      concurrent_processing: 'Yes',
      blocks_main_chat: 'No - separate endpoint'
    }
  });
}
