/**
 * Document Question Answer API Endpoint
 *
 * POST /api/analyze-document/answer
 * - Receive answer to current question
 * - Update question flow state
 * - Return next question OR final analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { questionGenerator, QuestionFlowState } from '@/lib/document-question-generator';
import { analysisEngine } from '@/lib/document-analysis-engine';
import { ProcessedDocument } from '@/lib/document-processor';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface AnswerRequest {
  flowState: QuestionFlowState;
  questionId: string;
  answer: any;
  documents: ProcessedDocument[];
}

interface AnswerResponse {
  success: boolean;
  mode: 'next_question' | 'analysis';

  // Next question mode
  nextQuestion?: any;
  flowState?: QuestionFlowState;
  progress?: {
    current: number;
    total: number;
    percentage: number;
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

  warnings?: string[];
  error?: string;
}

// ============================================================================
// MAIN ENDPOINT
// ============================================================================

export async function POST(request: NextRequest) {
  console.log('[API] POST /api/analyze-document/answer - Processing answer...');

  try {
    const body: AnswerRequest = await request.json();

    const { flowState, questionId, answer, documents } = body;

    if (!flowState || !questionId || answer === undefined) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: flowState, questionId, or answer'
      }, { status: 400 });
    }

    console.log('[API] Question ID:', questionId);
    console.log('[API] Answer:', answer);
    console.log('[API] Current progress:', flowState.currentIndex, '/', flowState.questions.length);

    // Answer the question and get next state
    const result = questionGenerator.answerQuestion(flowState, questionId, answer);

    if (result.completed) {
      // All questions answered - perform comprehensive analysis
      console.log('[API] Questions complete, performing comprehensive analysis...');

      const deploymentToken = process.env.ABACUS_DEPLOYMENT_TOKEN;
      const deploymentId = process.env.ABACUS_DEPLOYMENT_ID;

      if (!deploymentToken || !deploymentId) {
        return NextResponse.json({
          success: false,
          error: 'Susan AI credentials not configured'
        }, { status: 500 });
      }

      const analysis = await analysisEngine.analyzeDocuments(
        documents,
        result.flow,
        { deploymentToken, deploymentId }
      );

      const response: AnswerResponse = {
        success: analysis.success,
        mode: 'analysis',
        analysis: analysis.analysis,
        warnings: analysis.warnings
      };

      return NextResponse.json(response);

    } else {
      // Return next question
      console.log('[API] Returning next question...');

      const response: AnswerResponse = {
        success: true,
        mode: 'next_question',
        nextQuestion: result.nextQuestion,
        flowState: result.flow,
        progress: {
          current: result.flow.currentIndex,
          total: result.flow.questions.length,
          percentage: Math.round((result.flow.currentIndex / result.flow.questions.length) * 100)
        }
      };

      return NextResponse.json(response);
    }

  } catch (error: any) {
    console.error('[API] Error in analyze-document/answer:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}
