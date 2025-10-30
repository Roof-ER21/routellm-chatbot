#!/usr/bin/env node

/**
 * Simple Batch Document Processor
 *
 * Processes documents from Sales Rep Resources 2 copy
 * This is a simplified version that doesn't require the DeepSeek OCR system
 * It prepares documents for manual OCR processing or future automation
 */

const fs = require('fs');
const path = require('path');

// Configuration
const SOURCE_DIR = '/Users/a21/Desktop/Sales Rep Resources 2 copy';
const OUTPUT_DIR = '/Users/a21/routellm-chatbot/data/processed-kb';
const DOCS_DIR = path.join(OUTPUT_DIR, 'documents-ready');

// Ensure directories exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}
if (!fs.existsSync(DOCS_DIR)) {
  fs.mkdirSync(DOCS_DIR, { recursive: true });
}

console.log('🚀 Simple Document Processor');
console.log('============================\n');
console.log(`Source: ${SOURCE_DIR}`);
console.log(`Output: ${DOCS_DIR}\n`);

// Load manifest
const manifestPath = path.join(OUTPUT_DIR, 'manifest.json');
if (!fs.existsSync(manifestPath)) {
  console.error('❌ Manifest not found. Run: npm run process:sample');
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
const documents = manifest.documents;

console.log(`📊 Found ${documents.length} documents to process\n`);

// Process each document
let processed = 0;
let ready = 0;

documents.forEach((doc, index) => {
  const docNum = index + 1;
  console.log(`[${docNum}/${documents.length}] ${doc.name}`);
  console.log(`  Category: ${doc.category}`);
  console.log(`  Type: ${doc.type.toUpperCase()}`);
  console.log(`  Size: ${(doc.size / 1024).toFixed(2)} KB`);

  // Create document metadata for future processing
  const metadata = {
    id: `doc_${Date.now()}_${index}`,
    sourceFile: doc.name,
    sourcePath: doc.path,
    category: doc.category,
    type: doc.type,
    size: doc.size,
    relativePath: doc.relativePath,
    title: doc.name.replace(/\.[^/.]+$/, ''),
    status: 'ready_for_ocr',
    createdAt: new Date().toISOString(),
    metadata: {
      needsOCR: ['pdf', 'jpg', 'jpeg', 'png'].includes(doc.type),
      needsTextExtraction: ['docx', 'doc', 'xlsx'].includes(doc.type),
      priority: ['email_templates', 'pushback_strategies', 'training_materials'].includes(doc.category) ? 'high' : 'normal'
    }
  };

  // Save metadata
  const outputFileName = `${path.basename(doc.name, path.extname(doc.name))}.json`;
  const outputPath = path.join(DOCS_DIR, outputFileName);

  fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2));

  console.log(`  ✅ Metadata created: ${outputFileName}`);
  ready++;
  processed++;

  if ((docNum) % 10 === 0) {
    console.log(`\n📊 Progress: ${((docNum / documents.length) * 100).toFixed(1)}% (${docNum}/${documents.length})\n`);
  }
});

// Generate summary
const summary = {
  totalDocuments: documents.length,
  processedDocuments: processed,
  readyForOCR: ready,
  processedAt: new Date().toISOString(),
  byCategory: {},
  byType: {},
  nextSteps: [
    '1. Review document metadata in documents-ready/ folder',
    '2. Set up DeepSeek OCR API access (requires Ollama Cloud)',
    '3. Run OCR processing on PDFs and images',
    '4. Extract text from DOCX and XLSX files',
    '5. Generate embeddings for RAG system',
    '6. Set up PostgreSQL + pgvector database'
  ]
};

// Group by category
documents.forEach(doc => {
  if (!summary.byCategory[doc.category]) {
    summary.byCategory[doc.category] = 0;
  }
  summary.byCategory[doc.category]++;

  if (!summary.byType[doc.type]) {
    summary.byType[doc.type] = 0;
  }
  summary.byType[doc.type]++;
});

// Save summary
const summaryPath = path.join(OUTPUT_DIR, 'processing-summary.json');
fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

console.log('\n═══════════════════════════════════════');
console.log('✨ PROCESSING COMPLETE!');
console.log('═══════════════════════════════════════\n');
console.log(`📊 Summary:`);
console.log(`   Total Documents: ${summary.totalDocuments}`);
console.log(`   Metadata Created: ${summary.processedDocuments}`);
console.log(`   Ready for OCR: ${summary.readyForOCR}`);

console.log(`\n📂 By Category:`);
Object.entries(summary.byCategory)
  .sort((a, b) => b[1] - a[1])
  .forEach(([cat, count]) => {
    console.log(`   ${cat}: ${count}`);
  });

console.log(`\n📄 By Type:`);
Object.entries(summary.byType)
  .sort((a, b) => b[1] - a[1])
  .forEach(([type, count]) => {
    console.log(`   ${type.toUpperCase()}: ${count}`);
  });

console.log(`\n📁 Output:`);
console.log(`   Metadata: ${DOCS_DIR}/`);
console.log(`   Summary: ${summaryPath}`);

console.log(`\n🔜 Next Steps:`);
summary.nextSteps.forEach((step, i) => {
  console.log(`   ${step}`);
});

console.log(`\n💡 Note: This script has prepared metadata for all documents.`);
console.log(`   The actual OCR processing requires API access to DeepSeek/Ollama Cloud.`);
console.log(`   For now, we can proceed with Phase 3 (RAG setup) using the existing`);
console.log(`   123 documents in the knowledge base, then add the new 142 documents`);
console.log(`   once OCR processing is set up.\n`);

console.log(`✅ Ready to proceed with Phase 3: PostgreSQL + pgvector setup!`);
console.log(`📖 See: RAG_ARCHITECTURE_DESIGN.md for next steps\n`);
