/**
 * Document Analyzer API Route
 *
 * Handles multi-file document analysis including:
 * - PDFs, Word docs, Excel files, Text files, Images
 * - Text extraction from all formats
 * - AI analysis via Abacus AI
 * - Insurance data extraction
 */

import { NextRequest, NextResponse } from 'next/server';
import { documentProcessor, abacusAnalyzer } from '@/lib/document-processor';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds max

export async function POST(request: NextRequest) {
  console.log('[Document Analyzer API] Received analysis request');

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

    console.log(`[Document Analyzer API] Processing ${fileEntries.length} file(s)`);

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

    console.log('[Document Analyzer API] Files validated, starting processing...');

    // Process all files
    const processedDocuments = await documentProcessor.processMultipleFiles(files);

    console.log('[Document Analyzer API] File processing complete');
    console.log(`[Document Analyzer API] Successfully processed: ${processedDocuments.filter(d => d.success).length}/${processedDocuments.length}`);

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

    console.log('[Document Analyzer API] Starting AI analysis...');

    // Analyze with Abacus AI
    const analysisResult = await abacusAnalyzer.analyzeDocuments(
      processedDocuments,
      deploymentToken,
      deploymentId
    );

    console.log('[Document Analyzer API] AI analysis complete');

    // Add context metadata if provided
    if (propertyAddress || claimDate || additionalNotes) {
      analysisResult.insuranceData = {
        ...analysisResult.insuranceData,
        propertyAddress: analysisResult.insuranceData.propertyAddress || propertyAddress,
        dateOfLoss: analysisResult.insuranceData.dateOfLoss || claimDate
      };
    }

    // Return comprehensive analysis
    return NextResponse.json({
      success: true,
      timestamp: analysisResult.timestamp,
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
          sheetNames: doc.metadata.sheetNames
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
        additionalNotes
      }
    });

  } catch (error: any) {
    console.error('[Document Analyzer API] ============ ERROR ============');
    console.error('[Document Analyzer API] Error message:', error.message);
    console.error('[Document Analyzer API] Error stack:', error.stack);
    console.error('[Document Analyzer API] =====================================');

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        timestamp: new Date().toISOString(),
        helpText: 'Make sure your documents contain readable text or are valid image files (PDF, Word, Excel, TXT, JPG, PNG, HEIC)'
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint - returns API info
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/analyze/documents',
    method: 'POST',
    description: 'Multi-format document analyzer for insurance claims',
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
        'additionalNotes (string) - Additional context'
      ]
    },
    limits: {
      maxFileSize: '10MB per file',
      maxFiles: 20,
      timeout: '60 seconds'
    },
    features: [
      'Text extraction from PDFs, Word, Excel, and text files',
      'Image analysis using Abacus AI vision',
      'Insurance data extraction (claim numbers, policy info, amounts)',
      'Comprehensive AI analysis of all documents',
      'Damage description detection',
      'Adjuster information extraction'
    ]
  });
}
