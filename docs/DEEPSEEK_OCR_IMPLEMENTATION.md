# DeepSeek OCR Implementation Guide

## Step-by-Step Integration for Production

This guide walks you through implementing the DeepSeek OCR system in your routellm-chatbot project.

---

## Prerequisites

### 1. Verify Ollama Cloud Setup

```bash
# Check Ollama is running
curl http://localhost:11434/api/version

# Verify DeepSeek model is available
ollama list | grep deepseek

# Expected output:
# deepseek-v3.1:671b-cloud    ...
```

If DeepSeek model is not available:
```bash
# Pull DeepSeek Cloud model
ollama pull deepseek-v3.1:671b-cloud
```

### 2. Verify Project Dependencies

```bash
# All dependencies should already be installed
# If needed, run:
npm install
```

---

## Implementation Steps

### Step 1: Import the DeepSeek OCR Integration

In your API route or service file:

```typescript
// Import the integration layer
import { deepseekOCRIntegration } from '@/lib/deepseek-ocr-integration';

// Or create custom instance
import { DeepSeekOCRIntegration } from '@/lib/deepseek-ocr-integration';
const customOCR = new DeepSeekOCRIntegration({
  useDeepSeek: true,
  enableCaching: true,
  batchSize: 5,
  minConfidenceThreshold: 70
});
```

### Step 2: Replace Existing OCR Calls

#### Before (Basic Tesseract):

```typescript
import { DocumentProcessor } from './lib/document-processor';

const processor = new DocumentProcessor();
const result = await processor.processFile(file, fileName);

// Basic result:
// - extractedText
// - No confidence score
// - No quality metrics
// - No verification
```

#### After (DeepSeek OCR):

```typescript
import { deepseekOCRIntegration } from '@/lib/deepseek-ocr-integration';

const result = await deepseekOCRIntegration.processDocument(
  file,
  fileName,
  mimeType
);

// Enhanced result:
// - extractedText (improved accuracy)
// - confidence score (0-100)
// - quality metrics
// - 5 checkpoint results
// - technical term extraction
// - structure analysis
// - cost estimate
```

### Step 3: Handle Results with Quality Checking

```typescript
const result = await deepseekOCRIntegration.processDocument(
  buffer,
  fileName
);

if (!result.success) {
  // Handle failure
  console.error('OCR failed:', result.error);
  return;
}

// Check quality metrics
if (result.deepseekResult) {
  const quality = result.deepseekResult.qualityMetrics.overallScore;
  const confidence = result.deepseekResult.confidence;

  if (quality >= 90 && confidence >= 85) {
    // High quality - ready for production use
    console.log('✓ High quality extraction');
    // Use extracted text directly
  } else if (quality >= 70) {
    // Good quality - manual review recommended
    console.log('⚠️ Manual review recommended');
    // Flag for review
  } else {
    // Low quality - requires verification
    console.log('✗ Manual verification required');
    // Request manual processing
  }
}

// Use extracted text
const text = result.extractedText;
```

### Step 4: Implement Batch Processing

For multiple documents:

```typescript
import { deepseekOCRIntegration } from '@/lib/deepseek-ocr-integration';
import * as fs from 'fs';
import * as path from 'path';

async function processBatchDocuments(filePaths: string[]) {
  // Prepare files
  const files = filePaths.map(filePath => ({
    file: fs.readFileSync(filePath),
    fileName: path.basename(filePath)
  }));

  // Process batch
  const report = await deepseekOCRIntegration.processBatch(files);

  // Analyze results
  console.log(`Success Rate: ${report.successfulDocuments / report.totalDocuments * 100}%`);
  console.log(`Average Confidence: ${report.averageConfidence}%`);
  console.log(`Total Cost: $${report.totalCost}`);

  // Access individual results
  for (const docResult of report.documentReports) {
    if (docResult.success) {
      console.log(`✓ ${docResult.fileName}`);
      // Process extracted text
      processExtractedText(docResult.extractedText);
    }
  }

  return report;
}
```

### Step 5: Add Quality Reporting

Generate detailed reports for analysis:

```typescript
import { deepseekOCRIntegration } from '@/lib/deepseek-ocr-integration';

const result = await deepseekOCRIntegration.processDocument(buffer, fileName);

// Generate detailed report
const reportText = deepseekOCRIntegration.generateDocumentReport(result);

// Save report
fs.writeFileSync(
  `reports/${fileName}-report.txt`,
  reportText
);

// Or for batch processing
const batchReport = await deepseekOCRIntegration.processBatch(files);
const batchReportText = deepseekOCRIntegration.generateBatchReport(batchReport);

fs.writeFileSync(
  'reports/batch-report.txt',
  batchReportText
);
```

---

## Integration with Existing Routes

### Example: Update Document Upload API Route

Location: `/app/api/documents/upload/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { deepseekOCRIntegration } from '@/lib/deepseek-ocr-integration';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Process with DeepSeek OCR
    const result = await deepseekOCRIntegration.processDocument(
      file,
      file.name,
      file.type
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Processing failed' },
        { status: 500 }
      );
    }

    // Prepare response with quality metrics
    const response = {
      fileName: result.fileName,
      fileType: result.fileType,
      extractedText: result.extractedText,
      confidence: result.deepseekResult?.confidence || 0,
      qualityScore: result.deepseekResult?.qualityMetrics.overallScore || 0,
      checkpointsPassed: result.deepseekResult?.checkpoints.filter(c => c.passed).length || 0,
      totalCheckpoints: result.deepseekResult?.checkpoints.length || 0,
      technicalTermsFound: result.deepseekResult?.technicalTerms.length || 0,
      processingTime: result.processingTime,
      cost: result.costEstimate?.estimatedCost || 0,
      cached: result.cached,
      method: result.usedDeepSeek ? 'DeepSeek' : result.usedTesseract ? 'Tesseract' : 'Standard'
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

### Example: Batch Upload Route

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { deepseekOCRIntegration } from '@/lib/deepseek-ocr-integration';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files: File[] = [];

    // Get all files from form data
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        files.push(value);
      }
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // Prepare files for batch processing
    const fileData = files.map(file => ({
      file,
      fileName: file.name,
      mimeType: file.type
    }));

    // Process batch
    const report = await deepseekOCRIntegration.processBatch(fileData);

    // Prepare response
    const response = {
      totalDocuments: report.totalDocuments,
      successfulDocuments: report.successfulDocuments,
      failedDocuments: report.failedDocuments,
      averageConfidence: report.averageConfidence,
      averageQuality: report.averageQuality,
      totalProcessingTime: report.totalProcessingTime,
      totalCost: report.totalCost,
      documents: report.documentReports.map(doc => ({
        fileName: doc.fileName,
        success: doc.success,
        textLength: doc.extractedText.length,
        confidence: doc.deepseekResult?.confidence || 0,
        qualityScore: doc.deepseekResult?.qualityMetrics.overallScore || 0,
        cached: doc.cached,
        error: doc.error
      }))
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Batch upload error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

---

## Frontend Integration

### Update Frontend to Display Quality Metrics

```typescript
// In your frontend component
async function uploadDocument(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/documents/upload', {
    method: 'POST',
    body: formData
  });

  const data = await response.json();

  // Display results with quality metrics
  console.log('Document processed:');
  console.log(`  Confidence: ${data.confidence}%`);
  console.log(`  Quality Score: ${data.qualityScore}%`);
  console.log(`  Checkpoints: ${data.checkpointsPassed}/${data.totalCheckpoints} passed`);
  console.log(`  Technical Terms: ${data.technicalTermsFound}`);
  console.log(`  Method: ${data.method}`);
  console.log(`  Cost: $${data.cost.toFixed(6)}`);
  console.log(`  Cached: ${data.cached}`);

  // Handle based on quality
  if (data.qualityScore >= 90) {
    showSuccess('High quality extraction - ready to use');
  } else if (data.qualityScore >= 70) {
    showWarning('Good quality - manual review recommended');
  } else {
    showError('Low quality - manual verification required');
  }

  return data;
}
```

---

## Configuration Options

### Production Configuration

```typescript
import { DeepSeekOCRIntegration } from '@/lib/deepseek-ocr-integration';

const productionOCR = new DeepSeekOCRIntegration({
  useDeepSeek: true,                    // Enable DeepSeek
  useTesseractFallback: true,           // Enable fallback
  enablePreprocessing: true,            // Enhance quality
  enableCaching: true,                  // Reduce costs
  batchSize: 5,                         // Parallel processing
  minConfidenceThreshold: 70,           // Quality gate
  deepseekApiEndpoint: 'http://localhost:11434/api/generate'
});
```

### Development Configuration

```typescript
const developmentOCR = new DeepSeekOCRIntegration({
  useDeepSeek: true,
  useTesseractFallback: true,
  enablePreprocessing: false,           // Faster development
  enableCaching: true,
  batchSize: 2,                         // Smaller batches
  minConfidenceThreshold: 60,           // Lower threshold for testing
});
```

### Cost-Optimized Configuration

```typescript
const costOptimizedOCR = new DeepSeekOCRIntegration({
  useDeepSeek: true,
  useTesseractFallback: true,           // Use free Tesseract when possible
  enablePreprocessing: true,
  enableCaching: true,                  // Maximum cache usage
  batchSize: 10,                        // Larger batches
  minConfidenceThreshold: 60,
});
```

---

## Database Integration

### Store Results in Database

```typescript
import { db } from '@/lib/db';

async function storeOCRResults(result: EnhancedOCRResult) {
  if (!result.success) return;

  await db.query(`
    INSERT INTO ocr_results (
      file_name,
      file_type,
      extracted_text,
      confidence,
      quality_score,
      checkpoints_passed,
      technical_terms_count,
      processing_time,
      cost,
      cached,
      method,
      created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
  `, [
    result.fileName,
    result.fileType,
    result.extractedText,
    result.deepseekResult?.confidence || 0,
    result.deepseekResult?.qualityMetrics.overallScore || 0,
    result.deepseekResult?.checkpoints.filter(c => c.passed).length || 0,
    result.deepseekResult?.technicalTerms.length || 0,
    result.processingTime,
    result.costEstimate?.estimatedCost || 0,
    result.cached,
    result.usedDeepSeek ? 'DeepSeek' : result.usedTesseract ? 'Tesseract' : 'Standard'
  ]);
}
```

### Query Analytics

```typescript
async function getOCRAnalytics() {
  const result = await db.query(`
    SELECT
      COUNT(*) as total_documents,
      AVG(confidence) as avg_confidence,
      AVG(quality_score) as avg_quality,
      AVG(processing_time) as avg_processing_time,
      SUM(cost) as total_cost,
      COUNT(CASE WHEN cached THEN 1 END) as cached_count,
      method,
      COUNT(*) FILTER (WHERE quality_score >= 90) as high_quality_count,
      COUNT(*) FILTER (WHERE quality_score < 70) as low_quality_count
    FROM ocr_results
    WHERE created_at >= NOW() - INTERVAL '7 days'
    GROUP BY method
  `);

  return result.rows;
}
```

---

## Monitoring and Logging

### Add Monitoring

```typescript
import { deepseekOCRIntegration } from '@/lib/deepseek-ocr-integration';

async function monitoredOCRProcessing(file: File, fileName: string) {
  const startTime = Date.now();

  try {
    const result = await deepseekOCRIntegration.processDocument(
      file,
      fileName
    );

    // Log metrics
    console.log('[OCR Metrics]', {
      fileName,
      success: result.success,
      confidence: result.deepseekResult?.confidence,
      qualityScore: result.deepseekResult?.qualityMetrics.overallScore,
      processingTime: result.processingTime,
      cost: result.costEstimate?.estimatedCost,
      cached: result.cached,
      method: result.usedDeepSeek ? 'DeepSeek' : result.usedTesseract ? 'Tesseract' : 'Standard'
    });

    // Send to analytics service
    await sendToAnalytics({
      event: 'ocr_processing',
      properties: {
        fileName,
        success: result.success,
        confidence: result.deepseekResult?.confidence,
        duration: Date.now() - startTime
      }
    });

    return result;

  } catch (error: any) {
    console.error('[OCR Error]', {
      fileName,
      error: error.message,
      duration: Date.now() - startTime
    });

    throw error;
  }
}
```

---

## Testing in Production

### Gradual Rollout

```typescript
// Phase 1: Shadow mode (test without affecting users)
async function shadowModeOCR(file: File, fileName: string) {
  // Process with both systems
  const [legacyResult, deepseekResult] = await Promise.all([
    legacyOCRProcessor.process(file, fileName),
    deepseekOCRIntegration.processDocument(file, fileName)
  ]);

  // Compare results
  const comparison = {
    legacy: {
      textLength: legacyResult.extractedText.length,
      processingTime: legacyResult.processingTime
    },
    deepseek: {
      textLength: deepseekResult.extractedText.length,
      confidence: deepseekResult.deepseekResult?.confidence,
      qualityScore: deepseekResult.deepseekResult?.qualityMetrics.overallScore,
      processingTime: deepseekResult.processingTime
    }
  };

  // Log comparison
  console.log('[Shadow Mode Comparison]', comparison);

  // Return legacy result (no impact on users)
  return legacyResult;
}

// Phase 2: A/B testing (50% of users)
async function abTestOCR(file: File, fileName: string, userId: string) {
  const useDeepSeek = isInTestGroup(userId);

  if (useDeepSeek) {
    return await deepseekOCRIntegration.processDocument(file, fileName);
  } else {
    return await legacyOCRProcessor.process(file, fileName);
  }
}

// Phase 3: Full rollout with fallback
async function productionOCR(file: File, fileName: string) {
  try {
    const result = await deepseekOCRIntegration.processDocument(file, fileName);

    // Quality gate
    if (result.deepseekResult?.qualityMetrics.overallScore < 60) {
      // Fallback to legacy for low quality
      console.warn('[OCR] Low quality - using legacy system');
      return await legacyOCRProcessor.process(file, fileName);
    }

    return result;

  } catch (error: any) {
    // Fallback on error
    console.error('[OCR] Error - falling back to legacy:', error.message);
    return await legacyOCRProcessor.process(file, fileName);
  }
}
```

---

## Performance Optimization

### Optimize for Large Documents

```typescript
import { deepseekOCRIntegration } from '@/lib/deepseek-ocr-integration';

async function optimizedLargeDocumentProcessing(file: File, fileName: string) {
  // Check file size
  const sizeKB = file.size / 1024;

  if (sizeKB > 5120) { // >5MB
    console.log('[OCR] Large document detected - using optimized processing');

    // For very large documents:
    // 1. Split PDF into pages
    // 2. Process pages in batches
    // 3. Combine results

    // Example: Split PDF (pseudo-code)
    const pages = await splitPDFIntoPages(file);

    // Process in batches
    const batchSize = 5;
    const results = [];

    for (let i = 0; i < pages.length; i += batchSize) {
      const batch = pages.slice(i, i + batchSize);
      const batchResults = await deepseekOCRIntegration.processBatch(
        batch.map((page, idx) => ({
          file: page,
          fileName: `${fileName}-page-${i + idx + 1}`
        }))
      );
      results.push(...batchResults.documentReports);
    }

    // Combine results
    const combinedText = results
      .map(r => r.extractedText)
      .join('\n\n');

    return {
      extractedText: combinedText,
      pageResults: results
    };
  }

  // Normal processing for smaller files
  return await deepseekOCRIntegration.processDocument(file, fileName);
}
```

---

## Error Handling

### Comprehensive Error Handling

```typescript
import { deepseekOCRIntegration } from '@/lib/deepseek-ocr-integration';

async function robustOCRProcessing(file: File, fileName: string) {
  try {
    const result = await deepseekOCRIntegration.processDocument(
      file,
      fileName
    );

    if (!result.success) {
      // Handle specific failure cases
      if (result.error?.includes('API error')) {
        // API connection issue
        console.error('[OCR] API error - check Ollama connection');
        // Try fallback
        return await tesseractFallback(file, fileName);
      } else if (result.error?.includes('timeout')) {
        // Timeout issue
        console.error('[OCR] Timeout - document too large');
        // Suggest optimization
        throw new Error('Document too large - please split into smaller files');
      } else {
        // Generic error
        console.error('[OCR] Processing failed:', result.error);
        throw new Error(`OCR failed: ${result.error}`);
      }
    }

    // Success - check quality
    if (result.deepseekResult) {
      const quality = result.deepseekResult.qualityMetrics.overallScore;

      if (quality < 60) {
        // Low quality warning
        console.warn('[OCR] Low quality result:', quality);
        // You might want to flag for manual review
      }
    }

    return result;

  } catch (error: any) {
    console.error('[OCR] Unexpected error:', error);

    // Last resort fallback
    try {
      console.log('[OCR] Attempting emergency fallback');
      return await emergencyFallback(file, fileName);
    } catch (fallbackError: any) {
      console.error('[OCR] All fallbacks failed');
      throw new Error('Document processing failed completely');
    }
  }
}
```

---

## Summary

You now have a complete implementation guide for the DeepSeek OCR system. Key steps:

1. **Verify Prerequisites**: Ollama Cloud and DeepSeek model
2. **Import Integration**: Use `deepseekOCRIntegration`
3. **Replace OCR Calls**: Swap basic OCR with DeepSeek
4. **Handle Quality**: Check confidence and quality scores
5. **Implement Batch Processing**: For multiple documents
6. **Add Reporting**: Generate detailed reports
7. **Monitor Performance**: Track metrics and costs
8. **Optimize**: Use caching, batching, preprocessing

The system is production-ready with comprehensive error handling, quality validation, and cost optimization.
