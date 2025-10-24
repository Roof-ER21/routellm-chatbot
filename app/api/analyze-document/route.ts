/**
 * Document Analysis API Endpoint
 *
 * POST /api/analyze-document
 * - Accept multipart/form-data with files
 * - Process documents using enhanced pipeline
 * - Generate contextual questions OR immediate analysis
 * - Return structured response with RAG-enhanced analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { documentProcessor, ProcessedDocument } from '@/lib/document-processor';
import { estimateParser } from '@/lib/estimate-parser';
import { questionGenerator, QuestionFlowState } from '@/lib/document-question-generator';
import { analysisEngine } from '@/lib/document-analysis-engine';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface AnalysisResponse {
  success: boolean;
  mode: 'questions' | 'analysis';

  // Question mode
  questions?: {
    current?: any;
    flowState?: QuestionFlowState;
    progress: {
      current: number;
      total: number;
      percentage: number;
    };
  };

  // Analysis mode
  analysis?: {
    summary: string;
    coverageOpinion: string;
    missingItems: any[];
    deniedItems: any[];
    recommendations: string[];
    nextSteps: any[];
    regulatoryCitations: string[];
  };

  // Common
  documents?: ProcessedDocument[];
  estimateAnalysis?: any;
  warnings?: string[];
  error?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Determine if we should ask questions vs immediate analysis
 */
function shouldAskQuestions(
  documents: ProcessedDocument[],
  estimateAnalysis?: any
): boolean {
  // If we have a clear denial letter, analyze immediately
  const hasDenialLetter = documents.some(d =>
    d.extractedText.toLowerCase().includes('denied') &&
    d.extractedText.toLowerCase().includes('claim')
  );

  if (hasDenialLetter) {
    return false; // Immediate analysis
  }

  // If we have a complete estimate with many items, analyze immediately
  if (estimateAnalysis && estimateAnalysis.items.length > 10 && estimateAnalysis.confidence > 0.7) {
    return false;
  }

  // If we have photos only, ask questions
  const allPhotos = documents.every(d => d.fileType === 'image');
  if (allPhotos) {
    return true;
  }

  // If we have incomplete information, ask questions
  if (estimateAnalysis && estimateAnalysis.confidence < 0.5) {
    return true;
  }

  // Default: ask questions for better context
  return true;
}

// ============================================================================
// MAIN ENDPOINT - Initial Document Upload
// ============================================================================

export async function POST(request: NextRequest) {
  console.log('[API] POST /api/analyze-document - Starting document analysis...');

  try {
    // Parse multipart form data
    const formData = await request.formData();

    const files = formData.getAll('files') as File[];
    const mode = formData.get('mode') as string || 'auto'; // 'questions' | 'immediate' | 'auto'
    const goal = formData.get('goal') as string || undefined;

    console.log('[API] Received:', files.length, 'files');
    console.log('[API] Mode:', mode);
    console.log('[API] Goal:', goal);

    if (files.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No files provided'
      }, { status: 400 });
    }

    // Validate file sizes (max 10MB per file)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({
          success: false,
          error: `File "${file.name}" exceeds 10MB limit`
        }, { status: 400 });
      }
    }

    // Step 1: Process all documents
    console.log('[API] Processing documents...');
    const processedDocs: ProcessedDocument[] = [];

    for (const file of files) {
      try {
        const processed = await documentProcessor.processFile(file, file.name, file.type);
        processedDocs.push(processed);
      } catch (error: any) {
        console.error('[API] Error processing file:', file.name, error);
        processedDocs.push({
          fileName: file.name,
          fileType: 'unknown',
          fileSize: file.size,
          extractedText: '',
          metadata: {},
          processingTime: 0,
          success: false,
          error: error.message
        });
      }
    }

    console.log('[API] Processed', processedDocs.length, 'documents');
    const successfulDocs = processedDocs.filter(d => d.success);
    console.log('[API] Successful:', successfulDocs.length);

    if (successfulDocs.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Failed to process any documents',
        documents: processedDocs
      }, { status: 400 });
    }

    // Step 2: Parse estimates if present
    let estimateAnalysis = undefined;
    const estimateDocs = successfulDocs.filter(d =>
      d.extractedText.toLowerCase().includes('estimate') ||
      d.extractedText.toLowerCase().includes('line item') ||
      /\$\d+/.test(d.extractedText)
    );

    if (estimateDocs.length > 0) {
      console.log('[API] Found estimate documents, parsing...');
      const combinedText = estimateDocs.map(d => d.extractedText).join('\n\n');
      estimateAnalysis = estimateParser.parseEstimate(combinedText);
      console.log('[API] Estimate parsed:', estimateAnalysis.items.length, 'items');
    }

    // Step 3: Decide mode
    const shouldAsk = mode === 'questions' ||
      (mode === 'auto' && shouldAskQuestions(processedDocs, estimateAnalysis));

    console.log('[API] Should ask questions:', shouldAsk);

    if (shouldAsk) {
      // Generate contextual questions
      const questions = questionGenerator.generateQuestions(processedDocs, {
        goal: goal as any,
        missingCodeItems: estimateAnalysis?.missingCodeItems
      });

      const flowState = questionGenerator.createQuestionFlow(questions);

      const response: AnalysisResponse = {
        success: true,
        mode: 'questions',
        questions: {
          current: flowState.questions[0],
          flowState,
          progress: {
            current: 0,
            total: questions.length,
            percentage: 0
          }
        },
        documents: processedDocs,
        estimateAnalysis
      };

      return NextResponse.json(response);

    } else {
      // Immediate analysis mode
      console.log('[API] Performing immediate analysis...');

      const deploymentToken = process.env.ABACUS_DEPLOYMENT_TOKEN;
      const deploymentId = process.env.ABACUS_DEPLOYMENT_ID;

      if (!deploymentToken || !deploymentId) {
        return NextResponse.json({
          success: false,
          error: 'Susan AI credentials not configured'
        }, { status: 500 });
      }

      const analysis = await analysisEngine.analyzeDocuments(
        processedDocs,
        undefined,
        { deploymentToken, deploymentId }
      );

      const response: AnalysisResponse = {
        success: analysis.success,
        mode: 'analysis',
        analysis: analysis.analysis,
        documents: processedDocs,
        estimateAnalysis,
        warnings: analysis.warnings
      };

      return NextResponse.json(response);
    }

  } catch (error: any) {
    console.error('[API] Error in analyze-document:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}

// ============================================================================
// GET ENDPOINT - Health check
// ============================================================================

export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/analyze-document',
    methods: ['POST'],
    capabilities: {
      documentProcessing: true,
      estimateParsing: true,
      questionGeneration: true,
      ragSearch: true,
      susanAI: true
    },
    limits: {
      maxFileSize: '10MB',
      maxFiles: 20,
      supportedFormats: ['.pdf', '.docx', '.xlsx', '.txt', '.jpg', '.png']
    }
  });
}
