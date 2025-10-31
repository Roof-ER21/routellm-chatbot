# Bulletproof Batch Embedding Processing Strategy

## Overview

This guide provides a comprehensive, production-ready strategy for generating embeddings for 142 documents and uploading them to PostgreSQL with pgvector.

**Key Features:**
- Resumable batch processing (survives crashes/timeouts)
- Database transactions per batch (atomic commits)
- Comprehensive error handling and retry logic
- Progress tracking and cost estimation
- Railway-optimized (handles memory/timeout constraints)

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Batch Processing Strategy](#batch-processing-strategy)
3. [Setup Instructions](#setup-instructions)
4. [Execution Plan](#execution-plan)
5. [Monitoring & Verification](#monitoring--verification)
6. [Troubleshooting](#troubleshooting)
7. [Cost Estimation](#cost-estimation)

---

## System Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Batch Processor                          │
│                                                             │
│  ┌────────────┐   ┌──────────────┐   ┌─────────────┐      │
│  │  Document  │──▶│   Chunking   │──▶│  Embedding  │      │
│  │   Loader   │   │   (500/50)   │   │  Generator  │      │
│  └────────────┘   └──────────────┘   └─────────────┘      │
│                                             │               │
│                                             ▼               │
│                                      ┌─────────────┐        │
│                                      │  Database   │        │
│                                      │  Uploader   │        │
│                                      └─────────────┘        │
│                                             │               │
└─────────────────────────────────────────────┼───────────────┘
                                              ▼
                                    ┌──────────────────┐
                                    │  PostgreSQL +    │
                                    │    pgvector      │
                                    └──────────────────┘
```

### Data Flow

1. **Load Documents**: Read JSON files from `data/processed-kb/documents-ready/`
2. **Chunk Documents**: Split into 500-token chunks with 50-token overlap
3. **Generate Embeddings**: Call OpenAI API (batch sub-requests)
4. **Database Insert**: Atomic transaction per batch
5. **Save State**: Track progress for resume capability

---

## Batch Processing Strategy

### Recommended Configuration

| Parameter | Value | Reason |
|-----------|-------|--------|
| **Batch Size** | 15 documents | Balances memory usage with API efficiency |
| **Chunk Size** | 500 tokens | Optimal for retrieval quality |
| **Chunk Overlap** | 50 tokens | Prevents context loss at boundaries |
| **Embedding Model** | text-embedding-3-small | Cost-effective, 1536 dimensions |
| **Max Retries** | 3 | Handles transient API failures |
| **Rate Limit Delay** | 0.5 seconds | Prevents API throttling |

### Batch Strategy

With 132 documents in `documents-ready/`:

```
Total Batches = ceil(132 / 15) = 9 batches

Batch 1:  Documents 1-15    (15 docs)
Batch 2:  Documents 16-30   (15 docs)
Batch 3:  Documents 31-45   (15 docs)
Batch 4:  Documents 46-60   (15 docs)
Batch 5:  Documents 61-75   (15 docs)
Batch 6:  Documents 76-90   (15 docs)
Batch 7:  Documents 91-105  (15 docs)
Batch 8:  Documents 106-120 (15 docs)
Batch 9:  Documents 121-132 (12 docs)
```

### Database Transaction Strategy

Each batch follows this pattern:

```python
BEGIN TRANSACTION
  ├─ INSERT documents (15 docs)
  ├─ INSERT chunks with embeddings (~500 chunks)
  └─ COMMIT

  On Success:
    - Save progress state
    - Continue to next batch

  On Failure:
    - ROLLBACK transaction
    - Save state (mark failed documents)
    - Stop or retry
```

This ensures:
- ✅ Atomic commits (all or nothing per batch)
- ✅ No partial data in database
- ✅ Resume from last successful batch

---

## Setup Instructions

### 1. Install Dependencies

```bash
cd /Users/a21/routellm-chatbot

# Install required Python packages
pip install openai psycopg2-binary tiktoken
```

### 2. Set Environment Variables

Create a `.env` file or export variables:

```bash
# PostgreSQL connection (Railway or Vercel Postgres)
export DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"

# OpenAI API key
export OPENAI_API_KEY="sk-..."

# Optional: Test with smaller batch size first
export BATCH_SIZE=5
```

**Get your DATABASE_URL:**
- Railway: Dashboard → Database → Connect → Connection String
- Vercel Postgres: Project → Storage → Postgres → .env.local

### 3. Verify Database Schema

```bash
# Connect to your database
psql $DATABASE_URL

# Check tables exist
\dt rag_*

# Should see:
#   rag_documents
#   rag_chunks
#   rag_query_cache
#   rag_analytics

# If not, run the schema:
psql $DATABASE_URL < /Users/a21/routellm-chatbot/lib/db-schema-rag.sql
```

### 4. Verify Processed Documents

```bash
# Check documents are ready
ls -lh /Users/a21/routellm-chatbot/data/processed-kb/documents-ready/

# Should see 132 JSON files

# Check one document has extractedText
cat "/Users/a21/routellm-chatbot/data/processed-kb/documents-ready/Claim Authorization Form.json" | python3 -m json.tool
```

---

## Execution Plan

### Phase 1: Test Run (1 Batch)

**Goal:** Verify everything works end-to-end

```bash
cd /Users/a21/routellm-chatbot/scripts

# Test with 5 documents only
python3 batch_embeddings_processor.py \
  --batch-size 5 \
  --no-resume

# Expected output:
# - Processing Batch 1
# - Generated N embeddings
# - Inserted N chunks
# - Transaction committed
# - Progress saved to .batch_progress.json
```

**Verification:**

```bash
# Check database
psql $DATABASE_URL -c "SELECT COUNT(*) FROM rag_documents;"
# Should see: 5

psql $DATABASE_URL -c "SELECT COUNT(*) FROM rag_chunks;"
# Should see: ~150-200 chunks (depends on document length)

# Check state file
cat .batch_progress.json
```

**If test succeeds, proceed to Phase 2.**

---

### Phase 2: Full Processing (All Batches)

#### Option A: Process All at Once

```bash
# Process all 132 documents in 9 batches
python3 batch_embeddings_processor.py \
  --batch-size 15 \
  --reset-state

# Monitor progress in real-time:
tail -f batch_embeddings.log
```

**Expected Timeline:**
- Each batch: 2-5 minutes
- Total time: 18-45 minutes
- Cost: ~$0.10-0.20 (based on text-embedding-3-small pricing)

#### Option B: Process in Stages (Recommended for Railway)

If Railway has strict timeout limits, process in smaller stages:

```bash
# Stage 1: Batches 1-3 (45 documents)
python3 batch_embeddings_processor.py --batch-size 15 --reset-state

# Verify progress
cat .batch_progress.json | jq '.processed_documents'

# Stage 2: Batches 4-6 (45 documents) - auto-resumes
python3 batch_embeddings_processor.py --batch-size 15

# Stage 3: Batches 7-9 (42 documents) - auto-resumes
python3 batch_embeddings_processor.py --batch-size 15
```

Each stage can be run separately, even across deployments!

---

### Phase 3: Verify Completion

```bash
# Check total documents
psql $DATABASE_URL -c "SELECT COUNT(*) FROM rag_documents;"
# Expected: 132

# Check total chunks
psql $DATABASE_URL -c "SELECT COUNT(*) FROM rag_chunks;"
# Expected: 4000-6000 (depends on document lengths)

# Check embedding dimensions
psql $DATABASE_URL -c "SELECT embedding <-> embedding AS zero FROM rag_chunks LIMIT 1;"
# Expected: 0 (vector distance to itself)

# Verify categories
psql $DATABASE_URL -c "
  SELECT
    metadata->>'category' AS category,
    COUNT(*) AS chunk_count
  FROM rag_chunks
  GROUP BY metadata->>'category'
  ORDER BY chunk_count DESC;
"
```

---

## Monitoring & Verification

### Real-Time Monitoring

**Terminal 1: Watch logs**
```bash
tail -f /Users/a21/routellm-chatbot/scripts/batch_embeddings.log
```

**Terminal 2: Monitor progress**
```bash
watch -n 5 "cat /Users/a21/routellm-chatbot/scripts/.batch_progress.json | jq '{processed: .processed_documents, total: .total_documents, cost: .total_cost_usd}'"
```

**Terminal 3: Database stats**
```bash
watch -n 10 "psql $DATABASE_URL -c 'SELECT COUNT(*) AS docs FROM rag_documents; SELECT COUNT(*) AS chunks FROM rag_chunks;'"
```

### Check Batch Progress

```bash
# View detailed progress
cat .batch_progress.json | python3 -m json.tool

# Key fields:
# - processed_documents: How many done
# - current_batch: Which batch is next
# - total_cost_usd: Running cost
# - failed_documents: Any failures
# - completed_batches: Successfully finished batches
```

### Verify Embeddings Quality

```bash
# Test vector search
psql $DATABASE_URL << EOF
SELECT
  text,
  1 - (embedding <=> (SELECT embedding FROM rag_chunks LIMIT 1)) AS similarity
FROM rag_chunks
ORDER BY embedding <=> (SELECT embedding FROM rag_chunks LIMIT 1)
LIMIT 5;
EOF
```

---

## Troubleshooting

### Problem: OpenAI API Error (Rate Limit)

**Symptoms:**
```
Error generating embeddings: Rate limit exceeded
```

**Solution:**
```bash
# Increase delay between API calls
python3 batch_embeddings_processor.py --batch-size 10

# Edit script to increase RATE_LIMIT_DELAY from 0.5 to 1.0 seconds
```

---

### Problem: Database Connection Timeout

**Symptoms:**
```
Database connection failed: could not connect to server
```

**Solutions:**

1. **Verify connection string:**
```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1;"
```

2. **Check SSL mode:**
```bash
# Railway requires SSL
export DATABASE_URL="postgresql://user:pass@host:port/db?sslmode=require"
```

3. **Verify database is running:**
- Railway: Check dashboard for database status
- Vercel: Check storage tab

---

### Problem: Batch Fails Mid-Processing

**Symptoms:**
```
Error processing batch 5: ...
Transaction rolled back
```

**Solution:**

Batch processor automatically saves state. Simply re-run:

```bash
# Resume from last successful batch
python3 batch_embeddings_processor.py --batch-size 15

# The script will:
# 1. Load .batch_progress.json
# 2. Skip completed batches (1-4)
# 3. Retry batch 5
```

---

### Problem: Out of Memory (Railway)

**Symptoms:**
```
Killed
MemoryError
```

**Solutions:**

1. **Reduce batch size:**
```bash
python3 batch_embeddings_processor.py --batch-size 5
```

2. **Process in multiple runs:**
```bash
# Process 3 batches at a time
for i in {1..3}; do
  python3 batch_embeddings_processor.py --batch-size 5
  sleep 60  # Cool down period
done
```

3. **Upgrade Railway plan** (if needed)

---

### Problem: Duplicate Documents

**Symptoms:**
```
Database error: duplicate key value violates unique constraint
```

**Solution:**

The script uses `ON CONFLICT` clauses, so duplicates are updated, not errored. But if you want to start fresh:

```bash
# Clear database
psql $DATABASE_URL << EOF
TRUNCATE rag_chunks CASCADE;
TRUNCATE rag_documents CASCADE;
EOF

# Reset state
rm .batch_progress.json

# Re-run
python3 batch_embeddings_processor.py --batch-size 15 --reset-state
```

---

### Problem: No Text Extracted from Documents

**Symptoms:**
```
Skipping document doc_xxx - insufficient text
```

**Solution:**

Check if documents have `extractedText` field:

```bash
# Check a sample document
cat "/Users/a21/routellm-chatbot/data/processed-kb/documents-ready/Claim Authorization Form.json" | jq '.extractedText'

# If null, documents need OCR/text extraction first
# Run document extraction pipeline before embeddings
```

---

## Cost Estimation

### Pricing (text-embedding-3-small)

- **Model:** text-embedding-3-small
- **Cost:** $0.02 per 1M tokens
- **Dimensions:** 1536

### Estimated Costs

Based on 132 documents with average 3,000 words each:

```
Total words: 132 × 3,000 = 396,000 words
Total tokens: 396,000 × 1.3 ≈ 515,000 tokens
Cost: 515,000 × $0.00002 ≈ $0.10
```

**Actual cost will vary based on:**
- Document length
- Chunking overlap
- Retry attempts

**Monitor real-time cost:**
```bash
cat .batch_progress.json | jq '.total_cost_usd'
```

### Batch Cost Breakdown

With 15 documents per batch:

```
Per Batch Estimate:
- Documents: 15
- Tokens: ~58,000
- Cost: ~$0.012
- Time: 3-5 minutes

Total (9 batches):
- Cost: ~$0.10-0.15
- Time: 27-45 minutes
```

---

## Advanced Features

### Custom Chunking Strategy

Edit `batch_embeddings_processor.py`:

```python
# Line 124: Modify chunker initialization
self.chunker = DocumentChunker(
    chunk_size=300,  # Smaller chunks for more precision
    chunk_overlap=75  # More overlap for better context
)
```

### Add Metadata Filters

Enrich chunks with custom metadata:

```python
# Line 353: Modify metadata
metadata={
    'filename': doc['sourceFile'],
    'category': doc.get('category', 'unknown'),
    'doc_type': doc['type'],
    'state': doc.get('state', None),  # Add state filter
    'priority': doc.get('priority', 'normal')  # Add priority
}
```

### Parallel Batch Processing

For faster processing on powerful machines:

```python
from concurrent.futures import ThreadPoolExecutor

# Process multiple batches in parallel
with ThreadPoolExecutor(max_workers=3) as executor:
    futures = []
    for batch in batches:
        future = executor.submit(process_batch, batch)
        futures.append(future)
```

---

## Resume Capability

The batch processor automatically saves progress after each batch to `.batch_progress.json`.

**State File Contents:**

```json
{
  "total_documents": 132,
  "processed_documents": 45,
  "failed_documents": [],
  "current_batch": 3,
  "total_batches": 9,
  "total_chunks_processed": 1500,
  "total_tokens_used": 175000,
  "total_cost_usd": 0.035,
  "last_updated": "2025-10-31T10:30:00.000Z",
  "completed_batches": [1, 2, 3]
}
```

**Resume Examples:**

```bash
# Resume after crash
python3 batch_embeddings_processor.py --batch-size 15
# Automatically resumes from batch 4

# Start fresh (ignore previous state)
python3 batch_embeddings_processor.py --batch-size 15 --no-resume

# Reset everything
python3 batch_embeddings_processor.py --batch-size 15 --reset-state
```

---

## Production Checklist

Before running in production:

- [ ] Database schema deployed (`rag_documents`, `rag_chunks` tables exist)
- [ ] pgvector extension enabled
- [ ] DATABASE_URL environment variable set
- [ ] OPENAI_API_KEY environment variable set
- [ ] All 132 documents in `data/processed-kb/documents-ready/`
- [ ] Documents have `extractedText` or `content` field
- [ ] Tested with 1 batch successfully
- [ ] Monitoring setup (logs, database queries)
- [ ] Backup plan (state file, database backups)

---

## Summary

This batch processing system provides:

✅ **Resilience:** Survives crashes, timeouts, API failures
✅ **Transparency:** Real-time progress tracking and cost monitoring
✅ **Safety:** Atomic transactions, rollback on failure
✅ **Efficiency:** Optimized batch sizes and rate limiting
✅ **Resumability:** Continue from any point

**Next Steps:**

1. Run test batch (5 documents)
2. Verify database insertion
3. Run full processing (all 132 documents)
4. Verify vector search works
5. Integrate with RAG system

---

**Questions or Issues?**

Check logs: `/Users/a21/routellm-chatbot/scripts/batch_embeddings.log`
Check state: `/Users/a21/routellm-chatbot/scripts/.batch_progress.json`
Database queries in this guide's [Monitoring section](#monitoring--verification)

---

**Author:** Data Pipeline Engineer
**Date:** 2025-10-31
**Version:** 1.0
