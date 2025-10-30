# 🚀 Phase 2 Quick Start - Document Processing

**Status:** Ready to Execute
**Duration:** 3-5 days
**Cost:** ~$0.27 (one-time)

---

## 🎯 What Phase 2 Does

Phase 2 processes all 142 documents from "Sales Rep Resources 2 copy" using the DeepSeek OCR system with 5-checkpoint verification:

1. **Extract text** from PDFs, DOCX, images (85-95% accuracy)
2. **Validate quality** with 5 checkpoints
3. **Generate metadata** (success rates, states, scenarios, citations)
4. **Prepare for RAG** (embeddings and vector database)

---

## ✅ Prerequisites

### Already Complete
- ✅ DeepSeek OCR system built (6,135 lines of code)
- ✅ Document manifest created (142 documents categorized)
- ✅ Susan's personality preserved
- ✅ Processing scripts ready

### Environment Variables Needed
```bash
# Add to .env.local if not already there
OPENAI_API_KEY=your_key_here  # For embeddings (Phase 3)
OLLAMA_API_KEY=your_key_here  # For DeepSeek OCR
```

---

## 🏃 Quick Start (3 Commands)

### Option 1: Full Batch Processing (Recommended)

```bash
cd /Users/a21/routellm-chatbot

# 1. Install TypeScript runtime (if not installed)
npm install

# 2. Run batch processing on all 142 documents
npm run process:batch

# Expected output:
# - Processes documents in batches of 5
# - Shows progress after each document
# - Saves checkpoints every 10 documents
# - Generates quality report at end
# - Time: 2-4 hours
# - Cost: ~$0.12-0.27
```

### Option 2: Sample Processing (Test First)

```bash
# Process just the manifest (no OCR, instant)
npm run process:sample

# See what will be processed:
# - 142 documents discovered
# - Categorized by type
# - Ready for OCR
```

---

## 📊 What to Expect

### Processing Output

```
🚀 Batch Document Processing - DeepSeek OCR
============================================

📊 Processing Status:
  Total Documents: 142
  Processed: 0
  Successful: 0
  Failed: 0
  Remaining: 142

🔄 Resuming processing from document 1

📦 Batch 1/29
══════════════════════════════════════════════════

[1/142] Processing: Adjuster_Inspector Information.xlsx
  Category: reference
  Type: XLSX
  Size: 33.78 KB
  🔍 Running DeepSeek OCR...
  📊 Quality Score: 87/100
  🎯 Confidence: HIGH
  ✓ Checkpoints:
    1. Image Quality: ✅ (92/100)
    2. Text Extraction: ✅ (85/100)
    3. Structure: ✅ (88/100)
    4. Technical: ✅ (82/100)
    5. Cross-Ref: ✅ (90/100)
  ✅ Saved: Adjuster_Inspector_Information.json
  💰 Cost: $0.0008

[2/142] Processing: Claim Authorization Form.pdf
  ...

💾 Checkpoint saved (10/142)

📈 Progress: 7.0% (10/142)
   ✅ Successful: 9
   ❌ Failed: 1
```

### Final Report

```
═══════════════════════════════════════════════════════════
✨ PROCESSING COMPLETE!
═══════════════════════════════════════════════════════════

📊 Summary:
   Total Documents: 142
   ✅ Successful: 138
   ❌ Failed: 4
   ⏭️  Skipped: 0
   📈 Average Quality: 84.5/100
   ⏱️  Processing Time: 2h 15m
   💰 Total Cost: $0.11

📂 Quality Distribution:
   🟢 High (>80): 112 documents
   🟡 Medium (60-80): 24 documents
   🔴 Low (<60): 2 documents

✓ Checkpoint Results:
   1. Image Quality: 135/138
   2. Text Extraction: 138/138
   3. Structure: 130/138
   4. Technical: 128/138
   5. Cross-Reference: 132/138

💰 Cost Breakdown:
   OCR Processing: $0.11
   Cache Savings: -$0.00
   Net Cost: $0.11

📁 Output Files:
   Processed Documents: /Users/a21/routellm-chatbot/data/processed-kb/documents/
   Processing Report: /Users/a21/routellm-chatbot/data/processed-kb/processing-report.json
   Progress File: /Users/a21/routellm-chatbot/data/processed-kb/progress.json

🎉 All done! Ready for Phase 3: RAG Setup
```

---

## 📁 Output Structure

After processing, you'll have:

```
/Users/a21/routellm-chatbot/data/processed-kb/
├── manifest.json                    # Original manifest
├── progress.json                    # Processing progress (for resume)
├── processing-report.json           # Final quality report
├── sample-processed-doc.json        # Example structure
└── documents/                       # 138+ processed documents
    ├── Adjuster_Inspector_Information.json
    ├── Claim_Authorization_Form.json
    ├── Emergency_Tarp.json
    ├── GAF_Golden_Pledge_Warranty.json
    ├── IRC_R908_3_Code_Reference.json
    └── ... (138+ more)
```

### Processed Document Structure

Each JSON file contains:

```json
{
  "name": "GAF_Golden_Pledge_Warranty.pdf",
  "category": "warranties",
  "type": "pdf",
  "size": 245680,
  "processed": true,
  "processedAt": "2025-10-30T18:30:15.000Z",
  "extractedText": "GAF GOLDEN PLEDGE® WARRANTY...",
  "textLength": 4520,
  "qualityScore": 89,
  "confidence": "HIGH",
  "checkpoints": {
    "imageQuality": { "passed": true, "score": 95 },
    "textExtraction": { "passed": true, "score": 92 },
    "structurePreservation": { "passed": true, "score": 87 },
    "technicalAccuracy": { "passed": true, "score": 85 },
    "crossReference": { "passed": true, "score": 88 }
  },
  "qualityMetrics": {
    "overallScore": 89,
    "completeness": 95,
    "structure": 87,
    "accuracy": 92,
    "readability": 90
  },
  "technicalTerms": [
    "GAF", "warranty", "coverage", "installation",
    "IRC R908.3", "underlayment", "ice barrier"
  ],
  "processingMethod": "deepseek",
  "cached": false
}
```

---

## 🔧 Troubleshooting

### Issue: TypeScript Execution Error

**Error:**
```
TypeError: Unknown file extension ".ts"
```

**Solution:**
```bash
# Install tsx
npm install --save-dev tsx

# Run with tsx
npx tsx scripts/batch-process-documents.ts
```

### Issue: Missing Environment Variables

**Error:**
```
Error: OLLAMA_API_KEY not found
```

**Solution:**
```bash
# Add to .env.local
echo "OLLAMA_API_KEY=your_key_here" >> .env.local
```

### Issue: Out of Memory

**Error:**
```
JavaScript heap out of memory
```

**Solution:**
```bash
# Increase Node memory
NODE_OPTIONS="--max-old-space-size=4096" npm run process:batch
```

### Issue: Rate Limiting

**Symptoms:** Processing slows down, errors increase

**Solution:** The script already includes:
- 1-second delay between documents
- Automatic retries with exponential backoff
- Circuit breakers

If still happening, edit `scripts/batch-process-documents.ts`:
```typescript
// Change delay from 1000ms to 2000ms
await new Promise(resolve => setTimeout(resolve, 2000));
```

---

## ⏸️ Pause & Resume

The batch processor automatically saves progress every 10 documents.

**To pause:**
- Press `Ctrl+C`
- Progress is saved automatically

**To resume:**
```bash
# Just run again - it will resume from last checkpoint
npm run process:batch

# Output will show:
# "Processed: 37"
# "Remaining: 105"
# "Resuming from document 38"
```

**To restart from beginning:**
```bash
# Delete progress file
rm /Users/a21/routellm-chatbot/data/processed-kb/progress.json

# Run again
npm run process:batch
```

---

## 📈 Monitoring Progress

### Real-time Progress

The script shows progress after each batch:
```
📈 Progress: 35.2% (50/142)
   ✅ Successful: 48
   ❌ Failed: 2
```

### Check Processing Report

```bash
# View current progress
cat /Users/a21/routellm-chatbot/data/processed-kb/progress.json

# View final report (after completion)
cat /Users/a21/routellm-chatbot/data/processed-kb/processing-report.json
```

### Count Processed Documents

```bash
# Count JSON files in output directory
ls -1 /Users/a21/routellm-chatbot/data/processed-kb/documents/*.json | wc -l
```

---

## 💰 Cost Tracking

### Expected Costs

| Task | Per Document | Total (142 docs) |
|------|-------------|------------------|
| DeepSeek OCR | $0.0008 | $0.11 |
| Metadata (Phase 3) | $0.0010 | $0.15 |
| **Total** | **$0.0018** | **$0.26** |

### Cost Optimization

The system automatically:
- ✅ Caches results (30-60% savings)
- ✅ Falls back to Tesseract for simple docs (free)
- ✅ Reuses embeddings when possible
- ✅ Batches API calls

### Monitor Costs

```bash
# Check total cost in report
cat /Users/a21/routellm-chatbot/data/processed-kb/processing-report.json | grep totalCost
```

---

## ✅ Success Criteria

Phase 2 is complete when:

- [  ] All 142 documents processed
- [  ] Average quality score >80/100
- [  ] <5 documents failed
- [  ] Checkpoint pass rate >90%
- [  ] Total cost <$0.30
- [  ] Processing report generated
- [  ] Ready for Phase 3 (RAG setup)

---

## 🚀 After Phase 2

Once processing is complete, you're ready for Phase 3:

### Phase 3: RAG Infrastructure Setup

1. **Deploy PostgreSQL + pgvector** (2-3 days)
2. **Generate embeddings** (1-2 days)
3. **Set up Redis cache** (1 day)
4. **Test retrieval** (1 day)

**Time:** 5-7 days
**Cost:** $0.06 (embeddings) + $32/month (database)

---

## 📞 Quick Commands Reference

```bash
# Process all 142 documents
npm run process:batch

# View manifest only
npm run process:sample

# Check progress
cat data/processed-kb/progress.json

# View report
cat data/processed-kb/processing-report.json

# Count processed
ls -1 data/processed-kb/documents/*.json | wc -l

# Resume processing (if interrupted)
npm run process:batch

# Restart from beginning
rm data/processed-kb/progress.json && npm run process:batch
```

---

## 🎯 Ready to Start?

**Run this command to begin:**

```bash
cd /Users/a21/routellm-chatbot
npm run process:batch
```

**Expected time:** 2-4 hours
**Expected cost:** $0.11-0.27
**Expected quality:** 85-90% average

---

**Once complete, you'll have 138+ high-quality processed documents ready for the RAG system!** 🎉

**Susan's personality preserved throughout. Ready to make her even smarter with all this new knowledge!** 🤝💪
