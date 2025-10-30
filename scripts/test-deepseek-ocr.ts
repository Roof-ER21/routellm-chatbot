/**
 * DeepSeek OCR Testing Suite
 *
 * Comprehensive tests for the DeepSeek OCR system
 * Tests all checkpoints, preprocessing, and integration
 *
 * Usage:
 *   npx ts-node scripts/test-deepseek-ocr.ts [test-type]
 *
 * Test types:
 *   - unit: Run unit tests for each component
 *   - integration: Run integration tests
 *   - batch: Run batch processing tests
 *   - all: Run all tests (default)
 *
 * @version 1.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { DeepSeekOCREngine } from '../lib/deepseek-ocr-engine';
import { DeepSeekDocumentPreprocessor } from '../lib/deepseek-document-preprocessor';
import { DeepSeekOCRIntegration } from '../lib/deepseek-ocr-integration';
import { ProcessedDocument } from '../lib/document-processor';

// ============================================================================
// TEST CONFIGURATION
// ============================================================================

const TEST_CONFIG = {
  sourceDirectory: '/Users/a21/Desktop/Sales Rep Resources 2 copy/',
  testOutputDirectory: '/Users/a21/routellm-chatbot/test-results/deepseek-ocr/',
  sampleDocuments: [
    'Adjuster_Inspector Information Sheet1.pdf',
    'Hover ESX_XML_PDF Process.docx',
    'Copy of Sales Tracker (Example).xlsx',
    'CoverageArea.JPG',
  ],
  maxTestDocuments: 10,
};

// ============================================================================
// TEST RUNNER
// ============================================================================

class DeepSeekOCRTestRunner {

  private ocrEngine: DeepSeekOCREngine;
  private preprocessor: DeepSeekDocumentPreprocessor;
  private integration: DeepSeekOCRIntegration;
  private results: TestResult[];

  constructor() {
    this.ocrEngine = new DeepSeekOCREngine();
    this.preprocessor = new DeepSeekDocumentPreprocessor();
    this.integration = new DeepSeekOCRIntegration();
    this.results = [];
  }

  // ============================================================================
  // MAIN TEST METHODS
  // ============================================================================

  async runAllTests(): Promise<void> {
    console.log('========================================');
    console.log('DEEPSEEK OCR TESTING SUITE');
    console.log('========================================');
    console.log('');

    await this.runUnitTests();
    await this.runIntegrationTests();
    await this.runBatchTests();

    this.printSummary();
    await this.saveResults();
  }

  async runUnitTests(): Promise<void> {
    console.log('========================================');
    console.log('UNIT TESTS');
    console.log('========================================');
    console.log('');

    // Test 1: OCR Engine Initialization
    await this.test('OCR Engine Initialization', async () => {
      const engine = new DeepSeekOCREngine();
      return engine !== null && engine !== undefined;
    });

    // Test 2: Preprocessor Initialization
    await this.test('Preprocessor Initialization', async () => {
      const preprocessor = new DeepSeekDocumentPreprocessor();
      return preprocessor !== null && preprocessor !== undefined;
    });

    // Test 3: Integration Layer Initialization
    await this.test('Integration Layer Initialization', async () => {
      const integration = new DeepSeekOCRIntegration();
      return integration !== null && integration !== undefined;
    });

    // Test 4: Configuration Validation
    await this.test('Configuration Validation', async () => {
      const engine = new DeepSeekOCREngine({
        apiEndpoint: 'http://localhost:11434/api/generate',
        modelName: 'deepseek-v3.1:671b-cloud',
        temperature: 0.1,
        maxTokens: 8192,
      });
      return true;
    });

    console.log('');
  }

  async runIntegrationTests(): Promise<void> {
    console.log('========================================');
    console.log('INTEGRATION TESTS');
    console.log('========================================');
    console.log('');

    // Find test documents
    const testDocs = await this.findTestDocuments();

    if (testDocs.length === 0) {
      console.log('⚠️ No test documents found in:', TEST_CONFIG.sourceDirectory);
      console.log('');
      return;
    }

    console.log(`Found ${testDocs.length} test documents`);
    console.log('');

    // Test each document type
    for (const docPath of testDocs.slice(0, 5)) { // Test first 5
      const fileName = path.basename(docPath);
      const fileType = path.extname(docPath).toLowerCase();

      await this.test(`Process ${fileType} file: ${fileName}`, async () => {
        try {
          const buffer = fs.readFileSync(docPath);
          const result = await this.integration.processDocument(buffer, fileName);

          console.log(`    - Success: ${result.success}`);
          console.log(`    - Method: ${result.usedDeepSeek ? 'DeepSeek' : result.usedTesseract ? 'Tesseract' : 'Standard'}`);
          console.log(`    - Text length: ${result.extractedText.length}`);

          if (result.deepseekResult) {
            console.log(`    - Confidence: ${result.deepseekResult.confidence.toFixed(1)}%`);
            console.log(`    - Quality: ${result.deepseekResult.qualityMetrics.overallScore.toFixed(1)}%`);
            console.log(`    - Checkpoints passed: ${result.deepseekResult.checkpoints.filter(c => c.passed).length}/${result.deepseekResult.checkpoints.length}`);
          }

          return result.success;
        } catch (error: any) {
          console.log(`    ✗ Error: ${error.message}`);
          return false;
        }
      });
    }

    console.log('');
  }

  async runBatchTests(): Promise<void> {
    console.log('========================================');
    console.log('BATCH PROCESSING TESTS');
    console.log('========================================');
    console.log('');

    const testDocs = await this.findTestDocuments();

    if (testDocs.length < 3) {
      console.log('⚠️ Need at least 3 documents for batch testing');
      console.log('');
      return;
    }

    await this.test('Batch Processing (5 documents)', async () => {
      try {
        const files = testDocs.slice(0, 5).map(docPath => ({
          file: fs.readFileSync(docPath),
          fileName: path.basename(docPath),
        }));

        const report = await this.integration.processBatch(files);

        console.log(`    - Total: ${report.totalDocuments}`);
        console.log(`    - Successful: ${report.successfulDocuments}`);
        console.log(`    - Failed: ${report.failedDocuments}`);
        console.log(`    - Avg Confidence: ${report.averageConfidence.toFixed(1)}%`);
        console.log(`    - Avg Quality: ${report.averageQuality.toFixed(1)}%`);
        console.log(`    - Total Time: ${(report.totalProcessingTime / 1000).toFixed(2)}s`);
        console.log(`    - Total Cost: $${report.totalCost.toFixed(4)}`);

        return report.successfulDocuments > 0;
      } catch (error: any) {
        console.log(`    ✗ Error: ${error.message}`);
        return false;
      }
    });

    console.log('');
  }

  // ============================================================================
  // CHECKPOINT TESTS
  // ============================================================================

  async runCheckpointTests(docPath: string): Promise<void> {
    console.log('========================================');
    console.log('CHECKPOINT VALIDATION TESTS');
    console.log('========================================');
    console.log('');

    const fileName = path.basename(docPath);
    const buffer = fs.readFileSync(docPath);

    // Create mock processed document
    const mockDoc: ProcessedDocument = {
      fileName,
      fileType: 'image',
      fileSize: buffer.length,
      extractedText: '',
      metadata: {},
      processingTime: 0,
      success: true,
    };

    console.log(`Testing with: ${fileName}`);
    console.log('');

    // Test preprocessing
    await this.test('Checkpoint: Image Quality Assessment', async () => {
      const result = await this.preprocessor.preprocessDocument(buffer, mockDoc);
      console.log(`    - Quality Score: ${result.qualityScore}/100`);
      console.log(`    - Steps Applied: ${result.preprocessingSteps.filter(s => s.applied).length}`);
      return result.success;
    });

    // Test OCR with all checkpoints
    await this.test('Checkpoint: All 5 Checkpoints', async () => {
      const result = await this.ocrEngine.processDocument(mockDoc, buffer);

      for (const checkpoint of result.checkpoints) {
        const status = checkpoint.passed ? '✓ PASS' : '✗ FAIL';
        console.log(`    ${checkpoint.checkpointNumber}. ${checkpoint.checkpointName}: ${status} (${checkpoint.score}/100)`);
      }

      const passedCheckpoints = result.checkpoints.filter(c => c.passed).length;
      return passedCheckpoints >= 3; // At least 3 checkpoints should pass
    });

    console.log('');
  }

  // ============================================================================
  // PERFORMANCE TESTS
  // ============================================================================

  async runPerformanceTests(): Promise<void> {
    console.log('========================================');
    console.log('PERFORMANCE TESTS');
    console.log('========================================');
    console.log('');

    const testDocs = await this.findTestDocuments();

    if (testDocs.length === 0) {
      console.log('⚠️ No test documents found');
      console.log('');
      return;
    }

    // Test processing speed
    await this.test('Processing Speed (per document)', async () => {
      const startTime = Date.now();
      const testDoc = testDocs[0];
      const buffer = fs.readFileSync(testDoc);
      const fileName = path.basename(testDoc);

      const result = await this.integration.processDocument(buffer, fileName);
      const duration = Date.now() - startTime;

      console.log(`    - Duration: ${duration}ms`);
      console.log(`    - Throughput: ${(result.fileSize / 1024 / (duration / 1000)).toFixed(2)} KB/s`);

      return duration < 30000; // Should complete within 30 seconds
    });

    // Test caching
    await this.test('Caching Effectiveness', async () => {
      const testDoc = testDocs[0];
      const buffer = fs.readFileSync(testDoc);
      const fileName = path.basename(testDoc);

      // First call (no cache)
      const startTime1 = Date.now();
      await this.integration.processDocument(buffer, fileName);
      const duration1 = Date.now() - startTime1;

      // Second call (should use cache)
      const startTime2 = Date.now();
      const result2 = await this.integration.processDocument(buffer, fileName);
      const duration2 = Date.now() - startTime2;

      console.log(`    - First call: ${duration1}ms`);
      console.log(`    - Second call: ${duration2}ms (cached: ${result2.cached})`);
      console.log(`    - Speedup: ${(duration1 / duration2).toFixed(1)}x`);

      return result2.cached && duration2 < duration1;
    });

    console.log('');
  }

  // ============================================================================
  // ACCURACY TESTS
  // ============================================================================

  async runAccuracyTests(): Promise<void> {
    console.log('========================================');
    console.log('ACCURACY TESTS');
    console.log('========================================');
    console.log('');

    // Test with known documents and expected content
    const accuracyTests = [
      {
        name: 'Technical Terms Extraction (Roofing)',
        expectedTerms: ['shingle', 'roofing', 'damage', 'inspection'],
      },
      {
        name: 'Technical Terms Extraction (Insurance)',
        expectedTerms: ['claim', 'policy', 'adjuster', 'estimate'],
      },
      {
        name: 'Number Extraction',
        expectedPatterns: [/\$[\d,]+\.?\d*/,  /\d{3}-\d{3}-\d{4}/],
      },
      {
        name: 'Date Extraction',
        expectedPatterns: [/\d{1,2}\/\d{1,2}\/\d{2,4}/],
      },
    ];

    const testDocs = await this.findTestDocuments();
    if (testDocs.length === 0) return;

    for (const accuracyTest of accuracyTests) {
      await this.test(accuracyTest.name, async () => {
        const testDoc = testDocs[0];
        const buffer = fs.readFileSync(testDoc);
        const fileName = path.basename(testDoc);

        const result = await this.integration.processDocument(buffer, fileName);

        if (!result.success || !result.extractedText) {
          console.log('    ✗ Extraction failed');
          return false;
        }

        let foundCount = 0;

        if (accuracyTest.expectedTerms) {
          for (const term of accuracyTest.expectedTerms) {
            if (result.extractedText.toLowerCase().includes(term.toLowerCase())) {
              foundCount++;
            }
          }
          console.log(`    - Found ${foundCount}/${accuracyTest.expectedTerms.length} expected terms`);
        }

        if (accuracyTest.expectedPatterns) {
          for (const pattern of accuracyTest.expectedPatterns) {
            if (pattern.test(result.extractedText)) {
              foundCount++;
            }
          }
          console.log(`    - Found ${foundCount}/${accuracyTest.expectedPatterns.length} expected patterns`);
        }

        return foundCount > 0;
      });
    }

    console.log('');
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private async test(name: string, testFn: () => Promise<boolean>): Promise<void> {
    const startTime = Date.now();

    try {
      const passed = await testFn();
      const duration = Date.now() - startTime;

      const result: TestResult = {
        name,
        passed,
        duration,
        error: undefined,
      };

      this.results.push(result);

      const status = passed ? '✓ PASS' : '✗ FAIL';
      console.log(`${status} ${name} (${duration}ms)`);

    } catch (error: any) {
      const duration = Date.now() - startTime;

      const result: TestResult = {
        name,
        passed: false,
        duration,
        error: error.message,
      };

      this.results.push(result);

      console.log(`✗ FAIL ${name} (${duration}ms)`);
      console.log(`  Error: ${error.message}`);
    }
  }

  private async findTestDocuments(): Promise<string[]> {
    try {
      const files = fs.readdirSync(TEST_CONFIG.sourceDirectory);
      const documents: string[] = [];

      for (const file of files) {
        const filePath = path.join(TEST_CONFIG.sourceDirectory, file);
        const stats = fs.statSync(filePath);

        if (stats.isFile()) {
          const ext = path.extname(file).toLowerCase();
          if (['.pdf', '.docx', '.xlsx', '.jpg', '.jpeg', '.png'].includes(ext)) {
            documents.push(filePath);
          }
        }
      }

      return documents.slice(0, TEST_CONFIG.maxTestDocuments);

    } catch (error: any) {
      console.error('Error finding test documents:', error.message);
      return [];
    }
  }

  private printSummary(): void {
    console.log('========================================');
    console.log('TEST SUMMARY');
    console.log('========================================');
    console.log('');

    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const passRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests} (${passRate.toFixed(1)}%)`);
    console.log(`Failed: ${failedTests}`);
    console.log('');

    if (failedTests > 0) {
      console.log('Failed Tests:');
      for (const result of this.results.filter(r => !r.passed)) {
        console.log(`  ✗ ${result.name}`);
        if (result.error) {
          console.log(`    Error: ${result.error}`);
        }
      }
      console.log('');
    }

    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
    console.log(`Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log('');
  }

  private async saveResults(): Promise<void> {
    try {
      // Create output directory
      fs.mkdirSync(TEST_CONFIG.testOutputDirectory, { recursive: true });

      // Save results as JSON
      const outputPath = path.join(
        TEST_CONFIG.testOutputDirectory,
        `test-results-${new Date().toISOString().replace(/:/g, '-')}.json`
      );

      const report = {
        timestamp: new Date().toISOString(),
        totalTests: this.results.length,
        passedTests: this.results.filter(r => r.passed).length,
        failedTests: this.results.filter(r => !r.passed).length,
        results: this.results,
      };

      fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

      console.log(`Results saved to: ${outputPath}`);
      console.log('');

    } catch (error: any) {
      console.error('Error saving results:', error.message);
    }
  }
}

// ============================================================================
// TEST RESULT TYPE
// ============================================================================

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  const testType = process.argv[2] || 'all';
  const runner = new DeepSeekOCRTestRunner();

  switch (testType) {
    case 'unit':
      await runner.runUnitTests();
      break;

    case 'integration':
      await runner.runIntegrationTests();
      break;

    case 'batch':
      await runner.runBatchTests();
      break;

    case 'performance':
      await runner.runPerformanceTests();
      break;

    case 'accuracy':
      await runner.runAccuracyTests();
      break;

    case 'all':
    default:
      await runner.runAllTests();
      await runner.runPerformanceTests();
      await runner.runAccuracyTests();
      break;
  }
}

// Run tests
if (require.main === module) {
  main().catch(console.error);
}

export default DeepSeekOCRTestRunner;
