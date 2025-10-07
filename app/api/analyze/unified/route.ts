/**
 * Unified Document Analysis API Endpoint
 *
 * Handles analysis of multiple file types:
 * - PDFs (denial letters, estimates, documents)
 * - Images (damage photos, screenshots)
 * - Word documents
 * - Excel spreadsheets
 *
 * Analysis types:
 * - smart: Auto-detect document type
 * - denial_letter: Denial letter review
 * - estimate_comparison: Compare estimates
 * - email_analysis: Email/letter analysis
 * - claims_package: Full package analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { documentProcessor, abacusAnalyzer } from '@/lib/document-processor';
import DocumentIntelligence from '@/lib/document-intelligence';

export const maxDuration = 60; // 60 seconds timeout

export async function POST(request: NextRequest) {
  console.log('[UnifiedAnalyzer] Starting unified analysis...');

  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const analysisType = formData.get('analysisType') as string || 'smart';

    console.log('[UnifiedAnalyzer] Files received:', files.length);
    console.log('[UnifiedAnalyzer] Analysis type:', analysisType);

    // Validation
    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files provided' },
        { status: 400 }
      );
    }

    if (files.length > 20) {
      return NextResponse.json(
        { success: false, error: 'Maximum 20 files allowed' },
        { status: 400 }
      );
    }

    // Check file sizes
    const oversizedFiles = files.filter(f => f.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Files exceed 10MB limit: ${oversizedFiles.map(f => f.name).join(', ')}`
        },
        { status: 400 }
      );
    }

    // Process all files
    console.log('[UnifiedAnalyzer] Processing files...');
    const processedDocs = await Promise.all(
      files.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        return await documentProcessor.processFile(buffer, file.name, file.type);
      })
    );

    console.log('[UnifiedAnalyzer] Documents processed:', processedDocs.length);
    console.log('[UnifiedAnalyzer] Success count:', processedDocs.filter(d => d.success).length);

    // Log detailed processing results
    processedDocs.forEach(doc => {
      console.log(`[UnifiedAnalyzer] ${doc.fileName}:`, {
        success: doc.success,
        type: doc.fileType,
        textLength: doc.extractedText?.length || 0,
        textPreview: doc.extractedText?.substring(0, 100) || '(empty)',
        error: doc.error || 'none'
      });
    });

    // Check if any files were successfully processed
    const successfulDocs = processedDocs.filter(doc => doc.success);
    if (successfulDocs.length === 0) {
      const errors = processedDocs.map(d => `${d.fileName}: ${d.error}`).join('\n');
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to process any files',
          details: errors,
          help: 'If uploading PDFs, try copying the text and pasting it directly, or upload as images instead.'
        },
        { status: 500 }
      );
    }

    // Check if we extracted ANY text
    const totalTextLength = successfulDocs.reduce((sum, doc) => sum + (doc.extractedText?.length || 0), 0);
    if (totalTextLength === 0) {
      console.log('[UnifiedAnalyzer] WARNING: No text extracted from any documents!');
      const fileInfo = successfulDocs.map(d => `${d.fileName} (${d.fileType})`).join(', ');
      return NextResponse.json(
        {
          success: false,
          error: 'No text could be extracted from the uploaded files',
          details: `Processed files: ${fileInfo}`,
          help: 'PDFs may not work in this environment. Try: 1) Copy/paste the PDF text directly, or 2) Upload as images/screenshots'
        },
        { status: 500 }
      );
    }

    // Get Abacus AI credentials
    const deploymentToken = process.env.DEPLOYMENT_TOKEN;
    const deploymentId = process.env.ABACUS_DEPLOYMENT_ID || '6a1d18f38';

    if (!deploymentToken) {
      return NextResponse.json(
        { success: false, error: 'Abacus AI not configured' },
        { status: 500 }
      );
    }

    // Build appropriate prompt based on analysis type
    let analysisPrompt = '';
    const extractedTexts = successfulDocs.map(doc => doc.extractedText).filter(t => t.length > 0);

    console.log('[UnifiedAnalyzer] Extracted texts count:', extractedTexts.length);
    console.log('[UnifiedAnalyzer] Total extracted text length:', extractedTexts.reduce((sum, t) => sum + t.length, 0));

    switch (analysisType) {
      case 'denial_letter':
        analysisPrompt = DocumentIntelligence.getDenialLetterPrompt(extractedTexts.join('\n\n'));
        break;

      case 'estimate_comparison':
        analysisPrompt = DocumentIntelligence.getEstimateComparisonPrompt(extractedTexts);
        break;

      case 'email_analysis':
        analysisPrompt = DocumentIntelligence.getEmailAnalysisPrompt(extractedTexts.join('\n\n'));
        break;

      case 'claims_package':
        const docsWithMeta = successfulDocs.map(doc => ({
          fileName: doc.fileName,
          text: doc.extractedText,
          type: doc.fileType
        }));
        analysisPrompt = DocumentIntelligence.getClaimsPackagePrompt(docsWithMeta);
        break;

      case 'smart':
      default:
        const smartDocs = successfulDocs.map(doc => ({
          fileName: doc.fileName,
          text: doc.extractedText,
          type: doc.fileType
        }));
        analysisPrompt = DocumentIntelligence.getSmartAnalysisPrompt(smartDocs);
        break;
    }

    console.log('[UnifiedAnalyzer] Prompt generated, length:', analysisPrompt.length);

    // Call Abacus AI
    console.log('[UnifiedAnalyzer] Calling Abacus AI...');
    const messages = [
      {
        is_user: false,
        text: 'You are Susan AI-21, an expert insurance claim analyst specializing in roofing insurance claims. You provide detailed, actionable analysis with specific dollar amounts and strategic recommendations.'
      },
      {
        is_user: true,
        text: analysisPrompt
      }
    ];

    const response = await fetch('https://api.abacus.ai/api/v0/getChatResponse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        deploymentToken,
        deploymentId,
        messages,
      }),
    });

    if (!response.ok) {
      throw new Error(`Abacus AI error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[UnifiedAnalyzer] Abacus AI response received');

    // Extract AI response
    let aiResponse = '';
    if (data.result && data.result.messages && Array.isArray(data.result.messages)) {
      const assistantMessages = data.result.messages.filter((msg: any) => !msg.is_user);
      if (assistantMessages.length > 0) {
        aiResponse = assistantMessages[assistantMessages.length - 1].text;
      }
    }

    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    console.log('[UnifiedAnalyzer] AI response length:', aiResponse.length);

    // Extract metadata from documents (needed for full approval detection)
    const combinedText = extractedTexts.join('\n\n');

    // Detect full approval in AI response
    const fullApprovalKeywords = [
      'full approval', 'fully approved', 'total approval', 'complete approval',
      'approved the whole', 'approved everything', 'approved full', 'everything was approved',
      'claim approved in full', 'approved in its entirety'
    ];

    const isFullApproval = fullApprovalKeywords.some(keyword =>
      aiResponse.toLowerCase().includes(keyword) || combinedText.toLowerCase().includes(keyword)
    );

    // Format response for chat
    let formattedResponse = DocumentIntelligence.formatForChat(analysisType, aiResponse);

    // Add full approval phone script if detected
    if (isFullApproval) {
      formattedResponse += `\n\n${'='.repeat(60)}\n`;
      formattedResponse += `🎉 FULL APPROVAL DETECTED - PHONE CALL SCRIPT\n`;
      formattedResponse += `${'='.repeat(60)}\n\n`;
      formattedResponse += `This claim has been FULLY APPROVED! Use this script to close the deal:\n\n`;
      formattedResponse += `📞 STEP 1: CONGRATULATE & CONFIRM\n`;
      formattedResponse += `"Great news! [Insurance Company] fully approved your claim for $[AMOUNT]."\n`;
      formattedResponse += `Confirm this matches their expectations.\n\n`;

      formattedResponse += `💰 STEP 2: EXPLAIN PAYMENT STRUCTURE\n`;
      formattedResponse += `"You'll receive $[ACV] (Actual Cash Value) to start, then $[DEPRECIATION]\n`;
      formattedResponse += `after completion. Your $[DEDUCTIBLE] deductible is subtracted from first check."\n\n`;

      formattedResponse += `📅 STEP 3: SCHEDULE IMMEDIATELY\n`;
      formattedResponse += `"Let me get you on our schedule. Next available: [DATE].\n`;
      formattedResponse += `Project takes approximately [DURATION] to complete."\n\n`;

      formattedResponse += `📝 STEP 4: CONTRACT & DEPOSIT (CRITICAL!)\n`;
      formattedResponse += `"I'll send the contract today. We need $[DEPOSIT] to secure your spot.\n`;
      formattedResponse += `Payment via check, credit card, or bank transfer."\n\n`;

      formattedResponse += `📄 STEP 5: DOCUMENTS NEEDED\n`;
      formattedResponse += `"Please send: (1) Signed contract, (2) Copy of insurance check (both sides),\n`;
      formattedResponse += `(3) Proof of homeownership. Deadline: [DATE]"\n\n`;

      formattedResponse += `✅ STEP 6: SET EXPECTATIONS\n`;
      formattedResponse += `Walk through: installation process, material selections, HOA requirements,\n`;
      formattedResponse += `timeline, and completion date.\n\n`;

      formattedResponse += `🤝 STEP 7: CLOSE & COMMIT\n`;
      formattedResponse += `"Any questions? Can I count on you moving forward with The Roof Docs?"\n`;
      formattedResponse += `Get verbal commitment. Confirm next steps.\n\n`;

      formattedResponse += `🎯 KEY GOALS:\n`;
      formattedResponse += `✓ Secure signed contract within 24-48 hours\n`;
      formattedResponse += `✓ Collect deposit to lock in project\n`;
      formattedResponse += `✓ Schedule installation date\n`;
      formattedResponse += `✓ Build excitement and confidence\n\n`;

      formattedResponse += `⚠️ FOLLOW UP: If no signature same day, call/text immediately!\n`;
    }

    // Extract metadata from documents
    const claimNumbers = DocumentIntelligence.extractClaimNumbers(combinedText);
    const dollarAmounts = DocumentIntelligence.extractDollarAmounts(combinedText);
    const dates = DocumentIntelligence.extractDates(combinedText);

    // Build response
    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      analysisType,
      filesProcessed: successfulDocs.length,
      filesTotal: files.length,
      formattedResponse,
      metadata: {
        claimNumber: claimNumbers.claim,
        policyNumber: claimNumbers.policy,
        dollarAmounts: dollarAmounts.slice(0, 10), // First 10 amounts
        dates: dates.slice(0, 10), // First 10 dates
        documentTypes: successfulDocs.map(d => d.fileType),
        fileNames: successfulDocs.map(d => d.fileName)
      },
      rawAnalysis: aiResponse
    };

    console.log('[UnifiedAnalyzer] Analysis complete');
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('[UnifiedAnalyzer] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Analysis failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
