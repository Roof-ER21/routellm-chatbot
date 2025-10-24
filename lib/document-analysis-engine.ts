/**
 * Document Analysis Engine
 *
 * Orchestrates comprehensive document analysis by combining:
 * - Extracted text from documents
 * - User answers to contextual questions
 * - RAG search results for relevant codes/regulations
 * - Regulatory data from knowledge base
 * - Susan AI for intelligent analysis
 */

import { ProcessedDocument, documentProcessor } from './document-processor';
import { EstimateAnalysis, estimateParser } from './estimate-parser';
import { QuestionFlowState, questionGenerator } from './document-question-generator';
import { ragService } from './rag-service';
import DocumentIntelligence from './document-intelligence';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface AnalysisContext {
  documents: ProcessedDocument[];
  estimateAnalysis?: EstimateAnalysis;
  userAnswers: Record<string, any>;
  ragContext?: {
    chunks: any[];
    sources: string[];
  };
  metadata: {
    timestamp: string;
    sessionId?: string;
    userId?: string;
  };
}

export interface ComprehensiveAnalysis {
  success: boolean;
  timestamp: string;
  analysis: {
    summary: string;
    coverageOpinion: string;
    missingItems: Array<{
      item: string;
      reason: string;
      codeReference?: string;
      estimatedValue?: string;
      priority: 'HIGH' | 'MEDIUM' | 'LOW';
    }>;
    deniedItems: Array<{
      item: string;
      denialReason: string;
      counterArgument: string;
      codeSupport?: string;
      winProbability: 'HIGH' | 'MEDIUM' | 'LOW';
    }>;
    recommendations: string[];
    nextSteps: Array<{
      step: string;
      priority: number;
      deadline?: string;
    }>;
    regulatoryCitations: string[];
  };
  context: AnalysisContext;
  warnings: string[];
  error?: string;
}

// ============================================================================
// ANALYSIS ENGINE
// ============================================================================

export class DocumentAnalysisEngine {

  /**
   * Main analysis orchestration method
   */
  async analyzeDocuments(
    documents: ProcessedDocument[],
    questionFlow?: QuestionFlowState,
    options: {
      deploymentToken: string;
      deploymentId: string;
      sessionId?: string;
      userId?: string;
    } = {
      deploymentToken: process.env.ABACUS_DEPLOYMENT_TOKEN || '',
      deploymentId: process.env.ABACUS_DEPLOYMENT_ID || ''
    }
  ): Promise<ComprehensiveAnalysis> {

    console.log('[AnalysisEngine] Starting comprehensive analysis...');
    console.log('[AnalysisEngine] Documents:', documents.length);
    console.log('[AnalysisEngine] Question flow provided:', !!questionFlow);

    const startTime = Date.now();
    const warnings: string[] = [];

    try {
      // Step 1: Build analysis context
      const context = await this.buildAnalysisContext(documents, questionFlow);
      console.log('[AnalysisEngine] Context built');

      // Step 2: Perform RAG search for relevant regulations
      const ragContext = await this.performRAGSearch(context);
      context.ragContext = ragContext;
      console.log('[AnalysisEngine] RAG search completed -', ragContext.chunks.length, 'chunks');

      // Step 3: Parse estimates if present
      if (context.estimateAnalysis) {
        console.log('[AnalysisEngine] Estimate parsed -', context.estimateAnalysis.items.length, 'items');
        console.log('[AnalysisEngine] Missing code items:', context.estimateAnalysis.missingCodeItems.length);
      }

      // Step 4: Generate comprehensive prompt for Susan AI
      const prompt = this.buildAnalysisPrompt(context);
      console.log('[AnalysisEngine] Analysis prompt built - length:', prompt.length);

      // Step 5: Call Susan AI
      const aiResponse = await this.callSusanAI(prompt, options);
      console.log('[AnalysisEngine] Susan AI responded - length:', aiResponse.length);

      // Step 6: Parse and structure response
      const analysis = this.parseAIResponse(aiResponse, context);
      console.log('[AnalysisEngine] Response parsed and structured');

      // Add warnings
      if (context.estimateAnalysis && context.estimateAnalysis.warnings.length > 0) {
        warnings.push(...context.estimateAnalysis.warnings);
      }

      if (!ragContext || ragContext.chunks.length === 0) {
        warnings.push('No relevant building codes found in knowledge base');
      }

      const analysisTime = Date.now() - startTime;
      console.log('[AnalysisEngine] Analysis completed in', analysisTime, 'ms');

      return {
        success: true,
        timestamp: new Date().toISOString(),
        analysis,
        context,
        warnings
      };

    } catch (error: any) {
      console.error('[AnalysisEngine] Analysis error:', error);

      return {
        success: false,
        timestamp: new Date().toISOString(),
        analysis: {
          summary: `Analysis failed: ${error.message}`,
          coverageOpinion: '',
          missingItems: [],
          deniedItems: [],
          recommendations: [],
          nextSteps: [],
          regulatoryCitations: []
        },
        context: {
          documents,
          userAnswers: questionFlow?.answers || {},
          metadata: {
            timestamp: new Date().toISOString(),
            sessionId: options.sessionId,
            userId: options.userId
          }
        },
        warnings,
        error: error.message
      };
    }
  }

  // ============================================================================
  // CONTEXT BUILDING
  // ============================================================================

  /**
   * Build comprehensive analysis context
   */
  private async buildAnalysisContext(
    documents: ProcessedDocument[],
    questionFlow?: QuestionFlowState
  ): Promise<AnalysisContext> {

    const context: AnalysisContext = {
      documents,
      userAnswers: questionFlow?.answers || {},
      metadata: {
        timestamp: new Date().toISOString()
      }
    };

    // Parse estimate if present
    const estimateDocs = documents.filter(d =>
      d.extractedText.toLowerCase().includes('estimate') ||
      d.extractedText.toLowerCase().includes('line item') ||
      /\$\d+/.test(d.extractedText)
    );

    if (estimateDocs.length > 0) {
      const combinedEstimateText = estimateDocs
        .map(d => d.extractedText)
        .join('\n\n');

      context.estimateAnalysis = estimateParser.parseEstimate(combinedEstimateText);
    }

    return context;
  }

  /**
   * Perform RAG search for relevant building codes and regulations
   */
  private async performRAGSearch(context: AnalysisContext): Promise<{ chunks: any[]; sources: string[] }> {

    const queries: string[] = [];

    // Build search queries based on context
    if (context.estimateAnalysis) {
      // Search for missing code items
      for (const missingItem of context.estimateAnalysis.missingCodeItems.slice(0, 5)) {
        queries.push(`Florida building code requirement for ${missingItem}`);
      }

      // Search for damaged items
      for (const item of context.estimateAnalysis.items.slice(0, 3)) {
        if (item.description.toLowerCase().includes('damage') ||
            item.description.toLowerCase().includes('replace')) {
          queries.push(`Insurance coverage for ${item.description}`);
        }
      }
    }

    // Search based on user answers
    const damageType = context.userAnswers.damage_type;
    if (damageType) {
      const types = Array.isArray(damageType) ? damageType : [damageType];
      for (const type of types) {
        queries.push(`${type} damage roof insurance claim requirements`);
      }
    }

    // Search for property-specific regulations
    const roofType = context.userAnswers.roof_type;
    if (roofType) {
      queries.push(`Florida roofing code for ${roofType}`);
    }

    // If no specific queries, do general search
    if (queries.length === 0) {
      queries.push('Florida roofing insurance claim requirements');
      queries.push('Building code requirements for roof replacement');
    }

    console.log('[AnalysisEngine] RAG queries:', queries);

    // Perform RAG searches
    const allChunks: any[] = [];
    const allSources = new Set<string>();

    for (const query of queries) {
      try {
        const results = await ragService.search(query, 3, 0.7);

        allChunks.push(...results.chunks);

        for (const source of results.sources) {
          allSources.add(source);
        }
      } catch (error) {
        console.error('[AnalysisEngine] RAG search error for query:', query, error);
      }
    }

    // Deduplicate chunks by text content
    const uniqueChunks = Array.from(
      new Map(allChunks.map(c => [c.chunk.text, c])).values()
    );

    console.log('[AnalysisEngine] Found', uniqueChunks.length, 'unique relevant chunks');

    return {
      chunks: uniqueChunks,
      sources: Array.from(allSources)
    };
  }

  // ============================================================================
  // PROMPT BUILDING
  // ============================================================================

  /**
   * Build comprehensive analysis prompt for Susan AI
   */
  private buildAnalysisPrompt(context: AnalysisContext): string {
    const sections: string[] = [];

    // System context
    sections.push(`You are Susan AI, an expert insurance claim analyst specializing in roofing claims in Florida.`);
    sections.push(`You help contractors maximize legitimate insurance claims while maintaining strict ethical standards.`);
    sections.push(`\nIMPORTANT RULES:`);
    sections.push(`- NEVER discuss pricing or cost estimates unless explicitly asked`);
    sections.push(`- Focus on COVERAGE, CODE COMPLIANCE, and CLAIM ARGUMENTS`);
    sections.push(`- Cite specific Florida Building Code sections when applicable`);
    sections.push(`- Be honest about win probability for denied items\n`);

    // Document context
    sections.push(`\n=== DOCUMENTS PROVIDED ===`);
    for (const doc of context.documents) {
      if (doc.success && doc.extractedText) {
        sections.push(`\nDocument: ${doc.fileName} (${doc.fileType})`);
        sections.push(`Content:\n${doc.extractedText.substring(0, 3000)}`);
        if (doc.extractedText.length > 3000) {
          sections.push(`... (truncated for length)`);
        }
      }
    }

    // Estimate analysis
    if (context.estimateAnalysis) {
      sections.push(`\n=== ESTIMATE ANALYSIS ===`);
      sections.push(`Total Items: ${context.estimateAnalysis.items.length}`);
      sections.push(`Total Amount: $${context.estimateAnalysis.totalAmount || 'Unknown'}`);
      sections.push(`Parsing Confidence: ${(context.estimateAnalysis.confidence * 100).toFixed(0)}%`);

      if (context.estimateAnalysis.missingCodeItems.length > 0) {
        sections.push(`\nMissing Code-Required Items (${context.estimateAnalysis.missingCodeItems.length}):`);
        for (const item of context.estimateAnalysis.missingCodeItems.slice(0, 10)) {
          sections.push(`- ${item}`);
        }
      }

      if (context.estimateAnalysis.items.length > 0) {
        sections.push(`\nLine Items:`);
        for (const item of context.estimateAnalysis.items.slice(0, 15)) {
          sections.push(`- ${item.description} ${item.quantity ? `(${item.quantity} ${item.unit})` : ''} ${item.totalPrice ? `$${item.totalPrice}` : ''}`);
        }
      }
    }

    // User context
    if (Object.keys(context.userAnswers).length > 0) {
      sections.push(`\n=== CLAIM CONTEXT ===`);

      const contextMap: Record<string, string> = {
        storm_date: 'Storm/Damage Date',
        claim_filed: 'Claim Status',
        claim_number: 'Claim Number',
        policy_number: 'Policy Number',
        property_address: 'Property Address',
        damage_type: 'Damage Type',
        visible_damage: 'Visible Damage',
        insurance_company: 'Insurance Company',
        adjuster_assigned: 'Adjuster Status',
        adjuster_name: 'Adjuster Name',
        primary_goal: 'Primary Goal',
        urgency: 'Urgency Level'
      };

      for (const [key, label] of Object.entries(contextMap)) {
        if (context.userAnswers[key]) {
          const value = Array.isArray(context.userAnswers[key])
            ? context.userAnswers[key].join(', ')
            : context.userAnswers[key];
          sections.push(`${label}: ${value}`);
        }
      }
    }

    // RAG context (building codes and regulations)
    if (context.ragContext && context.ragContext.chunks.length > 0) {
      sections.push(`\n=== RELEVANT BUILDING CODES & REGULATIONS ===`);
      sections.push(`(Use these to support your analysis)\n`);

      for (let i = 0; i < Math.min(5, context.ragContext.chunks.length); i++) {
        const chunk = context.ragContext.chunks[i];
        const source = chunk.chunk.metadata?.source || 'Unknown';
        const score = (chunk.score * 100).toFixed(0);

        sections.push(`[${i + 1}] (Source: ${source}, Relevance: ${score}%)`);
        sections.push(chunk.chunk.text);
        sections.push('');
      }
    }

    // Analysis instructions
    sections.push(`\n=== YOUR ANALYSIS TASK ===`);
    sections.push(`Provide a comprehensive analysis in the following format:\n`);

    sections.push(`## SUMMARY`);
    sections.push(`Brief overview of the claim situation (2-3 sentences)\n`);

    sections.push(`## COVERAGE OPINION`);
    sections.push(`Your professional opinion on coverage for this claim, considering:`);
    sections.push(`- Type of damage and policy coverage`);
    sections.push(`- Building code requirements`);
    sections.push(`- Insurance industry standards`);
    sections.push(`- Florida-specific regulations\n`);

    sections.push(`## MISSING ITEMS`);
    sections.push(`Items that SHOULD be included but aren't in the estimate:`);
    sections.push(`For each item:`);
    sections.push(`- Item name`);
    sections.push(`- Why it's required (code/standard reference)`);
    sections.push(`- Priority (HIGH/MEDIUM/LOW)`);
    sections.push(`- Brief explanation\n`);

    if (context.documents.some(d => d.extractedText.toLowerCase().includes('denied'))) {
      sections.push(`## DENIED ITEMS ANALYSIS`);
      sections.push(`For each denied item:`);
      sections.push(`- Item and denial reason`);
      sections.push(`- Counter-argument with code support`);
      sections.push(`- Win probability (HIGH/MEDIUM/LOW)`);
      sections.push(`- Strategy for challenging denial\n`);
    }

    sections.push(`## RECOMMENDATIONS`);
    sections.push(`Strategic recommendations for maximizing this claim (5-7 specific recommendations)\n`);

    sections.push(`## NEXT STEPS`);
    sections.push(`Prioritized action items (numbered list with deadlines if applicable)\n`);

    sections.push(`## REGULATORY CITATIONS`);
    sections.push(`List specific code sections, regulations, or standards referenced in your analysis\n`);

    sections.push(`Be thorough, specific, and cite regulations when applicable.`);

    return sections.join('\n');
  }

  // ============================================================================
  // AI INTEGRATION
  // ============================================================================

  /**
   * Call Susan AI with the analysis prompt
   */
  private async callSusanAI(
    prompt: string,
    options: {
      deploymentToken: string;
      deploymentId: string;
    }
  ): Promise<string> {

    console.log('[AnalysisEngine] Calling Susan AI...');
    console.log('[AnalysisEngine] Prompt length:', prompt.length);

    const messages = [
      {
        is_user: false,
        text: 'You are Susan AI, an expert insurance claim analyst specializing in roofing claims.'
      },
      {
        is_user: true,
        text: prompt
      }
    ];

    try {
      const response = await fetch('https://api.abacus.ai/api/v0/getChatResponse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deploymentToken: options.deploymentToken,
          deploymentId: options.deploymentId,
          messages,
        }),
        signal: AbortSignal.timeout(60000) // 60s timeout for complex analysis
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Susan AI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      // Extract AI response
      if (data.result && data.result.messages && Array.isArray(data.result.messages)) {
        const assistantMessages = data.result.messages.filter((msg: any) => !msg.is_user);
        if (assistantMessages.length > 0) {
          const aiResponse = assistantMessages[assistantMessages.length - 1].text;
          console.log('[AnalysisEngine] Susan AI response length:', aiResponse.length);
          return aiResponse;
        }
      }

      throw new Error('Invalid response structure from Susan AI');

    } catch (error: any) {
      console.error('[AnalysisEngine] Susan AI error:', error);
      throw error;
    }
  }

  // ============================================================================
  // RESPONSE PARSING
  // ============================================================================

  /**
   * Parse Susan AI response into structured format
   */
  private parseAIResponse(
    response: string,
    context: AnalysisContext
  ): ComprehensiveAnalysis['analysis'] {

    console.log('[AnalysisEngine] Parsing AI response...');

    // Extract sections using regex patterns
    const summary = this.extractSection(response, /## SUMMARY\s*([\s\S]+?)(?=##|$)/i) ||
                   response.substring(0, 500);

    const coverageOpinion = this.extractSection(response, /## COVERAGE OPINION\s*([\s\S]+?)(?=##|$)/i) ||
                           'Coverage analysis not provided.';

    const missingItems = this.parseMissingItems(response);
    const deniedItems = this.parseDeniedItems(response);
    const recommendations = this.parseRecommendations(response);
    const nextSteps = this.parseNextSteps(response);
    const regulatoryCitations = this.parseCitations(response);

    console.log('[AnalysisEngine] Parsed:', {
      summaryLength: summary.length,
      coverageOpinionLength: coverageOpinion.length,
      missingItems: missingItems.length,
      deniedItems: deniedItems.length,
      recommendations: recommendations.length,
      nextSteps: nextSteps.length,
      citations: regulatoryCitations.length
    });

    return {
      summary,
      coverageOpinion,
      missingItems,
      deniedItems,
      recommendations,
      nextSteps,
      regulatoryCitations
    };
  }

  /**
   * Extract a section from response
   */
  private extractSection(text: string, pattern: RegExp): string {
    const match = text.match(pattern);
    return match ? match[1].trim() : '';
  }

  /**
   * Parse missing items section
   */
  private parseMissingItems(text: string): ComprehensiveAnalysis['analysis']['missingItems'] {
    const items: ComprehensiveAnalysis['analysis']['missingItems'] = [];

    const section = this.extractSection(text, /## MISSING ITEMS\s*([\s\S]+?)(?=##|$)/i);
    if (!section) return items;

    const lines = section.split('\n');
    let currentItem: any = null;

    for (const line of lines) {
      const trimmed = line.trim();

      // Check if line starts a new item (bullet or dash)
      if (/^[-•*]\s+/.test(trimmed)) {
        if (currentItem) {
          items.push(currentItem);
        }

        const itemText = trimmed.replace(/^[-•*]\s+/, '');

        // Try to extract priority
        let priority: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
        if (/\bHIGH\b/i.test(itemText)) priority = 'HIGH';
        if (/\bLOW\b/i.test(itemText)) priority = 'LOW';

        currentItem = {
          item: itemText,
          reason: '',
          priority
        };
      } else if (currentItem && trimmed) {
        // Add to reason
        currentItem.reason += ' ' + trimmed;
      }
    }

    if (currentItem) {
      items.push(currentItem);
    }

    return items;
  }

  /**
   * Parse denied items section
   */
  private parseDeniedItems(text: string): ComprehensiveAnalysis['analysis']['deniedItems'] {
    const items: ComprehensiveAnalysis['analysis']['deniedItems'] = [];

    const section = this.extractSection(text, /## DENIED ITEMS ANALYSIS\s*([\s\S]+?)(?=##|$)/i);
    if (!section) return items;

    const lines = section.split('\n');
    let currentItem: any = null;

    for (const line of lines) {
      const trimmed = line.trim();

      if (/^[-•*]\s+/.test(trimmed)) {
        if (currentItem) {
          items.push(currentItem);
        }

        const itemText = trimmed.replace(/^[-•*]\s+/, '');

        // Extract win probability
        let winProbability: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
        if (/\bHIGH\b/i.test(itemText)) winProbability = 'HIGH';
        if (/\bLOW\b/i.test(itemText)) winProbability = 'LOW';

        currentItem = {
          item: itemText,
          denialReason: '',
          counterArgument: '',
          winProbability
        };
      } else if (currentItem && trimmed) {
        if (!currentItem.denialReason) {
          currentItem.denialReason += trimmed + ' ';
        } else {
          currentItem.counterArgument += trimmed + ' ';
        }
      }
    }

    if (currentItem) {
      items.push(currentItem);
    }

    return items;
  }

  /**
   * Parse recommendations section
   */
  private parseRecommendations(text: string): string[] {
    const recommendations: string[] = [];

    const section = this.extractSection(text, /## RECOMMENDATIONS\s*([\s\S]+?)(?=##|$)/i);
    if (!section) return recommendations;

    const lines = section.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();

      if (/^[-•*\d]+[.)]\s+/.test(trimmed)) {
        const rec = trimmed.replace(/^[-•*\d]+[.)]\s+/, '').trim();
        if (rec.length > 10) {
          recommendations.push(rec);
        }
      }
    }

    return recommendations;
  }

  /**
   * Parse next steps section
   */
  private parseNextSteps(text: string): ComprehensiveAnalysis['analysis']['nextSteps'] {
    const steps: ComprehensiveAnalysis['analysis']['nextSteps'] = [];

    const section = this.extractSection(text, /## NEXT STEPS\s*([\s\S]+?)(?=##|$)/i);
    if (!section) return steps;

    const lines = section.split('\n');
    let priority = 1;

    for (const line of lines) {
      const trimmed = line.trim();

      if (/^[-•*\d]+[.)]\s+/.test(trimmed)) {
        const stepText = trimmed.replace(/^[-•*\d]+[.)]\s+/, '').trim();

        // Try to extract deadline
        const deadlineMatch = stepText.match(/by\s+(\d{1,2}\/\d{1,2}\/\d{2,4})/i);
        const deadline = deadlineMatch ? deadlineMatch[1] : undefined;

        if (stepText.length > 5) {
          steps.push({
            step: stepText,
            priority: priority++,
            deadline
          });
        }
      }
    }

    return steps;
  }

  /**
   * Parse regulatory citations section
   */
  private parseCitations(text: string): string[] {
    const citations: string[] = [];

    const section = this.extractSection(text, /## REGULATORY CITATIONS\s*([\s\S]+?)(?=##|$)/i);
    if (!section) return citations;

    const lines = section.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();

      if (/^[-•*\d]+[.)]\s+/.test(trimmed)) {
        const citation = trimmed.replace(/^[-•*\d]+[.)]\s+/, '').trim();
        if (citation.length > 5) {
          citations.push(citation);
        }
      }
    }

    return citations;
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const analysisEngine = new DocumentAnalysisEngine();
export default analysisEngine;
