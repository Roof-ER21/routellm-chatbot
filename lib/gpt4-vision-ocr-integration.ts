/**
 * GPT-4 Vision OCR Integration Layer
 *
 * Replaces DeepSeek with GPT-4 Vision OCR
 * Compatible with existing document processing pipeline
 *
 * @version 1.0.0
 */

import { DocumentProcessor, ProcessedDocument } from './document-processor';
import { GPT4VisionOCREngine, GPT4VisionOCRResult } from './gpt4-vision-ocr-engine';
import { DeepSeekDocumentPreprocessor, PreprocessingResult } from './deepseek-document-preprocessor';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface OCRIntegrationConfig {
  useGPT4Vision: boolean;
  useTesseractFallback: boolean;
  enablePreprocessing: boolean;
  enableCaching: boolean;
  batchSize: number;
  minConfidenceThreshold: number;
  openaiApiKey?: string;
}

export interface EnhancedOCRResult extends ProcessedDocument {
  gpt4VisionResult?: GPT4VisionOCRResult;
  preprocessingResult?: PreprocessingResult;
  usedGPT4Vision: boolean;
  usedTesseract: boolean;
  cached: boolean;
  costEstimate?: CostEstimate;
}

export interface CostEstimate {
  apiCalls: number;
  estimatedTokens: number;
  estimatedCost: number;
  processingTime: number;
}

export interface BatchProcessingReport {
  totalDocuments: number;
  successfulDocuments: number;
  failedDocuments: number;
  documentsWithGPT4Vision: number;
  documentsWithTesseract: number;
  averageConfidence: number;
  averageQuality: number;
  totalProcessingTime: number;
  totalCost: number;
  documentReports: EnhancedOCRResult[];
}

export interface OCRCache {
  [fileHash: string]: {
    result: EnhancedOCRResult;
    timestamp: number;
    hits: number;
  };
}

// ============================================================================
// GPT-4 VISION OCR INTEGRATION
// ============================================================================

export class GPT4VisionOCRIntegration {
  private config: OCRIntegrationConfig;
  private documentProcessor: DocumentProcessor;
  private gpt4VisionEngine: GPT4VisionOCREngine;
  private preprocessor: DeepSeekDocumentPreprocessor;
  private cache: OCRCache;

  constructor(config?: Partial<OCRIntegrationConfig>) {
    const apiKey = config?.openaiApiKey || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is required for GPT-4 Vision OCR');
    }

    this.config = {
      useGPT4Vision: config?.useGPT4Vision !== false,
      useTesseractFallback: config?.useTesseractFallback !== false,
      enablePreprocessing: config?.enablePreprocessing !== false,
      enableCaching: config?.enableCaching !== false,
      batchSize: config?.batchSize || 5,
      minConfidenceThreshold: config?.minConfidenceThreshold || 60,
      openaiApiKey: apiKey,
    };

    this.documentProcessor = new DocumentProcessor();
    this.gpt4VisionEngine = new GPT4VisionOCREngine({
      apiKey: this.config.openaiApiKey!,
      includeCheckpoints: true
    });
    this.preprocessor = new DeepSeekDocumentPreprocessor();
    this.cache = {};
  }

  // ============================================================================
  // MAIN PROCESSING METHODS
  // ============================================================================

  /**
   * Process single document with GPT-4 Vision OCR
   */
  async processDocument(
    file: File | Buffer,
    fileName: string,
    mimeType?: string
  ): Promise<EnhancedOCRResult> {
    const startTime = Date.now();

    console.log('[GPT4OCRIntegration] ========================================');
    console.log('[GPT4OCRIntegration] Processing:', fileName);

    try {
      // Convert File to Buffer if needed
      const buffer = file instanceof Buffer ? file : await this.fileToBuffer(file as File);

      // Check cache first
      if (this.config.enableCaching) {
        const cached = await this.checkCache(buffer, fileName);
        if (cached) {
          console.log('[GPT4OCRIntegration] ✓ Cache hit - returning cached result');
          console.log('[GPT4OCRIntegration] ========================================');
          return cached;
        }
      }

      // Step 1: Process with standard document processor
      const baseResult = await this.documentProcessor.processFile(file, fileName, mimeType);

      // If document type doesn't need OCR, return base result
      if (baseResult.fileType !== 'image' && baseResult.fileType !== 'pdf') {
        console.log('[GPT4OCRIntegration] Non-image document - OCR not required');
        return this.enhanceBaseResult(baseResult, false, false, false);
      }

      // Step 2: Preprocess if enabled
      let preprocessingResult: PreprocessingResult | undefined;
      let processedBuffer = buffer;

      if (this.config.enablePreprocessing) {
        preprocessingResult = await this.preprocessor.preprocessDocument(buffer, baseResult);

        if (preprocessingResult.success && preprocessingResult.enhancedBuffer) {
          processedBuffer = preprocessingResult.enhancedBuffer;
          console.log('[GPT4OCRIntegration] ✓ Preprocessing complete, quality:', preprocessingResult.qualityScore);
        }
      }

      // Step 3: Apply GPT-4 Vision OCR if enabled
      let gpt4VisionResult: GPT4VisionOCRResult | undefined;
      let usedGPT4Vision = false;

      if (this.config.useGPT4Vision) {
        try {
          gpt4VisionResult = await this.gpt4VisionEngine.processDocument(baseResult, processedBuffer);
          usedGPT4Vision = gpt4VisionResult.success;

          if (usedGPT4Vision) {
            console.log('[GPT4OCRIntegration] ✓ GPT-4 Vision OCR complete');
            console.log('[GPT4OCRIntegration] - Confidence:', gpt4VisionResult.confidence.toFixed(1) + '%');
            console.log('[GPT4OCRIntegration] - Quality:', gpt4VisionResult.qualityMetrics.overallScore.toFixed(1) + '%');
            console.log('[GPT4OCRIntegration] - Cost: $' + gpt4VisionResult.cost.toFixed(4));

            // Update base result with GPT-4 Vision extraction
            baseResult.extractedText = gpt4VisionResult.extractedText;
            baseResult.metadata.ocrUsed = true;
          }

        } catch (error: any) {
          console.error('[GPT4OCRIntegration] GPT-4 Vision OCR failed:', error.message);
          usedGPT4Vision = false;
        }
      }

      // Step 4: Fallback to Tesseract if needed
      let usedTesseract = false;

      if (!usedGPT4Vision && this.config.useTesseractFallback) {
        console.log('[GPT4OCRIntegration] Falling back to Tesseract...');
        // Tesseract is already used in base processor for images
        usedTesseract = baseResult.metadata.ocrUsed || false;
      }

      // Step 5: Validate results
      const confidence = gpt4VisionResult?.confidence || (usedTesseract ? 70 : 50);

      if (confidence < this.config.minConfidenceThreshold) {
        console.log('[GPT4OCRIntegration] ⚠️ Low confidence:', confidence, '- below threshold', this.config.minConfidenceThreshold);
      }

      // Create enhanced result
      const enhancedResult: EnhancedOCRResult = {
        ...baseResult,
        gpt4VisionResult,
        preprocessingResult,
        usedGPT4Vision,
        usedTesseract,
        cached: false,
        costEstimate: {
          apiCalls: usedGPT4Vision ? 1 : 0,
          estimatedTokens: gpt4VisionResult ? Math.floor(gpt4VisionResult.extractedText.length / 4) : 0,
          estimatedCost: gpt4VisionResult?.cost || 0,
          processingTime: Date.now() - startTime
        },
        processingTime: Date.now() - startTime,
      };

      // Cache result
      if (this.config.enableCaching) {
        await this.cacheResult(buffer, fileName, enhancedResult);
      }

      console.log('[GPT4OCRIntegration] ✓ Processing complete');
      console.log('[GPT4OCRIntegration] - Method:', usedGPT4Vision ? 'GPT-4 Vision' : usedTesseract ? 'Tesseract' : 'Standard');
      console.log('[GPT4OCRIntegration] - Processing time:', enhancedResult.processingTime, 'ms');
      console.log('[GPT4OCRIntegration] ========================================');

      return enhancedResult;

    } catch (error: any) {
      console.error('[GPT4OCRIntegration] Error:', error.message);

      // Return minimal result
      return {
        fileName,
        fileType: 'unknown',
        fileSize: 0,
        extractedText: '',
        metadata: {},
        processingTime: Date.now() - startTime,
        success: false,
        error: error.message,
        usedGPT4Vision: false,
        usedTesseract: false,
        cached: false,
      };
    }
  }

  /**
   * Process multiple documents in batch
   */
  async processBatch(
    files: Array<{ file: File | Buffer; fileName: string; mimeType?: string }>
  ): Promise<BatchProcessingReport> {
    const startTime = Date.now();

    console.log('[GPT4OCRIntegration] ========================================');
    console.log('[GPT4OCRIntegration] Batch processing:', files.length, 'documents');
    console.log('[GPT4OCRIntegration] Batch size:', this.config.batchSize);
    console.log('[GPT4OCRIntegration] ========================================');

    const results: EnhancedOCRResult[] = [];
    let totalCost = 0;

    // Process in batches
    for (let i = 0; i < files.length; i += this.config.batchSize) {
      const batch = files.slice(i, i + this.config.batchSize);
      console.log(`[GPT4OCRIntegration] Processing batch ${Math.floor(i / this.config.batchSize) + 1}/${Math.ceil(files.length / this.config.batchSize)}`);

      // Process batch in parallel
      const batchPromises = batch.map(({ file, fileName, mimeType }) =>
        this.processDocument(file, fileName, mimeType)
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Calculate costs
      for (const result of batchResults) {
        if (result.costEstimate) {
          totalCost += result.costEstimate.estimatedCost;
        }
      }
    }

    // Generate report
    const successfulDocuments = results.filter(r => r.success).length;
    const failedDocuments = results.length - successfulDocuments;
    const documentsWithGPT4Vision = results.filter(r => r.usedGPT4Vision).length;
    const documentsWithTesseract = results.filter(r => r.usedTesseract).length;

    const confidenceValues = results
      .filter(r => r.gpt4VisionResult?.confidence)
      .map(r => r.gpt4VisionResult!.confidence);
    const averageConfidence = confidenceValues.length > 0
      ? confidenceValues.reduce((a, b) => a + b, 0) / confidenceValues.length
      : 0;

    const qualityValues = results
      .filter(r => r.gpt4VisionResult?.qualityMetrics.overallScore)
      .map(r => r.gpt4VisionResult!.qualityMetrics.overallScore);
    const averageQuality = qualityValues.length > 0
      ? qualityValues.reduce((a, b) => a + b, 0) / qualityValues.length
      : 0;

    const totalProcessingTime = Date.now() - startTime;

    console.log('[GPT4OCRIntegration] ========================================');
    console.log('[GPT4OCRIntegration] Batch processing complete');
    console.log('[GPT4OCRIntegration] - Success rate:', successfulDocuments, '/', results.length);
    console.log('[GPT4OCRIntegration] - GPT-4 Vision used:', documentsWithGPT4Vision);
    console.log('[GPT4OCRIntegration] - Tesseract used:', documentsWithTesseract);
    console.log('[GPT4OCRIntegration] - Average confidence:', averageConfidence.toFixed(1) + '%');
    console.log('[GPT4OCRIntegration] - Average quality:', averageQuality.toFixed(1) + '%');
    console.log('[GPT4OCRIntegration] - Total time:', totalProcessingTime, 'ms');
    console.log('[GPT4OCRIntegration] - Total cost:', '$' + totalCost.toFixed(4));
    console.log('[GPT4OCRIntegration] ========================================');

    return {
      totalDocuments: results.length,
      successfulDocuments,
      failedDocuments,
      documentsWithGPT4Vision,
      documentsWithTesseract,
      averageConfidence,
      averageQuality,
      totalProcessingTime,
      totalCost,
      documentReports: results,
    };
  }

  // ============================================================================
  // CACHING
  // ============================================================================

  private async checkCache(buffer: Buffer, fileName: string): Promise<EnhancedOCRResult | null> {
    if (!this.config.enableCaching) return null;

    const hash = this.generateHash(buffer, fileName);
    const cached = this.cache[hash];

    if (cached) {
      const age = Date.now() - cached.timestamp;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      if (age < maxAge) {
        cached.hits++;
        return {
          ...cached.result,
          cached: true
        };
      } else {
        delete this.cache[hash];
      }
    }

    return null;
  }

  private async cacheResult(buffer: Buffer, fileName: string, result: EnhancedOCRResult): Promise<void> {
    if (!this.config.enableCaching) return;

    const hash = this.generateHash(buffer, fileName);

    this.cache[hash] = {
      result,
      timestamp: Date.now(),
      hits: 0
    };

    // Limit cache size
    const cacheKeys = Object.keys(this.cache);
    if (cacheKeys.length > 100) {
      const sorted = cacheKeys.sort((a, b) =>
        this.cache[a].timestamp - this.cache[b].timestamp
      );

      for (let i = 0; i < cacheKeys.length - 100; i++) {
        delete this.cache[sorted[i]];
      }
    }
  }

  private generateHash(buffer: Buffer, fileName: string): string {
    return `${fileName}_${buffer.length}`;
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private enhanceBaseResult(
    baseResult: ProcessedDocument,
    usedGPT4Vision: boolean,
    usedTesseract: boolean,
    cached: boolean
  ): EnhancedOCRResult {
    return {
      ...baseResult,
      usedGPT4Vision,
      usedTesseract,
      cached
    };
  }

  private async fileToBuffer(file: File): Promise<Buffer> {
    const arrayBuffer = await file.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  clearCache(): void {
    this.cache = {};
    console.log('[GPT4OCRIntegration] Cache cleared');
  }

  getCacheStats(): { size: number; totalHits: number; entries: any[] } {
    const entries = Object.entries(this.cache).map(([hash, data]) => ({
      hash,
      timestamp: new Date(data.timestamp).toISOString(),
      hits: data.hits,
      fileName: data.result.fileName
    }));

    const totalHits = entries.reduce((sum, e) => sum + e.hits, 0);

    return {
      size: entries.length,
      totalHits,
      entries
    };
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export const gpt4VisionOCRIntegration = new GPT4VisionOCRIntegration();
export default GPT4VisionOCRIntegration;
