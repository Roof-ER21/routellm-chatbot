#!/usr/bin/env node

/**
 * Test GPT-4 Vision OCR on Sample Document
 *
 * Quick test to verify the GPT-4 Vision OCR engine works correctly
 */

import * as fs from 'fs';
import * as path from 'path';
import { gpt4VisionOCRIntegration } from '../lib/gpt4-vision-ocr-integration';

async function testOCR() {
  console.log('🧪 Testing GPT-4 Vision OCR Engine');
  console.log('═'.repeat(60));

  // Find a sample document
  const sampleDir = '/Users/a21/routellm-chatbot/data/processed-kb/documents-ready';
  const files = fs.readdirSync(sampleDir).filter(f => f.endsWith('.json'));

  if (files.length === 0) {
    console.error('❌ No documents found in', sampleDir);
    console.log('\n💡 Tip: Make sure you have documents in data/processed-kb/documents-ready/');
    process.exit(1);
  }

  const sampleFile = files[0];
  console.log(`\n📄 Sample Document: ${sampleFile}`);

  // Load document metadata
  const docPath = path.join(sampleDir, sampleFile);
  const docMeta = JSON.parse(fs.readFileSync(docPath, 'utf-8'));

  console.log(`   Source: ${docMeta.sourceFile}`);
  console.log(`   Category: ${docMeta.category}`);
  console.log(`   Size: ${(docMeta.size / 1024).toFixed(2)} KB`);

  // Read the actual PDF/image file
  const sourcePath = docMeta.sourcePath;

  if (!fs.existsSync(sourcePath)) {
    console.error(`❌ Source file not found: ${sourcePath}`);
    console.log('\n💡 The JSON metadata exists but the source file is missing');
    console.log('   This is expected if the original files were moved');
    console.log('\n📝 What you can do:');
    console.log('   1. Use the batch processor with your actual documents');
    console.log('   2. Or provide a test PDF/image file path below');
    process.exit(1);
  }

  console.log(`\n🔍 Processing with GPT-4 Vision OCR...`);

  const startTime = Date.now();

  try {
    const buffer = fs.readFileSync(sourcePath);

    const result = await gpt4VisionOCRIntegration.processDocument(
      buffer,
      docMeta.sourceFile
    );

    const elapsed = Date.now() - startTime;

    console.log('\n═'.repeat(60));
    console.log('✅ OCR PROCESSING COMPLETE');
    console.log('═'.repeat(60));

    console.log('\n📊 Results:');
    console.log(`   Success: ${result.success ? '✅' : '❌'}`);
    console.log(`   Method: ${result.usedGPT4Vision ? 'GPT-4 Vision' : result.usedTesseract ? 'Tesseract' : 'Standard'}`);
    console.log(`   Processing Time: ${elapsed}ms`);

    if (result.gpt4VisionResult) {
      const vr = result.gpt4VisionResult;

      console.log('\n🎯 Quality Metrics:');
      console.log(`   Overall Score: ${vr.qualityMetrics.overallScore.toFixed(1)}/100`);
      console.log(`   Confidence: ${vr.confidence.toFixed(1)}%`);
      console.log(`   Text Completeness: ${vr.qualityMetrics.textCompleteness.toFixed(1)}/100`);
      console.log(`   Structure Preservation: ${vr.qualityMetrics.structurePreservation.toFixed(1)}/100`);
      console.log(`   Technical Accuracy: ${vr.qualityMetrics.technicalAccuracy.toFixed(1)}/100`);
      console.log(`   Readability: ${vr.qualityMetrics.readability.toFixed(1)}/100`);
      console.log(`   Confidence Level: ${vr.qualityMetrics.confidenceLevel.toUpperCase()}`);

      console.log('\n📐 Document Structure:');
      console.log(`   Headers: ${vr.documentStructure.hasHeaders ? '✓' : '✗'}`);
      console.log(`   Tables: ${vr.documentStructure.hasTables ? '✓' : '✗'} (${vr.documentStructure.tableCount})`);
      console.log(`   Lists: ${vr.documentStructure.hasLists ? '✓' : '✗'} (${vr.documentStructure.listCount})`);
      console.log(`   Paragraphs: ${vr.documentStructure.paragraphCount}`);

      console.log('\n🔧 Technical Terms Found:');
      const byCategory = {
        roofing: vr.technicalTerms.filter(t => t.category === 'roofing').length,
        insurance: vr.technicalTerms.filter(t => t.category === 'insurance').length,
        building_code: vr.technicalTerms.filter(t => t.category === 'building_code').length,
        general: vr.technicalTerms.filter(t => t.category === 'general').length,
      };
      console.log(`   Total: ${vr.technicalTerms.length} terms`);
      console.log(`   Roofing: ${byCategory.roofing}`);
      console.log(`   Insurance: ${byCategory.insurance}`);
      console.log(`   Building Codes: ${byCategory.building_code}`);
      console.log(`   General: ${byCategory.general}`);

      if (vr.technicalTerms.length > 0) {
        console.log('\n   Sample Terms:');
        vr.technicalTerms.slice(0, 10).forEach(term => {
          console.log(`     - ${term.term} (${term.category})`);
        });
      }

      console.log('\n✅ Checkpoint Results:');
      vr.checkpoints.forEach(cp => {
        const status = cp.passed ? '✅ PASS' : '❌ FAIL';
        console.log(`   ${cp.checkpointNumber}. ${cp.checkpointName}: ${status} (${cp.score}/100)`);
        console.log(`      ${cp.details}`);
      });

      console.log('\n💰 Cost Analysis:');
      console.log(`   API Calls: ${result.costEstimate?.apiCalls || 0}`);
      console.log(`   Estimated Tokens: ${result.costEstimate?.estimatedTokens.toFixed(0) || 0}`);
      console.log(`   Cost: $${result.costEstimate?.estimatedCost.toFixed(6) || '0.000000'}`);

      console.log('\n📝 Extracted Text Preview (first 500 characters):');
      console.log('─'.repeat(60));
      console.log(result.extractedText.substring(0, 500));
      if (result.extractedText.length > 500) {
        console.log('...');
        console.log(`(${result.extractedText.length - 500} more characters)`);
      }
      console.log('─'.repeat(60));

      console.log('\n💡 Recommendation:');
      console.log(`   ${vr.qualityMetrics.recommendedAction}`);

    } else if (result.error) {
      console.log('\n❌ Error:', result.error);
    }

    console.log('\n═'.repeat(60));
    console.log('🎉 Test Complete!');
    console.log('═'.repeat(60));

    console.log('\n📋 Next Steps:');
    console.log('   1. If quality is good, run batch processing:');
    console.log('      npm run process:batch');
    console.log('');
    console.log('   2. After batch processing, generate embeddings:');
    console.log('      curl -X POST https://s21.up.railway.app/api/admin/generate-embeddings');
    console.log('');
    console.log('   3. Set up Langflow RAG pipeline (see LANGFLOW_RAG_GUIDE.md)');

  } catch (error: any) {
    console.error('\n❌ Test Failed:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run test
testOCR();
