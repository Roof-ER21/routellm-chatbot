/**
 * GPT-4 Vision OCR Engine
 *
 * Direct replacement for DeepSeek OCR using OpenAI GPT-4 Vision API
 * Can be used standalone or integrated with Langflow
 *
 * @version 1.0.0
 */

import { ProcessedDocument } from './document-processor';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface GPT4VisionOCRConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  detailLevel?: 'low' | 'high' | 'auto';
  includeCheckpoints?: boolean;
}

export interface GPT4VisionOCRResult {
  success: boolean;
  extractedText: string;
  confidence: number; // 0-100
  qualityMetrics: QualityMetrics;
  documentStructure: DocumentStructure;
  technicalTerms: TechnicalTerm[];
  checkpoints: Checkpoint[];
  processingTime: number;
  cost: number;
  error?: string;
}

export interface QualityMetrics {
  overallScore: number; // 0-100
  textCompleteness: number;
  structurePreservation: number;
  technicalAccuracy: number;
  readability: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  recommendedAction: string;
}

export interface DocumentStructure {
  hasHeaders: boolean;
  hasTables: boolean;
  hasLists: boolean;
  tableCount: number;
  listCount: number;
  paragraphCount: number;
}

export interface TechnicalTerm {
  term: string;
  category: 'roofing' | 'insurance' | 'building_code' | 'general';
  confidence: number;
}

export interface Checkpoint {
  checkpointNumber: number;
  checkpointName: string;
  passed: boolean;
  score: number;
  details: string;
}

// ============================================================================
// GPT-4 VISION OCR ENGINE
// ============================================================================

export class GPT4VisionOCREngine {
  private config: GPT4VisionOCRConfig;

  constructor(config: GPT4VisionOCRConfig) {
    this.config = {
      model: config.model || 'gpt-4o',  // Updated to current model
      maxTokens: config.maxTokens || 4096,
      temperature: config.temperature || 0.2,
      detailLevel: config.detailLevel || 'high',
      includeCheckpoints: config.includeCheckpoints !== false,
      ...config
    };

    if (!this.config.apiKey) {
      throw new Error('OpenAI API key is required');
    }
  }

  /**
   * Process document with GPT-4 Vision OCR
   */
  async processDocument(
    baseResult: ProcessedDocument,
    imageBuffer: Buffer
  ): Promise<GPT4VisionOCRResult> {
    const startTime = Date.now();

    console.log('[GPT4VisionOCR] Starting OCR processing...');
    console.log('[GPT4VisionOCR] Document:', baseResult.fileName);

    try {
      // Convert buffer to base64
      const base64Image = imageBuffer.toString('base64');
      const mimeType = this.detectMimeType(baseResult.fileName);

      // Create prompt for comprehensive OCR
      const prompt = this.createOCRPrompt();

      // Call OpenAI Vision API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${mimeType};base64,${base64Image}`,
                    detail: this.config.detailLevel
                  }
                }
              ]
            }
          ],
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      const extractedText = data.choices[0].message.content;

      console.log('[GPT4VisionOCR] Raw extraction complete');
      console.log('[GPT4VisionOCR] Extracted length:', extractedText.length, 'characters');

      // Calculate cost (GPT-4 Vision pricing)
      const cost = this.calculateCost(data.usage);

      // Analyze the extracted text
      const analysis = await this.analyzeExtractedText(extractedText, baseResult);

      const processingTime = Date.now() - startTime;

      const result: GPT4VisionOCRResult = {
        success: true,
        extractedText,
        confidence: analysis.confidence,
        qualityMetrics: analysis.qualityMetrics,
        documentStructure: analysis.documentStructure,
        technicalTerms: analysis.technicalTerms,
        checkpoints: this.config.includeCheckpoints
          ? await this.runCheckpoints(extractedText, baseResult)
          : [],
        processingTime,
        cost
      };

      console.log('[GPT4VisionOCR] Processing complete');
      console.log('[GPT4VisionOCR] - Confidence:', result.confidence.toFixed(1) + '%');
      console.log('[GPT4VisionOCR] - Quality:', result.qualityMetrics.overallScore.toFixed(1) + '%');
      console.log('[GPT4VisionOCR] - Cost: $' + cost.toFixed(4));

      return result;

    } catch (error: any) {
      console.error('[GPT4VisionOCR] Error:', error.message);

      return {
        success: false,
        extractedText: '',
        confidence: 0,
        qualityMetrics: this.getDefaultQualityMetrics(),
        documentStructure: this.getDefaultDocumentStructure(),
        technicalTerms: [],
        checkpoints: [],
        processingTime: Date.now() - startTime,
        cost: 0,
        error: error.message
      };
    }
  }

  /**
   * Create comprehensive OCR prompt
   */
  private createOCRPrompt(): string {
    return `You are a professional OCR system specialized in insurance and roofing documents.

Extract ALL text from this document with the following requirements:

1. PRESERVE EXACT FORMATTING:
   - Maintain all headers, bullet points, and numbering
   - Preserve table structures
   - Keep paragraph breaks
   - Maintain section divisions

2. TECHNICAL ACCURACY:
   - Preserve all technical terms exactly as written
   - Include all building codes (IRC, IBC, etc.)
   - Capture all insurance terminology precisely
   - Include all measurements, percentages, and numbers

3. COMPLETENESS:
   - Extract every word, including footnotes and small print
   - Include all headers and subheaders
   - Capture all table data
   - Don't skip any content

4. STRUCTURE MARKERS:
   - Mark tables with [TABLE START] and [TABLE END]
   - Mark lists with proper bullet points or numbers
   - Identify and mark key sections

OUTPUT FORMAT:
Return ONLY the extracted text. No commentary, no explanations, just the raw extracted content with formatting preserved.

Start extracting now:`;
  }

  /**
   * Analyze extracted text for quality and structure
   */
  private async analyzeExtractedText(
    text: string,
    baseResult: ProcessedDocument
  ): Promise<{
    confidence: number;
    qualityMetrics: QualityMetrics;
    documentStructure: DocumentStructure;
    technicalTerms: TechnicalTerm[];
  }> {
    // Analyze text length and completeness
    const hasSubstantialContent = text.length > 100;
    const hasStructure = /[#*-]|\n\n|\d+\./.test(text);
    const hasTechnicalTerms = /IRC|IBC|R\d+\.\d+|NRCA|shingle|roof|insurance|claim/i.test(text);

    // Calculate confidence based on content indicators
    let confidence = 50;
    if (hasSubstantialContent) confidence += 20;
    if (hasStructure) confidence += 15;
    if (hasTechnicalTerms) confidence += 15;

    // Analyze document structure
    const hasHeaders = /^#+ /m.test(text) || /^[A-Z\s]{5,}$/m.test(text);
    const hasTables = text.includes('[TABLE') || /\|.*\|.*\|/.test(text);
    const hasLists = /^[\*\-\d]+\.?\s/m.test(text);
    const tableCount = (text.match(/\[TABLE START\]/g) || []).length;
    const listCount = (text.match(/^[\*\-]/gm) || []).length;
    const paragraphCount = (text.match(/\n\n+/g) || []).length + 1;

    // Extract technical terms
    const technicalTerms = this.extractTechnicalTerms(text);

    // Calculate quality metrics
    const textCompleteness = Math.min(100, (text.length / 500) * 100);
    const structurePreservation = (hasHeaders ? 30 : 0) + (hasTables ? 30 : 0) + (hasLists ? 40 : 0);
    const technicalAccuracy = Math.min(100, technicalTerms.length * 10);
    const readability = text.length > 50 ? 85 : 50;
    const overallScore = (textCompleteness + structurePreservation + technicalAccuracy + readability) / 4;

    const qualityMetrics: QualityMetrics = {
      overallScore,
      textCompleteness,
      structurePreservation,
      technicalAccuracy,
      readability,
      confidenceLevel: overallScore > 80 ? 'high' : overallScore > 60 ? 'medium' : 'low',
      recommendedAction: overallScore > 70
        ? 'Accept and use for RAG system'
        : overallScore > 50
        ? 'Review and possibly enhance'
        : 'Consider manual review or reprocessing'
    };

    const documentStructure: DocumentStructure = {
      hasHeaders,
      hasTables,
      hasLists,
      tableCount,
      listCount,
      paragraphCount
    };

    return {
      confidence,
      qualityMetrics,
      documentStructure,
      technicalTerms
    };
  }

  /**
   * Extract technical terms from text
   */
  private extractTechnicalTerms(text: string): TechnicalTerm[] {
    const terms: TechnicalTerm[] = [];

    // Roofing terms
    const roofingPatterns = [
      /\b(shingle|roof|flashing|underlayment|deck|valley|ridge|hip|eave|gutter|soffit|fascia)\b/gi,
      /\b(NRCA|asphalt|composition|architectural|three-tab|starter)\b/gi
    ];

    // Insurance terms
    const insurancePatterns = [
      /\b(claim|coverage|deductible|premium|policy|adjuster|depreciation|RCV|ACV)\b/gi,
      /\b(matching|betterment|like kind and quality|scope of loss)\b/gi
    ];

    // Building codes
    const codePatterns = [
      /\b(IRC|IBC|R\d+\.\d+|R\d+|building code|code requirement)\b/gi
    ];

    // Extract matches
    roofingPatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      matches.forEach(term => {
        if (!terms.find(t => t.term.toLowerCase() === term.toLowerCase())) {
          terms.push({
            term,
            category: 'roofing',
            confidence: 85
          });
        }
      });
    });

    insurancePatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      matches.forEach(term => {
        if (!terms.find(t => t.term.toLowerCase() === term.toLowerCase())) {
          terms.push({
            term,
            category: 'insurance',
            confidence: 85
          });
        }
      });
    });

    codePatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      matches.forEach(term => {
        if (!terms.find(t => t.term.toLowerCase() === term.toLowerCase())) {
          terms.push({
            term,
            category: 'building_code',
            confidence: 90
          });
        }
      });
    });

    return terms.slice(0, 50); // Limit to top 50 terms
  }

  /**
   * Run 5-checkpoint validation (matching DeepSeek checkpoint system)
   */
  private async runCheckpoints(
    extractedText: string,
    baseResult: ProcessedDocument
  ): Promise<Checkpoint[]> {
    const checkpoints: Checkpoint[] = [];

    // Checkpoint 1: Image Quality / Extraction Completeness
    const cp1Score = Math.min(100, (extractedText.length / 500) * 100);
    checkpoints.push({
      checkpointNumber: 1,
      checkpointName: 'Extraction Completeness',
      passed: cp1Score >= 60,
      score: cp1Score,
      details: `Extracted ${extractedText.length} characters. ${cp1Score >= 60 ? 'Sufficient content extracted.' : 'Content may be incomplete.'}`
    });

    // Checkpoint 2: Text Extraction Quality
    const hasWords = extractedText.split(/\s+/).length > 20;
    const hasProperSentences = /[A-Z][a-z]+.*?\./s.test(extractedText);
    const cp2Score = (hasWords ? 50 : 0) + (hasProperSentences ? 50 : 0);
    checkpoints.push({
      checkpointNumber: 2,
      checkpointName: 'Text Extraction Quality',
      passed: cp2Score >= 60,
      score: cp2Score,
      details: `Text contains ${hasWords ? 'sufficient words' : 'few words'}. ${hasProperSentences ? 'Proper sentence structure detected.' : 'Structure unclear.'}`
    });

    // Checkpoint 3: Structure Preservation
    const hasStructure = /[#*-]|\n\n|\d+\./.test(extractedText);
    const hasTables = extractedText.includes('[TABLE') || /\|.*\|/.test(extractedText);
    const hasLists = /^[\*\-\d]+\.?\s/m.test(extractedText);
    const cp3Score = (hasStructure ? 40 : 0) + (hasTables ? 30 : 0) + (hasLists ? 30 : 0);
    checkpoints.push({
      checkpointNumber: 3,
      checkpointName: 'Structure Preservation',
      passed: cp3Score >= 60,
      score: cp3Score,
      details: `Structure: ${hasStructure ? '✓' : '✗'}, Tables: ${hasTables ? '✓' : '✗'}, Lists: ${hasLists ? '✓' : '✗'}`
    });

    // Checkpoint 4: Technical Accuracy
    const technicalTerms = this.extractTechnicalTerms(extractedText);
    const cp4Score = Math.min(100, technicalTerms.length * 8);
    checkpoints.push({
      checkpointNumber: 4,
      checkpointName: 'Technical Accuracy',
      passed: cp4Score >= 60,
      score: cp4Score,
      details: `Found ${technicalTerms.length} technical terms. ${cp4Score >= 60 ? 'Good domain terminology coverage.' : 'Limited technical terms detected.'}`
    });

    // Checkpoint 5: Cross-Reference / Completeness
    const hasReferences = /see|refer|section|page \d+|above|below/i.test(extractedText);
    const hasNumbers = /\d+/.test(extractedText);
    const hasCodes = /IRC|IBC|R\d+\.\d+/i.test(extractedText);
    const cp5Score = (hasReferences ? 33 : 0) + (hasNumbers ? 33 : 0) + (hasCodes ? 34 : 0);
    checkpoints.push({
      checkpointNumber: 5,
      checkpointName: 'Cross-Reference Validation',
      passed: cp5Score >= 60,
      score: cp5Score,
      details: `References: ${hasReferences ? '✓' : '✗'}, Numbers: ${hasNumbers ? '✓' : '✗'}, Codes: ${hasCodes ? '✓' : '✗'}`
    });

    return checkpoints;
  }

  /**
   * Calculate API cost based on token usage
   */
  private calculateCost(usage: any): number {
    if (!usage) return 0;

    // GPT-4 Vision pricing (as of 2025)
    // Input: $0.01 per 1K tokens
    // Output: $0.03 per 1K tokens
    const inputCost = (usage.prompt_tokens / 1000) * 0.01;
    const outputCost = (usage.completion_tokens / 1000) * 0.03;

    return inputCost + outputCost;
  }

  /**
   * Detect MIME type from filename
   */
  private detectMimeType(fileName: string): string {
    const ext = fileName.toLowerCase().split('.').pop();

    switch (ext) {
      case 'png': return 'image/png';
      case 'jpg':
      case 'jpeg': return 'image/jpeg';
      case 'gif': return 'image/gif';
      case 'webp': return 'image/webp';
      case 'pdf': return 'application/pdf';
      default: return 'image/png';
    }
  }

  /**
   * Get default quality metrics
   */
  private getDefaultQualityMetrics(): QualityMetrics {
    return {
      overallScore: 0,
      textCompleteness: 0,
      structurePreservation: 0,
      technicalAccuracy: 0,
      readability: 0,
      confidenceLevel: 'low',
      recommendedAction: 'Processing failed - manual review required'
    };
  }

  /**
   * Get default document structure
   */
  private getDefaultDocumentStructure(): DocumentStructure {
    return {
      hasHeaders: false,
      hasTables: false,
      hasLists: false,
      tableCount: 0,
      listCount: 0,
      paragraphCount: 0
    };
  }
}

// Export singleton instance
export const createGPT4VisionOCREngine = (apiKey: string) => {
  return new GPT4VisionOCREngine({ apiKey });
};
