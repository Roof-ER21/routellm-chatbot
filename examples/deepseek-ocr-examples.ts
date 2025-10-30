/**
 * DeepSeek OCR Usage Examples
 *
 * Practical examples demonstrating how to use the DeepSeek OCR system
 * for various document processing scenarios.
 *
 * @version 1.0.0
 */

import { deepseekOCRIntegration, DeepSeekOCRIntegration } from '../lib/deepseek-ocr-integration';
import { deepseekOCREngine } from '../lib/deepseek-ocr-engine';
import { deepseekPreprocessor } from '../lib/deepseek-document-preprocessor';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// EXAMPLE 1: BASIC SINGLE DOCUMENT PROCESSING
// ============================================================================

export async function example1_basicProcessing() {
  console.log('========================================');
  console.log('EXAMPLE 1: Basic Document Processing');
  console.log('========================================\n');

  // Load a document
  const documentPath = '/Users/a21/Desktop/Sales Rep Resources 2 copy/Adjuster_Inspector Information Sheet1.pdf';

  try {
    const buffer = fs.readFileSync(documentPath);
    const fileName = path.basename(documentPath);

    console.log(`Processing: ${fileName}\n`);

    // Process with DeepSeek OCR
    const result = await deepseekOCRIntegration.processDocument(
      buffer,
      fileName
    );

    // Display results
    console.log('Results:');
    console.log(`  Success: ${result.success ? '✓' : '✗'}`);
    console.log(`  Method: ${result.usedDeepSeek ? 'DeepSeek' : result.usedTesseract ? 'Tesseract' : 'Standard'}`);
    console.log(`  Processing Time: ${result.processingTime}ms`);
    console.log(`  Text Length: ${result.extractedText.length} characters`);

    if (result.deepseekResult) {
      console.log(`\nQuality Metrics:`);
      console.log(`  Confidence: ${result.deepseekResult.confidence.toFixed(1)}%`);
      console.log(`  Overall Score: ${result.deepseekResult.qualityMetrics.overallScore.toFixed(1)}%`);
      console.log(`  Confidence Level: ${result.deepseekResult.qualityMetrics.confidenceLevel.toUpperCase()}`);
    }

    console.log(`\nExtracted Text Preview:`);
    console.log(result.extractedText.substring(0, 300) + '...\n');

  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

// ============================================================================
// EXAMPLE 2: BATCH PROCESSING MULTIPLE DOCUMENTS
// ============================================================================

export async function example2_batchProcessing() {
  console.log('========================================');
  console.log('EXAMPLE 2: Batch Processing');
  console.log('========================================\n');

  const sourceDirectory = '/Users/a21/Desktop/Sales Rep Resources 2 copy/';

  try {
    // Find all PDFs in directory
    const allFiles = fs.readdirSync(sourceDirectory);
    const pdfFiles = allFiles
      .filter(f => f.toLowerCase().endsWith('.pdf'))
      .slice(0, 5); // Process first 5 PDFs

    console.log(`Found ${pdfFiles.length} PDF documents\n`);

    // Prepare files for batch processing
    const files = pdfFiles.map(fileName => ({
      file: fs.readFileSync(path.join(sourceDirectory, fileName)),
      fileName
    }));

    console.log('Processing batch...\n');

    // Process batch
    const report = await deepseekOCRIntegration.processBatch(files);

    // Display batch report
    console.log('Batch Processing Results:');
    console.log(`  Total Documents: ${report.totalDocuments}`);
    console.log(`  Successful: ${report.successfulDocuments}`);
    console.log(`  Failed: ${report.failedDocuments}`);
    console.log(`  Success Rate: ${(report.successfulDocuments / report.totalDocuments * 100).toFixed(1)}%`);
    console.log(`\nQuality Metrics:`);
    console.log(`  Average Confidence: ${report.averageConfidence.toFixed(1)}%`);
    console.log(`  Average Quality: ${report.averageQuality.toFixed(1)}%`);
    console.log(`\nPerformance:`);
    console.log(`  Total Time: ${(report.totalProcessingTime / 1000).toFixed(2)}s`);
    console.log(`  Avg Time per Doc: ${(report.totalProcessingTime / report.totalDocuments).toFixed(0)}ms`);
    console.log(`\nCost Analysis:`);
    console.log(`  Total Cost: $${report.totalCost.toFixed(4)}`);
    console.log(`  Cost per Document: $${(report.totalCost / report.totalDocuments).toFixed(6)}`);

    console.log(`\nDocument Details:`);
    for (const doc of report.documentReports) {
      const status = doc.success ? '✓' : '✗';
      const confidence = doc.deepseekResult?.confidence.toFixed(1) || 'N/A';
      console.log(`  ${status} ${doc.fileName} - Confidence: ${confidence}%`);
    }

    console.log('');

  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

// ============================================================================
// EXAMPLE 3: EXTRACTING INSURANCE DATA
// ============================================================================

export async function example3_insuranceDataExtraction() {
  console.log('========================================');
  console.log('EXAMPLE 3: Insurance Data Extraction');
  console.log('========================================\n');

  const documentPath = '/Users/a21/Desktop/Sales Rep Resources 2 copy/Adjuster_Inspector Information Sheet1.pdf';

  try {
    const buffer = fs.readFileSync(documentPath);
    const fileName = path.basename(documentPath);

    console.log(`Extracting insurance data from: ${fileName}\n`);

    const result = await deepseekOCRIntegration.processDocument(
      buffer,
      fileName
    );

    if (!result.success || !result.deepseekResult) {
      console.log('Processing failed or no DeepSeek results available');
      return;
    }

    // Extract insurance-specific terms
    const insuranceTerms = result.deepseekResult.technicalTerms
      .filter(t => t.category === 'insurance');

    console.log('Insurance Terms Found:');
    console.log(`  Total: ${insuranceTerms.length} terms`);

    if (insuranceTerms.length > 0) {
      console.log(`\n  Top Insurance Terms:`);
      const uniqueTerms = [...new Set(insuranceTerms.map(t => t.term))];
      uniqueTerms.slice(0, 10).forEach(term => {
        console.log(`    - ${term}`);
      });
    }

    // Extract specific data using regex patterns
    console.log(`\n  Extracted Data:`);

    const claimMatch = result.extractedText.match(/claim[:\s#]*([A-Z0-9-]+)/i);
    if (claimMatch) {
      console.log(`    Claim Number: ${claimMatch[1]}`);
    }

    const policyMatch = result.extractedText.match(/policy[:\s#]*([A-Z0-9-]+)/i);
    if (policyMatch) {
      console.log(`    Policy Number: ${policyMatch[1]}`);
    }

    const dateMatch = result.extractedText.match(/date\s+of\s+loss[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
    if (dateMatch) {
      console.log(`    Date of Loss: ${dateMatch[1]}`);
    }

    const amountMatch = result.extractedText.match(/amount[:\s]*\$?([\d,]+\.?\d*)/i);
    if (amountMatch) {
      console.log(`    Amount: $${amountMatch[1]}`);
    }

    const phoneMatch = result.extractedText.match(/(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/);
    if (phoneMatch) {
      console.log(`    Phone: ${phoneMatch[1]}`);
    }

    console.log('');

  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

// ============================================================================
// EXAMPLE 4: ROOFING ESTIMATE ANALYSIS
// ============================================================================

export async function example4_roofingEstimateAnalysis() {
  console.log('========================================');
  console.log('EXAMPLE 4: Roofing Estimate Analysis');
  console.log('========================================\n');

  const documentPath = '/Users/a21/Desktop/Sales Rep Resources 2 copy/Brochure.pdf';

  try {
    const buffer = fs.readFileSync(documentPath);
    const fileName = path.basename(documentPath);

    console.log(`Analyzing roofing document: ${fileName}\n`);

    const result = await deepseekOCRIntegration.processDocument(
      buffer,
      fileName
    );

    if (!result.success || !result.deepseekResult) {
      console.log('Processing failed or no DeepSeek results available');
      return;
    }

    // Extract roofing-specific terms
    const roofingTerms = result.deepseekResult.technicalTerms
      .filter(t => t.category === 'roofing');

    console.log('Roofing Analysis:');
    console.log(`  Total Roofing Terms: ${roofingTerms.length}`);

    // Categorize by type
    const materials = roofingTerms.filter(t =>
      ['shingle', 'asphalt', 'membrane', 'TPO', 'EPDM'].some(m => t.term.toLowerCase().includes(m))
    );

    const components = roofingTerms.filter(t =>
      ['flashing', 'valley', 'ridge', 'drip edge', 'underlayment'].some(c => t.term.toLowerCase().includes(c))
    );

    const damage = roofingTerms.filter(t =>
      ['damage', 'crack', 'leak', 'missing', 'worn'].some(d => t.term.toLowerCase().includes(d))
    );

    console.log(`\n  Materials Mentioned: ${materials.length}`);
    if (materials.length > 0) {
      materials.slice(0, 5).forEach(t => console.log(`    - ${t.term}`));
    }

    console.log(`\n  Components Mentioned: ${components.length}`);
    if (components.length > 0) {
      components.slice(0, 5).forEach(t => console.log(`    - ${t.term}`));
    }

    console.log(`\n  Damage Indicators: ${damage.length}`);
    if (damage.length > 0) {
      damage.slice(0, 5).forEach(t => console.log(`    - ${t.term}`));
    }

    // Check document structure
    console.log(`\nDocument Structure:`);
    console.log(`  Has Tables: ${result.deepseekResult.documentStructure.hasTables ? '✓' : '✗'}`);
    console.log(`  Has Lists: ${result.deepseekResult.documentStructure.hasLists ? '✓' : '✗'}`);
    console.log(`  Paragraphs: ${result.deepseekResult.documentStructure.paragraphCount}`);

    console.log('');

  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

// ============================================================================
// EXAMPLE 5: QUALITY VALIDATION AND REPORTING
// ============================================================================

export async function example5_qualityValidation() {
  console.log('========================================');
  console.log('EXAMPLE 5: Quality Validation & Reporting');
  console.log('========================================\n');

  const documentPath = '/Users/a21/Desktop/Sales Rep Resources 2 copy/Copy of Sales Tracker (Example).xlsx';

  try {
    const buffer = fs.readFileSync(documentPath);
    const fileName = path.basename(documentPath);

    console.log(`Validating quality for: ${fileName}\n`);

    const result = await deepseekOCRIntegration.processDocument(
      buffer,
      fileName
    );

    if (!result.deepseekResult) {
      console.log('No DeepSeek results available for this document type');
      return;
    }

    // Display checkpoint results
    console.log('Checkpoint Results:');
    for (const checkpoint of result.deepseekResult.checkpoints) {
      const status = checkpoint.passed ? '✓ PASS' : '✗ FAIL';
      console.log(`\n  ${checkpoint.checkpointNumber}. ${checkpoint.checkpointName}`);
      console.log(`     Status: ${status}`);
      console.log(`     Score: ${checkpoint.score}/100`);
      console.log(`     Details: ${checkpoint.details}`);
      console.log(`     Duration: ${checkpoint.duration}ms`);
    }

    // Display quality metrics
    console.log(`\nQuality Metrics:`);
    const qm = result.deepseekResult.qualityMetrics;
    console.log(`  Overall Score: ${qm.overallScore.toFixed(1)}/100`);
    console.log(`  Text Completeness: ${qm.textCompleteness.toFixed(1)}/100`);
    console.log(`  Structure Preservation: ${qm.structurePreservation.toFixed(1)}/100`);
    console.log(`  Technical Accuracy: ${qm.technicalAccuracy.toFixed(1)}/100`);
    console.log(`  Readability: ${qm.readability.toFixed(1)}/100`);
    console.log(`  Confidence Level: ${qm.confidenceLevel.toUpperCase()}`);

    console.log(`\nRecommendation:`);
    console.log(`  ${qm.recommendedAction}`);

    // Generate full report
    const reportText = deepseekOCRIntegration.generateDocumentReport(result);

    // Save report to file
    const reportPath = '/tmp/deepseek-ocr-report.txt';
    fs.writeFileSync(reportPath, reportText);
    console.log(`\nFull report saved to: ${reportPath}`);

    console.log('');

  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

// ============================================================================
// EXAMPLE 6: CUSTOM CONFIGURATION
// ============================================================================

export async function example6_customConfiguration() {
  console.log('========================================');
  console.log('EXAMPLE 6: Custom Configuration');
  console.log('========================================\n');

  // Create custom OCR integration with specific settings
  const customOCR = new DeepSeekOCRIntegration({
    useDeepSeek: true,
    useTesseractFallback: false,         // Disable Tesseract
    enablePreprocessing: true,
    enableCaching: true,
    batchSize: 3,                        // Smaller batches
    minConfidenceThreshold: 80,          // Higher threshold
    deepseekApiEndpoint: 'http://localhost:11434/api/generate'
  });

  console.log('Custom Configuration:');
  console.log('  DeepSeek: Enabled');
  console.log('  Tesseract Fallback: Disabled');
  console.log('  Preprocessing: Enabled');
  console.log('  Caching: Enabled');
  console.log('  Batch Size: 3');
  console.log('  Min Confidence: 80%');
  console.log('');

  // Process a document with custom settings
  const documentPath = '/Users/a21/Desktop/Sales Rep Resources 2 copy/CoverageArea.JPG';

  try {
    const buffer = fs.readFileSync(documentPath);
    const fileName = path.basename(documentPath);

    console.log(`Processing with custom config: ${fileName}\n`);

    const result = await customOCR.processDocument(buffer, fileName);

    console.log('Results:');
    console.log(`  Success: ${result.success ? '✓' : '✗'}`);
    console.log(`  Used DeepSeek: ${result.usedDeepSeek ? '✓' : '✗'}`);
    console.log(`  Used Tesseract: ${result.usedTesseract ? '✓' : '✗'}`);

    if (result.deepseekResult) {
      const confidence = result.deepseekResult.confidence;
      console.log(`  Confidence: ${confidence.toFixed(1)}%`);

      if (confidence < 80) {
        console.log(`  ⚠️ Below threshold (80%) - document may need manual review`);
      } else {
        console.log(`  ✓ Above threshold - quality acceptable`);
      }
    }

    console.log('');

  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

// ============================================================================
// EXAMPLE 7: PREPROCESSING PIPELINE
// ============================================================================

export async function example7_preprocessingPipeline() {
  console.log('========================================');
  console.log('EXAMPLE 7: Preprocessing Pipeline');
  console.log('========================================\n');

  const documentPath = '/Users/a21/Desktop/Sales Rep Resources 2 copy/CoverageArea.JPG';

  try {
    const buffer = fs.readFileSync(documentPath);
    const fileName = path.basename(documentPath);

    console.log(`Preprocessing: ${fileName}\n`);

    // Create mock document
    const mockDoc = {
      fileName,
      fileType: 'image',
      fileSize: buffer.length,
      extractedText: '',
      metadata: {},
      processingTime: 0,
      success: true,
    };

    // Run preprocessing
    const prepResult = await deepseekPreprocessor.preprocessDocument(
      buffer,
      mockDoc
    );

    console.log('Preprocessing Results:');
    console.log(`  Success: ${prepResult.success ? '✓' : '✗'}`);
    console.log(`  Quality Score: ${prepResult.qualityScore}/100`);
    console.log(`  Original Size: ${(prepResult.originalSize / 1024).toFixed(2)} KB`);
    console.log(`  Enhanced Size: ${(prepResult.enhancedSize / 1024).toFixed(2)} KB`);

    console.log(`\nPreprocessing Steps:`);
    for (const step of prepResult.preprocessingSteps) {
      const status = step.applied ? '✓ Applied' : '○ Skipped';
      console.log(`  ${status} ${step.stepName}`);
      console.log(`    Details: ${step.details}`);
      console.log(`    Improvement: +${step.improvement}`);
      console.log(`    Duration: ${step.duration}ms`);
    }

    console.log(`\nRecommendations:`);
    for (const rec of prepResult.recommendations) {
      console.log(`  - ${rec}`);
    }

    console.log('');

  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

// ============================================================================
// EXAMPLE 8: CACHE MANAGEMENT
// ============================================================================

export async function example8_cacheManagement() {
  console.log('========================================');
  console.log('EXAMPLE 8: Cache Management');
  console.log('========================================\n');

  const documentPath = '/Users/a21/Desktop/Sales Rep Resources 2 copy/Adjuster_Inspector Information Sheet1.pdf';

  try {
    const buffer = fs.readFileSync(documentPath);
    const fileName = path.basename(documentPath);

    // Clear cache first
    deepseekOCRIntegration.clearCache();
    console.log('Cache cleared\n');

    // First processing (no cache)
    console.log('First processing (no cache)...');
    const start1 = Date.now();
    const result1 = await deepseekOCRIntegration.processDocument(buffer, fileName);
    const time1 = Date.now() - start1;
    console.log(`  Time: ${time1}ms`);
    console.log(`  Cached: ${result1.cached}`);

    // Second processing (with cache)
    console.log('\nSecond processing (with cache)...');
    const start2 = Date.now();
    const result2 = await deepseekOCRIntegration.processDocument(buffer, fileName);
    const time2 = Date.now() - start2;
    console.log(`  Time: ${time2}ms`);
    console.log(`  Cached: ${result2.cached}`);

    console.log(`\nSpeedup: ${(time1 / time2).toFixed(1)}x faster with cache`);

    // Get cache statistics
    const stats = deepseekOCRIntegration.getCacheStats();
    console.log(`\nCache Statistics:`);
    console.log(`  Size: ${stats.size} entries`);
    console.log(`  Total Hits: ${stats.totalHits}`);

    console.log(`\nCache Entries:`);
    for (const entry of stats.entries) {
      console.log(`  - ${entry.fileName}`);
      console.log(`    Hits: ${entry.hits}`);
      console.log(`    Cached at: ${entry.timestamp}`);
    }

    console.log('');

  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

// ============================================================================
// MAIN RUNNER
// ============================================================================

async function main() {
  const exampleNumber = process.argv[2];

  const examples = {
    '1': example1_basicProcessing,
    '2': example2_batchProcessing,
    '3': example3_insuranceDataExtraction,
    '4': example4_roofingEstimateAnalysis,
    '5': example5_qualityValidation,
    '6': example6_customConfiguration,
    '7': example7_preprocessingPipeline,
    '8': example8_cacheManagement,
  };

  if (exampleNumber && examples[exampleNumber as keyof typeof examples]) {
    await examples[exampleNumber as keyof typeof examples]();
  } else {
    console.log('DeepSeek OCR Examples\n');
    console.log('Usage: npx ts-node examples/deepseek-ocr-examples.ts [example-number]\n');
    console.log('Available Examples:');
    console.log('  1 - Basic Single Document Processing');
    console.log('  2 - Batch Processing Multiple Documents');
    console.log('  3 - Insurance Data Extraction');
    console.log('  4 - Roofing Estimate Analysis');
    console.log('  5 - Quality Validation & Reporting');
    console.log('  6 - Custom Configuration');
    console.log('  7 - Preprocessing Pipeline');
    console.log('  8 - Cache Management');
    console.log('');
    console.log('Example: npx ts-node examples/deepseek-ocr-examples.ts 1');
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}
