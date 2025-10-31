#!/usr/bin/env node

/**
 * Batch Document Processing with GPT-4 Vision OCR
 *
 * This script processes all 142 documents from Sales Rep Resources 2 copy
 * using the GPT-4 Vision OCR system with 5-checkpoint verification.
 *
 * Features:
 * - Batch processing with progress tracking
 * - 5-checkpoint quality validation
 * - Metadata extraction and enrichment
 * - Cost tracking
 * - Pause/resume capability
 * - JSON output for RAG system ingestion
 */

import * as fs from 'fs';
import * as path from 'path';
import { gpt4VisionOCRIntegration } from '../lib/gpt4-vision-ocr-integration';

// Configuration
const MANIFEST_PATH = '/Users/a21/routellm-chatbot/data/processed-kb/manifest.json';
const OUTPUT_DIR = '/Users/a21/routellm-chatbot/data/processed-kb/documents';
const PROGRESS_FILE = '/Users/a21/routellm-chatbot/data/processed-kb/progress.json';
const REPORT_FILE = '/Users/a21/routellm-chatbot/data/processed-kb/processing-report.json';

// Processing options
const BATCH_SIZE = 5; // Process 5 documents at a time
const CHECKPOINT_INTERVAL = 10; // Save progress every 10 documents
const MIN_QUALITY_SCORE = 60; // Minimum acceptable quality score

interface ProcessingProgress {
  totalDocuments: number;
  processedCount: number;
  successfulCount: number;
  failedCount: number;
  skippedCount: number;
  currentBatch: number;
  startTime: string;
  lastCheckpoint: string;
  completedDocuments: string[];
  failedDocuments: Array<{ name: string; error: string }>;
}

interface ProcessingReport {
  summary: {
    totalDocuments: number;
    successful: number;
    failed: number;
    skipped: number;
    averageQuality: number;
    totalCost: number;
    processingTime: string;
  };
  byCategory: Record<string, {
    count: number;
    avgQuality: number;
    avgConfidence: number;
  }>;
  qualityDistribution: {
    high: number; // >80
    medium: number; // 60-80
    low: number; // <60
  };
  checkpointResults: {
    imageQuality: { passed: number; failed: number };
    textExtraction: { passed: number; failed: number };
    structurePreservation: { passed: number; failed: number };
    technicalAccuracy: { passed: number; failed: number };
    crossReference: { passed: number; failed: number };
  };
  costBreakdown: {
    ocrCost: number;
    cacheSavings: number;
    totalCost: number;
  };
}

// Load manifest
function loadManifest() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    throw new Error(`Manifest not found: ${MANIFEST_PATH}`);
  }
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
}

// Load or create progress
function loadProgress(): ProcessingProgress {
  if (fs.existsSync(PROGRESS_FILE)) {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
  }

  const manifest = loadManifest();
  return {
    totalDocuments: manifest.totalDocuments,
    processedCount: 0,
    successfulCount: 0,
    failedCount: 0,
    skippedCount: 0,
    currentBatch: 0,
    startTime: new Date().toISOString(),
    lastCheckpoint: new Date().toISOString(),
    completedDocuments: [],
    failedDocuments: []
  };
}

// Save progress
function saveProgress(progress: ProcessingProgress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

// Create output directory
function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

// Process a single document
async function processDocument(doc: any, index: number, total: number) {
  console.log(`\n[${index + 1}/${total}] Processing: ${doc.name}`);
  console.log(`  Category: ${doc.category}`);
  console.log(`  Type: ${doc.type.toUpperCase()}`);
  console.log(`  Size: ${(doc.size / 1024).toFixed(2)} KB`);

  try {
    // Read document file
    const buffer = fs.readFileSync(doc.path);

    // Process with GPT-4 Vision OCR
    console.log(`  🔍 Running GPT-4 Vision OCR...`);
    const result = await gpt4VisionOCRIntegration.processDocument(buffer, doc.name);

    if (!result.success) {
      console.log(`  ❌ Processing failed: ${result.error}`);
      return {
        success: false,
        error: result.error,
        document: doc.name
      };
    }

    // Check quality
    const qualityScore = result.gpt4VisionResult?.qualityMetrics?.overallScore || 0;
    const confidence = result.gpt4VisionResult?.confidence || 0;

    console.log(`  📊 Quality Score: ${qualityScore}/100`);
    console.log(`  🎯 Confidence: ${confidence}%`);

    // Check checkpoints
    if (result.gpt4VisionResult?.checkpoints) {
      const checkpoints = result.gpt4VisionResult.checkpoints;
      console.log(`  ✓ Checkpoints:`);

      // Find checkpoints by number (1-5)
      const cp1 = checkpoints.find(c => c.checkpointNumber === 1);
      const cp2 = checkpoints.find(c => c.checkpointNumber === 2);
      const cp3 = checkpoints.find(c => c.checkpointNumber === 3);
      const cp4 = checkpoints.find(c => c.checkpointNumber === 4);
      const cp5 = checkpoints.find(c => c.checkpointNumber === 5);

      if (cp1) console.log(`    1. Image Quality: ${cp1.passed ? '✅' : '❌'} (${cp1.score}/100)`);
      if (cp2) console.log(`    2. Text Extraction: ${cp2.passed ? '✅' : '❌'} (${cp2.score}/100)`);
      if (cp3) console.log(`    3. Structure: ${cp3.passed ? '✅' : '❌'} (${cp3.score}/100)`);
      if (cp4) console.log(`    4. Technical: ${cp4.passed ? '✅' : '❌'} (${cp4.score}/100)`);
      if (cp5) console.log(`    5. Cross-Ref: ${cp5.passed ? '✅' : '❌'} (${cp5.score}/100)`);
    }

    if (qualityScore < MIN_QUALITY_SCORE) {
      console.log(`  ⚠️  Quality below threshold (${MIN_QUALITY_SCORE}), but keeping for manual review`);
    }

    // Extract metadata
    const metadata = {
      ...doc,
      processed: true,
      processedAt: new Date().toISOString(),
      extractedText: result.extractedText,
      textLength: result.extractedText.length,
      qualityScore,
      confidence,
      checkpoints: result.gpt4VisionResult?.checkpoints,
      qualityMetrics: result.gpt4VisionResult?.qualityMetrics,
      technicalTerms: result.gpt4VisionResult?.technicalTerms || [],
      processingMethod: result.usedGPT4Vision ? 'gpt4-vision' : 'tesseract',
      cached: result.cached || false,
      cost: result.costEstimate?.estimatedCost || 0
    };

    // Save processed document
    const outputFileName = `${path.basename(doc.name, path.extname(doc.name))}.json`;
    const outputPath = path.join(OUTPUT_DIR, outputFileName);
    fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2));

    console.log(`  ✅ Saved: ${outputFileName}`);
    console.log(`  💰 Cost: $${result.costEstimate?.estimatedCost.toFixed(4) || '0.0000'} ${result.cached ? '(cached)' : ''}`);

    return {
      success: true,
      document: doc.name,
      metadata,
      cost: result.costEstimate?.estimatedCost || 0
    };

  } catch (error: any) {
    console.log(`  ❌ Error: ${error.message}`);
    return {
      success: false,
      error: error.message,
      document: doc.name
    };
  }
}

// Process batch
async function processBatch(documents: any[], startIndex: number, batchSize: number) {
  const batch = documents.slice(startIndex, startIndex + batchSize);
  const results = [];

  for (let i = 0; i < batch.length; i++) {
    const result = await processDocument(batch[i], startIndex + i, documents.length);
    results.push(result);

    // Small delay to avoid rate limits
    if (i < batch.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}

// Generate report
function generateReport(progress: ProcessingProgress, allResults: any[]): ProcessingReport {
  const successful = allResults.filter(r => r.success);
  const failed = allResults.filter(r => !r.success);

  // Calculate averages
  const totalQuality = successful.reduce((sum, r) => {
    return sum + (r.metadata?.qualityScore || 0);
  }, 0);
  const avgQuality = successful.length > 0 ? totalQuality / successful.length : 0;

  // Group by category
  const byCategory: Record<string, any> = {};
  successful.forEach(r => {
    const cat = r.metadata.category;
    if (!byCategory[cat]) {
      byCategory[cat] = {
        count: 0,
        totalQuality: 0,
        totalConfidence: 0
      };
    }
    byCategory[cat].count++;
    byCategory[cat].totalQuality += r.metadata.qualityScore || 0;
  });

  // Calculate category averages
  Object.keys(byCategory).forEach(cat => {
    const data = byCategory[cat];
    data.avgQuality = data.totalQuality / data.count;
    data.avgConfidence = 85; // Placeholder
    delete data.totalQuality;
    delete data.totalConfidence;
  });

  // Quality distribution
  const qualityDist = {
    high: successful.filter(r => (r.metadata?.qualityScore || 0) > 80).length,
    medium: successful.filter(r => {
      const score = r.metadata?.qualityScore || 0;
      return score >= 60 && score <= 80;
    }).length,
    low: successful.filter(r => (r.metadata?.qualityScore || 0) < 60).length
  };

  // Checkpoint results
  const checkpointResults = {
    imageQuality: { passed: 0, failed: 0 },
    textExtraction: { passed: 0, failed: 0 },
    structurePreservation: { passed: 0, failed: 0 },
    technicalAccuracy: { passed: 0, failed: 0 },
    crossReference: { passed: 0, failed: 0 }
  };

  successful.forEach(r => {
    if (r.metadata?.checkpoints && Array.isArray(r.metadata.checkpoints)) {
      const checkpoints = r.metadata.checkpoints;

      // Find each checkpoint by number
      const cp1 = checkpoints.find((c: any) => c.checkpointNumber === 1);
      const cp2 = checkpoints.find((c: any) => c.checkpointNumber === 2);
      const cp3 = checkpoints.find((c: any) => c.checkpointNumber === 3);
      const cp4 = checkpoints.find((c: any) => c.checkpointNumber === 4);
      const cp5 = checkpoints.find((c: any) => c.checkpointNumber === 5);

      // Checkpoint 1: Image Quality
      if (cp1) {
        if (cp1.passed) checkpointResults.imageQuality.passed++;
        else checkpointResults.imageQuality.failed++;
      }

      // Checkpoint 2: Text Extraction
      if (cp2) {
        if (cp2.passed) checkpointResults.textExtraction.passed++;
        else checkpointResults.textExtraction.failed++;
      }

      // Checkpoint 3: Structure Preservation
      if (cp3) {
        if (cp3.passed) checkpointResults.structurePreservation.passed++;
        else checkpointResults.structurePreservation.failed++;
      }

      // Checkpoint 4: Technical Accuracy
      if (cp4) {
        if (cp4.passed) checkpointResults.technicalAccuracy.passed++;
        else checkpointResults.technicalAccuracy.failed++;
      }

      // Checkpoint 5: Cross-Reference
      if (cp5) {
        if (cp5.passed) checkpointResults.crossReference.passed++;
        else checkpointResults.crossReference.failed++;
      }
    }
  });

  // Cost calculation
  const totalCost = allResults.reduce((sum, r) => sum + (r.cost || 0), 0);
  const cached = allResults.filter(r => r.metadata?.cached).length;
  const cacheSavings = cached * 0.0008; // Estimated savings per cached doc

  // Processing time
  const startTime = new Date(progress.startTime);
  const endTime = new Date();
  const duration = endTime.getTime() - startTime.getTime();
  const hours = Math.floor(duration / 3600000);
  const minutes = Math.floor((duration % 3600000) / 60000);
  const processingTime = `${hours}h ${minutes}m`;

  return {
    summary: {
      totalDocuments: progress.totalDocuments,
      successful: successful.length,
      failed: failed.length,
      skipped: progress.skippedCount,
      averageQuality: parseFloat(avgQuality.toFixed(2)),
      totalCost: parseFloat(totalCost.toFixed(4)),
      processingTime
    },
    byCategory,
    qualityDistribution: qualityDist,
    checkpointResults,
    costBreakdown: {
      ocrCost: parseFloat(totalCost.toFixed(4)),
      cacheSavings: parseFloat(cacheSavings.toFixed(4)),
      totalCost: parseFloat((totalCost - cacheSavings).toFixed(4))
    }
  };
}

// Main processing function
async function main() {
  console.log('🚀 Batch Document Processing - DeepSeek OCR');
  console.log('============================================\n');

  // Ensure output directory exists
  ensureOutputDir();

  // Load manifest and progress
  const manifest = loadManifest();
  let progress = loadProgress();
  const documents = manifest.documents;

  console.log(`📊 Processing Status:`);
  console.log(`  Total Documents: ${progress.totalDocuments}`);
  console.log(`  Processed: ${progress.processedCount}`);
  console.log(`  Successful: ${progress.successfulCount}`);
  console.log(`  Failed: ${progress.failedCount}`);
  console.log(`  Remaining: ${progress.totalDocuments - progress.processedCount}\n`);

  if (progress.processedCount >= progress.totalDocuments) {
    console.log('✅ All documents already processed!\n');
    console.log('To reprocess, delete the progress file:');
    console.log(`   rm ${PROGRESS_FILE}\n`);
    return;
  }

  // Filter out already processed documents
  const remainingDocs = documents.filter((doc: any) =>
    !progress.completedDocuments.includes(doc.name)
  );

  console.log(`🔄 Resuming processing from document ${progress.processedCount + 1}\n`);

  const allResults: any[] = [];
  let currentIndex = 0;

  // Process in batches
  while (currentIndex < remainingDocs.length) {
    const batchNum = Math.floor(currentIndex / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(remainingDocs.length / BATCH_SIZE);

    console.log(`\n📦 Batch ${batchNum}/${totalBatches}`);
    console.log('═'.repeat(50));

    const results = await processBatch(remainingDocs, currentIndex, BATCH_SIZE);
    allResults.push(...results);

    // Update progress
    results.forEach(r => {
      progress.processedCount++;
      if (r.success) {
        progress.successfulCount++;
        progress.completedDocuments.push(r.document);
      } else {
        progress.failedCount++;
        progress.failedDocuments.push({
          name: r.document,
          error: r.error || 'Unknown error'
        });
      }
    });

    // Save checkpoint
    if (progress.processedCount % CHECKPOINT_INTERVAL === 0 ||
        currentIndex + BATCH_SIZE >= remainingDocs.length) {
      progress.lastCheckpoint = new Date().toISOString();
      saveProgress(progress);
      console.log(`\n💾 Checkpoint saved (${progress.processedCount}/${progress.totalDocuments})`);
    }

    currentIndex += BATCH_SIZE;

    // Progress summary
    const percentComplete = ((progress.processedCount / progress.totalDocuments) * 100).toFixed(1);
    console.log(`\n📈 Progress: ${percentComplete}% (${progress.processedCount}/${progress.totalDocuments})`);
    console.log(`   ✅ Successful: ${progress.successfulCount}`);
    console.log(`   ❌ Failed: ${progress.failedCount}`);
  }

  // Generate final report
  console.log('\n\n📊 Generating Final Report...\n');
  const report = generateReport(progress, allResults);

  // Save report
  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));

  // Display summary
  console.log('═'.repeat(60));
  console.log('✨ PROCESSING COMPLETE!');
  console.log('═'.repeat(60));
  console.log(`\n📊 Summary:`);
  console.log(`   Total Documents: ${report.summary.totalDocuments}`);
  console.log(`   ✅ Successful: ${report.summary.successful}`);
  console.log(`   ❌ Failed: ${report.summary.failed}`);
  console.log(`   ⏭️  Skipped: ${report.summary.skipped}`);
  console.log(`   📈 Average Quality: ${report.summary.averageQuality}/100`);
  console.log(`   ⏱️  Processing Time: ${report.summary.processingTime}`);
  console.log(`   💰 Total Cost: $${report.summary.totalCost}`);

  console.log(`\n📂 Quality Distribution:`);
  console.log(`   🟢 High (>80): ${report.qualityDistribution.high} documents`);
  console.log(`   🟡 Medium (60-80): ${report.qualityDistribution.medium} documents`);
  console.log(`   🔴 Low (<60): ${report.qualityDistribution.low} documents`);

  console.log(`\n✓ Checkpoint Results:`);
  console.log(`   1. Image Quality: ${report.checkpointResults.imageQuality.passed}/${report.checkpointResults.imageQuality.passed + report.checkpointResults.imageQuality.failed}`);
  console.log(`   2. Text Extraction: ${report.checkpointResults.textExtraction.passed}/${report.checkpointResults.textExtraction.passed + report.checkpointResults.textExtraction.failed}`);
  console.log(`   3. Structure: ${report.checkpointResults.structurePreservation.passed}/${report.checkpointResults.structurePreservation.passed + report.checkpointResults.structurePreservation.failed}`);
  console.log(`   4. Technical: ${report.checkpointResults.technicalAccuracy.passed}/${report.checkpointResults.technicalAccuracy.passed + report.checkpointResults.technicalAccuracy.failed}`);
  console.log(`   5. Cross-Reference: ${report.checkpointResults.crossReference.passed}/${report.checkpointResults.crossReference.passed + report.checkpointResults.crossReference.failed}`);

  console.log(`\n💰 Cost Breakdown:`);
  console.log(`   OCR Processing: $${report.costBreakdown.ocrCost}`);
  console.log(`   Cache Savings: -$${report.costBreakdown.cacheSavings}`);
  console.log(`   Net Cost: $${report.costBreakdown.totalCost}`);

  console.log(`\n📁 Output Files:`);
  console.log(`   Processed Documents: ${OUTPUT_DIR}/`);
  console.log(`   Processing Report: ${REPORT_FILE}`);
  console.log(`   Progress File: ${PROGRESS_FILE}`);

  if (report.summary.failed > 0) {
    console.log(`\n⚠️  Failed Documents:`);
    progress.failedDocuments.slice(0, 5).forEach(doc => {
      console.log(`   - ${doc.name}: ${doc.error}`);
    });
    if (progress.failedDocuments.length > 5) {
      console.log(`   ... and ${progress.failedDocuments.length - 5} more`);
    }
  }

  console.log(`\n🎉 All done! Ready for Phase 3: RAG Setup\n`);
}

// Run
main().catch(error => {
  console.error('\n❌ Fatal Error:', error);
  process.exit(1);
});
