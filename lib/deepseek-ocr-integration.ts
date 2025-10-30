/**
 * DeepSeek OCR Integration Layer
 *
 * Integrates DeepSeek OCR with existing document-processor.ts
 * Provides fallback to Tesseract, batch processing, caching, and reporting
 *
 * @version 1.0.0
 */

import { DocumentProcessor, ProcessedDocument } from './document-processor';
import { DeepSeekOCREngine, OCRResult } from './deepseek-ocr-engine';
import { DeepSeekDocumentPreprocessor, PreprocessingResult } from './deepseek-document-preprocessor';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface OCRIntegrationConfig {
  useDeepSeek: boolean;
  useTesseractFallback: boolean;
  enablePreprocessing: boolean;
  enableCaching: boolean;
  batchSize: number;
  minConfidenceThreshold: number; // 0-100
  deepseekApiEndpoint?: string;
}

export interface EnhancedOCRResult extends ProcessedDocument {
  deepseekResult?: OCRResult;
  preprocessingResult?: PreprocessingResult;
  usedDeepSeek: boolean;
  usedTesseract: boolean;
  cached: boolean;
  costEstimate?: CostEstimate;
}

export interface CostEstimate {
  apiCalls: number;
  estimatedTokens: number;
  estimatedCost: number; // in USD
  processingTime: number; // ms
}

export interface BatchProcessingReport {
  totalDocuments: number;
  successfulDocuments: number;
  failedDocuments: number;
  documentsWithDeepSeek: number;
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
// DEEPSEEK OCR INTEGRATION
// ============================================================================

export class DeepSeekOCRIntegration {

  private config: OCRIntegrationConfig;
  private documentProcessor: DocumentProcessor;
  private deepseekEngine: DeepSeekOCREngine;
  private preprocessor: DeepSeekDocumentPreprocessor;
  private cache: OCRCache;

  constructor(config?: Partial<OCRIntegrationConfig>) {
    this.config = {
      useDeepSeek: config?.useDeepSeek !== false,
      useTesseractFallback: config?.useTesseractFallback !== false,
      enablePreprocessing: config?.enablePreprocessing !== false,
      enableCaching: config?.enableCaching !== false,
      batchSize: config?.batchSize || 5,
      minConfidenceThreshold: config?.minConfidenceThreshold || 60,
      deepseekApiEndpoint: config?.deepseekApiEndpoint,
    };

    this.documentProcessor = new DocumentProcessor();
    this.deepseekEngine = new DeepSeekOCREngine({
      apiEndpoint: this.config.deepseekApiEndpoint
    });
    this.preprocessor = new DeepSeekDocumentPreprocessor();
    this.cache = {};
  }

  // ============================================================================
  // MAIN PROCESSING METHODS
  // ============================================================================

  /**
   * Process single document with DeepSeek OCR (with fallback)
   */
  async processDocument(
    file: File | Buffer,
    fileName: string,
    mimeType?: string
  ): Promise<EnhancedOCRResult> {
    const startTime = Date.now();

    console.log('[OCRIntegration] ========================================');
    console.log('[OCRIntegration] Processing:', fileName);

    try {
      // Convert File to Buffer if needed
      const buffer = file instanceof Buffer ? file : await this.fileToBuffer(file as File);

      // Check cache first
      if (this.config.enableCaching) {
        const cached = await this.checkCache(buffer, fileName);
        if (cached) {
          console.log('[OCRIntegration] ✓ Cache hit - returning cached result');
          console.log('[OCRIntegration] ========================================');
          return cached;
        }
      }

      // Step 1: Process with standard document processor
      const baseResult = await this.documentProcessor.processFile(file, fileName, mimeType);

      // If document type doesn't need OCR, return base result
      if (baseResult.fileType !== 'image' && baseResult.fileType !== 'pdf') {
        console.log('[OCRIntegration] Non-image document - OCR not required');
        return this.enhanceBaseResult(baseResult, false, false, false);
      }

      // If base extraction was successful and has good content, may not need DeepSeek
      if (baseResult.success && baseResult.extractedText.length > 200) {
        console.log('[OCRIntegration] Base extraction successful - DeepSeek optional');
      }

      // Step 2: Preprocess if enabled
      let preprocessingResult: PreprocessingResult | undefined;
      let processedBuffer = buffer;

      if (this.config.enablePreprocessing) {
        preprocessingResult = await this.preprocessor.preprocessDocument(buffer, baseResult);

        if (preprocessingResult.success && preprocessingResult.enhancedBuffer) {
          processedBuffer = preprocessingResult.enhancedBuffer;
          console.log('[OCRIntegration] ✓ Preprocessing complete, quality:', preprocessingResult.qualityScore);
        }
      }

      // Step 3: Apply DeepSeek OCR if enabled
      let deepseekResult: OCRResult | undefined;
      let usedDeepSeek = false;

      if (this.config.useDeepSeek) {
        try {
          deepseekResult = await this.deepseekEngine.processDocument(baseResult, processedBuffer);
          usedDeepSeek = deepseekResult.success;

          if (usedDeepSeek) {
            console.log('[OCRIntegration] ✓ DeepSeek OCR complete');
            console.log('[OCRIntegration] - Confidence:', deepseekResult.confidence.toFixed(1) + '%');
            console.log('[OCRIntegration] - Quality:', deepseekResult.qualityMetrics.overallScore.toFixed(1) + '%');

            // Update base result with DeepSeek extraction
            baseResult.extractedText = deepseekResult.extractedText;
            baseResult.metadata.ocrUsed = true;
          }

        } catch (error: any) {
          console.error('[OCRIntegration] DeepSeek OCR failed:', error.message);
          usedDeepSeek = false;
        }
      }

      // Step 4: Fallback to Tesseract if needed
      let usedTesseract = false;

      if (!usedDeepSeek && this.config.useTesseractFallback) {
        console.log('[OCRIntegration] Falling back to Tesseract...');
        // Tesseract is already used in base processor for images
        usedTesseract = baseResult.metadata.ocrUsed || false;
      }

      // Step 5: Validate results
      const confidence = deepseekResult?.confidence || (usedTesseract ? 70 : 50);

      if (confidence < this.config.minConfidenceThreshold) {
        console.log('[OCRIntegration] ⚠️ Low confidence:', confidence, '- below threshold', this.config.minConfidenceThreshold);
      }

      // Create enhanced result
      const enhancedResult: EnhancedOCRResult = {
        ...baseResult,
        deepseekResult,
        preprocessingResult,
        usedDeepSeek,
        usedTesseract,
        cached: false,
        costEstimate: this.calculateCost(deepseekResult, startTime),
        processingTime: Date.now() - startTime,
      };

      // Cache result
      if (this.config.enableCaching) {
        await this.cacheResult(buffer, fileName, enhancedResult);
      }

      console.log('[OCRIntegration] ✓ Processing complete');
      console.log('[OCRIntegration] - Method:', usedDeepSeek ? 'DeepSeek' : usedTesseract ? 'Tesseract' : 'Standard');
      console.log('[OCRIntegration] - Processing time:', enhancedResult.processingTime, 'ms');
      console.log('[OCRIntegration] ========================================');

      return enhancedResult;

    } catch (error: any) {
      console.error('[OCRIntegration] Error:', error.message);

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
        usedDeepSeek: false,
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

    console.log('[OCRIntegration] ========================================');
    console.log('[OCRIntegration] Batch processing:', files.length, 'documents');
    console.log('[OCRIntegration] Batch size:', this.config.batchSize);
    console.log('[OCRIntegration] ========================================');

    const results: EnhancedOCRResult[] = [];
    let totalCost = 0;

    // Process in batches
    for (let i = 0; i < files.length; i += this.config.batchSize) {
      const batch = files.slice(i, i + this.config.batchSize);
      console.log(`[OCRIntegration] Processing batch ${Math.floor(i / this.config.batchSize) + 1}/${Math.ceil(files.length / this.config.batchSize)}`);

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
    const documentsWithDeepSeek = results.filter(r => r.usedDeepSeek).length;
    const documentsWithTesseract = results.filter(r => r.usedTesseract).length;

    const confidenceValues = results
      .filter(r => r.deepseekResult?.confidence)
      .map(r => r.deepseekResult!.confidence);
    const averageConfidence = confidenceValues.length > 0
      ? confidenceValues.reduce((a, b) => a + b, 0) / confidenceValues.length
      : 0;

    const qualityValues = results
      .filter(r => r.deepseekResult?.qualityMetrics.overallScore)
      .map(r => r.deepseekResult!.qualityMetrics.overallScore);
    const averageQuality = qualityValues.length > 0
      ? qualityValues.reduce((a, b) => a + b, 0) / qualityValues.length
      : 0;

    const totalProcessingTime = Date.now() - startTime;

    console.log('[OCRIntegration] ========================================');
    console.log('[OCRIntegration] Batch processing complete');
    console.log('[OCRIntegration] - Success rate:', successfulDocuments, '/', results.length);
    console.log('[OCRIntegration] - DeepSeek used:', documentsWithDeepSeek);
    console.log('[OCRIntegration] - Tesseract used:', documentsWithTesseract);
    console.log('[OCRIntegration] - Average confidence:', averageConfidence.toFixed(1) + '%');
    console.log('[OCRIntegration] - Average quality:', averageQuality.toFixed(1) + '%');
    console.log('[OCRIntegration] - Total time:', totalProcessingTime, 'ms');
    console.log('[OCRIntegration] - Total cost:', '$' + totalCost.toFixed(4));
    console.log('[OCRIntegration] ========================================');

    return {
      totalDocuments: results.length,
      successfulDocuments,
      failedDocuments,
      documentsWithDeepSeek,
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
      // Check if cache is still valid (24 hours)
      const age = Date.now() - cached.timestamp;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      if (age < maxAge) {
        cached.hits++;
        return {
          ...cached.result,
          cached: true
        };
      } else {
        // Cache expired
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

    // Limit cache size (keep last 100 entries)
    const cacheKeys = Object.keys(this.cache);
    if (cacheKeys.length > 100) {
      // Remove oldest entries
      const sorted = cacheKeys.sort((a, b) =>
        this.cache[a].timestamp - this.cache[b].timestamp
      );

      for (let i = 0; i < cacheKeys.length - 100; i++) {
        delete this.cache[sorted[i]];
      }
    }
  }

  private generateHash(buffer: Buffer, fileName: string): string {
    // Simple hash based on size and filename
    // In production, use crypto.createHash('md5').update(buffer).digest('hex')
    return `${fileName}_${buffer.length}`;
  }

  // ============================================================================
  // COST ESTIMATION
  // ============================================================================

  private calculateCost(ocrResult: OCRResult | undefined, startTime: number): CostEstimate {
    if (!ocrResult || !ocrResult.success) {
      return {
        apiCalls: 0,
        estimatedTokens: 0,
        estimatedCost: 0,
        processingTime: Date.now() - startTime
      };
    }

    // DeepSeek pricing (approximate - update with actual pricing)
    // Cloud API: ~$0.14 per million input tokens, ~$0.28 per million output tokens
    const inputTokensPerImage = 1000; // Estimated for vision
    const outputTokens = ocrResult.extractedText.length / 4; // ~4 chars per token

    const inputCost = (inputTokensPerImage / 1_000_000) * 0.14;
    const outputCost = (outputTokens / 1_000_000) * 0.28;
    const totalCost = inputCost + outputCost;

    return {
      apiCalls: 1,
      estimatedTokens: inputTokensPerImage + outputTokens,
      estimatedCost: totalCost,
      processingTime: ocrResult.processingTime
    };
  }

  // ============================================================================
  // REPORTING
  // ============================================================================

  /**
   * Generate detailed report for a single document
   */
  generateDocumentReport(result: EnhancedOCRResult): string {
    const lines: string[] = [];

    lines.push('========================================');
    lines.push('DEEPSEEK OCR DOCUMENT REPORT');
    lines.push('========================================');
    lines.push('');

    // Basic info
    lines.push('Document Information:');
    lines.push(`  Filename: ${result.fileName}`);
    lines.push(`  File Type: ${result.fileType}`);
    lines.push(`  File Size: ${(result.fileSize / 1024).toFixed(2)} KB`);
    lines.push(`  Processing Time: ${result.processingTime} ms`);
    lines.push(`  Success: ${result.success ? '✓' : '✗'}`);
    lines.push('');

    // OCR method
    lines.push('OCR Method:');
    lines.push(`  DeepSeek Used: ${result.usedDeepSeek ? '✓' : '✗'}`);
    lines.push(`  Tesseract Fallback: ${result.usedTesseract ? '✓' : '✗'}`);
    lines.push(`  Cached Result: ${result.cached ? '✓' : '✗'}`);
    lines.push('');

    // Preprocessing
    if (result.preprocessingResult) {
      lines.push('Preprocessing:');
      lines.push(`  Quality Score: ${result.preprocessingResult.qualityScore}/100`);
      lines.push(`  Steps Applied: ${result.preprocessingResult.preprocessingSteps.filter(s => s.applied).length}/${result.preprocessingResult.preprocessingSteps.length}`);

      if (result.preprocessingResult.recommendations.length > 0) {
        lines.push('  Recommendations:');
        for (const rec of result.preprocessingResult.recommendations) {
          lines.push(`    - ${rec}`);
        }
      }
      lines.push('');
    }

    // DeepSeek results
    if (result.deepseekResult) {
      const dr = result.deepseekResult;

      lines.push('DeepSeek OCR Results:');
      lines.push(`  Confidence: ${dr.confidence.toFixed(1)}%`);
      lines.push(`  Text Length: ${dr.extractedText.length} characters`);
      lines.push('');

      lines.push('Quality Metrics:');
      lines.push(`  Overall Score: ${dr.qualityMetrics.overallScore.toFixed(1)}/100`);
      lines.push(`  Text Completeness: ${dr.qualityMetrics.textCompleteness.toFixed(1)}/100`);
      lines.push(`  Structure Preservation: ${dr.qualityMetrics.structurePreservation.toFixed(1)}/100`);
      lines.push(`  Technical Accuracy: ${dr.qualityMetrics.technicalAccuracy.toFixed(1)}/100`);
      lines.push(`  Readability: ${dr.qualityMetrics.readability.toFixed(1)}/100`);
      lines.push(`  Confidence Level: ${dr.qualityMetrics.confidenceLevel.toUpperCase()}`);
      lines.push('');

      lines.push('Document Structure:');
      lines.push(`  Headers: ${dr.documentStructure.hasHeaders ? '✓' : '✗'}`);
      lines.push(`  Tables: ${dr.documentStructure.hasTables ? '✓' : '✗'} (${dr.documentStructure.tableCount})`);
      lines.push(`  Lists: ${dr.documentStructure.hasLists ? '✓' : '✗'} (${dr.documentStructure.listCount})`);
      lines.push(`  Paragraphs: ${dr.documentStructure.paragraphCount}`);
      lines.push('');

      lines.push('Technical Terms:');
      lines.push(`  Total Found: ${dr.technicalTerms.length}`);
      lines.push(`  Roofing Terms: ${dr.technicalTerms.filter(t => t.category === 'roofing').length}`);
      lines.push(`  Insurance Terms: ${dr.technicalTerms.filter(t => t.category === 'insurance').length}`);
      lines.push('');

      lines.push('Checkpoint Results:');
      for (const checkpoint of dr.checkpoints) {
        const status = checkpoint.passed ? '✓ PASS' : '✗ FAIL';
        lines.push(`  ${checkpoint.checkpointNumber}. ${checkpoint.checkpointName}: ${status} (${checkpoint.score}/100)`);
        lines.push(`     ${checkpoint.details}`);
      }
      lines.push('');

      lines.push('Recommendation:');
      lines.push(`  ${dr.qualityMetrics.recommendedAction}`);
      lines.push('');
    }

    // Cost
    if (result.costEstimate) {
      lines.push('Cost Analysis:');
      lines.push(`  API Calls: ${result.costEstimate.apiCalls}`);
      lines.push(`  Estimated Tokens: ${result.costEstimate.estimatedTokens.toFixed(0)}`);
      lines.push(`  Estimated Cost: $${result.costEstimate.estimatedCost.toFixed(6)}`);
      lines.push('');
    }

    // Extracted text preview
    if (result.extractedText && result.extractedText.length > 0) {
      lines.push('Extracted Text (First 500 characters):');
      lines.push('----------------------------------------');
      lines.push(result.extractedText.substring(0, 500));
      if (result.extractedText.length > 500) {
        lines.push('...');
        lines.push(`(${result.extractedText.length - 500} more characters)`);
      }
      lines.push('');
    }

    lines.push('========================================');

    return lines.join('\n');
  }

  /**
   * Generate batch processing report
   */
  generateBatchReport(report: BatchProcessingReport): string {
    const lines: string[] = [];

    lines.push('========================================');
    lines.push('DEEPSEEK OCR BATCH PROCESSING REPORT');
    lines.push('========================================');
    lines.push('');

    lines.push('Summary:');
    lines.push(`  Total Documents: ${report.totalDocuments}`);
    lines.push(`  Successful: ${report.successfulDocuments} (${((report.successfulDocuments / report.totalDocuments) * 100).toFixed(1)}%)`);
    lines.push(`  Failed: ${report.failedDocuments}`);
    lines.push('');

    lines.push('OCR Methods:');
    lines.push(`  DeepSeek: ${report.documentsWithDeepSeek} documents`);
    lines.push(`  Tesseract: ${report.documentsWithTesseract} documents`);
    lines.push('');

    lines.push('Quality Metrics:');
    lines.push(`  Average Confidence: ${report.averageConfidence.toFixed(1)}%`);
    lines.push(`  Average Quality Score: ${report.averageQuality.toFixed(1)}%`);
    lines.push('');

    lines.push('Performance:');
    lines.push(`  Total Processing Time: ${(report.totalProcessingTime / 1000).toFixed(2)}s`);
    lines.push(`  Average Time per Document: ${(report.totalProcessingTime / report.totalDocuments).toFixed(0)}ms`);
    lines.push('');

    lines.push('Cost Analysis:');
    lines.push(`  Total Cost: $${report.totalCost.toFixed(4)}`);
    lines.push(`  Average Cost per Document: $${(report.totalCost / report.totalDocuments).toFixed(6)}`);
    lines.push('');

    lines.push('Document Details:');
    lines.push('----------------------------------------');
    for (const doc of report.documentReports) {
      const status = doc.success ? '✓' : '✗';
      const method = doc.usedDeepSeek ? 'DeepSeek' : doc.usedTesseract ? 'Tesseract' : 'Standard';
      const confidence = doc.deepseekResult?.confidence.toFixed(1) || 'N/A';

      lines.push(`  ${status} ${doc.fileName}`);
      lines.push(`     Method: ${method}, Confidence: ${confidence}%, Time: ${doc.processingTime}ms`);
    }

    lines.push('');
    lines.push('========================================');

    return lines.join('\n');
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private enhanceBaseResult(
    baseResult: ProcessedDocument,
    usedDeepSeek: boolean,
    usedTesseract: boolean,
    cached: boolean
  ): EnhancedOCRResult {
    return {
      ...baseResult,
      usedDeepSeek,
      usedTesseract,
      cached
    };
  }

  private async fileToBuffer(file: File): Promise<Buffer> {
    const arrayBuffer = await file.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache = {};
    console.log('[OCRIntegration] Cache cleared');
  }

  /**
   * Get cache statistics
   */
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

export const deepseekOCRIntegration = new DeepSeekOCRIntegration();
export default DeepSeekOCRIntegration;
