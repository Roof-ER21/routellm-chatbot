# RAG Database Status Summary

**Date**: October 31, 2025
**System**: Susan AI-21 on Railway
**Database**: PostgreSQL + pgvector
**Deployment**: https://s21.up.railway.app

---

## Current State: NOT VERIFIED

**Unable to verify database due to network restrictions**

The Railway PostgreSQL database uses an internal hostname (`postgres.railway.internal`) that is only accessible from within the Railway deployment environment, not from local development machines.

---

## What Was Created

### 1. API Health Endpoint (DEPLOYED)

**File**: `/Users/a21/routellm-chatbot/app/api/health/rag/route.ts`

**URL**: `https://s21.up.railway.app/api/health/rag`

**Status**: Code deployed to GitHub, awaiting Railway rebuild

**Features**:
- Real-time database health checks
- pgvector extension verification
- Table and index validation
- Document and chunk counts
- Embedding completeness check
- Actionable recommendations

**Usage** (after Railway finishes deploying):
```bash
curl https://s21.up.railway.app/api/health/rag | jq .
```

---

### 2. CLI Verification Script

**File**: `/Users/a21/routellm-chatbot/scripts/verify-rag-database.js`

**Features**:
- Comprehensive 6-step verification process
- Detailed error reporting
- Sample data inspection
- Performance recommendations

**Usage**:
```bash
railway run node scripts/verify-rag-database.js
```

**Note**: Cannot be executed from local machine due to network restrictions. Must run within Railway environment.

---

## Database Schema Overview

### Expected Tables

| Table | Purpose | Expected Rows | Status |
|-------|---------|---------------|--------|
| `rag_documents` | Source documents | 140-142 | Unknown |
| `rag_chunks` | Document chunks + embeddings | 800-1000 | Unknown |
| `rag_query_cache` | Query result caching | 0 (grows over time) | Unknown |
| `rag_analytics` | Usage tracking | 0 (grows over time) | Unknown |

### Critical Components

**pgvector Extension**:
- Required for vector similarity search
- Must be version 0.5.0+
- Status: Unknown (needs verification)

**HNSW Index**:
- Required for fast (<100ms) vector search
- Index name: `idx_chunks_embedding_hnsw`
- Status: Unknown (needs verification)

**Embeddings**:
- Model: OpenAI text-embedding-3-small
- Dimensions: 1536
- Status: Not generated (confirmed from logs)

---

## Known Issues from Logs

### Issue 1: No Embeddings Generated

**Evidence**:
```
[RAGService] No embeddings file found at: /app/data/susan_ai_embeddings.json
[RAGService] Run: npm run kb:build to generate embeddings
```

**Impact**: RAG system is not operational

**Root Cause**: Database tables may not be initialized, or embeddings haven't been generated

---

### Issue 2: Out of Memory During Processing

**Evidence**:
```
FATAL ERROR: Ineffective mark-compacts near heap limit
Allocation failed - JavaScript heap out of memory
```

**Impact**: Cannot process all documents in a single batch

**Root Cause**: Railway container memory limit (likely 512MB-1GB)

**Solution**: Increase memory or batch process

---

### Issue 3: Documents Not on Railway

**Location**: Processed documents exist locally at:
```
/Users/a21/routellm-chatbot/data/processed-kb/documents/
```

**Count**: 142 JSON files (140 successful)

**Impact**: Cannot generate embeddings without documents

**Solution**: Deploy documents to Railway via git

---

## Verification Commands

### Option 1: Via API (Recommended)

**After Railway finishes deploying**:
```bash
# Check RAG database status
curl https://s21.up.railway.app/api/health/rag | jq .

# Expected response (if schema initialized but no data):
{
  "status": "degraded",
  "checks": {
    "database": true,
    "pgvector": true,
    "tables": {
      "rag_documents": true,
      "rag_chunks": true
    },
    "counts": {
      "documents": 0,
      "chunks": 0
    },
    "indexes": {
      "hnsw": true
    }
  },
  "issues": [
    "No documents found in rag_documents table"
  ],
  "recommendations": [
    "Generate embeddings: npm run rag:build"
  ]
}
```

---

### Option 2: Via Direct SQL (If Database Credentials Available)

```sql
-- 1. Check pgvector extension
SELECT extname, extversion
FROM pg_extension
WHERE extname = 'vector';

-- 2. List RAG tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'rag_%'
ORDER BY table_name;

-- 3. Check row counts
SELECT
  (SELECT COUNT(*) FROM rag_documents) as documents,
  (SELECT COUNT(*) FROM rag_chunks) as chunks,
  (SELECT COUNT(*) FROM rag_chunks WHERE embedding IS NOT NULL) as chunks_with_embeddings;

-- 4. Verify HNSW index
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'rag_chunks'
  AND indexname LIKE '%embedding%';

-- 5. Sample data
SELECT c.id, c.text, c.tokens, d.filename
FROM rag_chunks c
JOIN rag_documents d ON c.document_id = d.id
WHERE c.embedding IS NOT NULL
LIMIT 3;
```

---

### Option 3: Via Railway CLI

```bash
# Initialize database schema
railway run node scripts/init-rag-database.js

# Check documents count
railway run psql $DATABASE_URL -c "SELECT COUNT(*) FROM rag_documents;"

# Check chunks count
railway run psql $DATABASE_URL -c "SELECT COUNT(*) FROM rag_chunks;"

# Check pgvector
railway run psql $DATABASE_URL -c "SELECT * FROM pg_extension WHERE extname='vector';"
```

---

## Step-by-Step Verification Plan

### Step 1: Wait for Railway Deployment

**Action**: Monitor Railway for successful build

```bash
railway logs --tail 50
```

**Success Indicator**:
```
✓ Ready in XXXms
```

---

### Step 2: Test Health Endpoint

**Action**: Access the RAG health check API

```bash
curl https://s21.up.railway.app/api/health/rag | jq .
```

**Expected Outcomes**:

**Scenario A**: Schema Not Initialized
```json
{
  "status": "error",
  "issues": [
    "pgvector extension not installed",
    "rag_documents table not found",
    "rag_chunks table not found"
  ],
  "recommendations": [
    "Initialize database: railway run node scripts/init-rag-database.js"
  ]
}
```

**Scenario B**: Schema Initialized, No Data
```json
{
  "status": "degraded",
  "checks": {
    "database": true,
    "pgvector": true,
    "tables": {"rag_documents": true, "rag_chunks": true},
    "counts": {"documents": 0, "chunks": 0}
  },
  "recommendations": [
    "Generate embeddings: npm run rag:build"
  ]
}
```

**Scenario C**: Fully Operational
```json
{
  "status": "healthy",
  "checks": {
    "database": true,
    "pgvector": true,
    "tables": {"rag_documents": true, "rag_chunks": true},
    "counts": {"documents": 142, "chunks": 987, "chunksWithEmbeddings": 987},
    "indexes": {"hnsw": true}
  }
}
```

---

### Step 3: Initialize Schema (If Needed)

**If Scenario A**:

```bash
# Initialize database with RAG schema
railway run node scripts/init-rag-database.js
```

**Expected Output**:
```
✅ Schema executed successfully
✓ pgvector extension verified: Version X.X
✓ Tables created:
  - rag_analytics
  - rag_chunks
  - rag_documents
  - rag_query_cache
```

---

### Step 4: Deploy Documents and Generate Embeddings

**If Scenario B**:

```bash
# Option A: Deploy documents via git (recommended)
git add data/processed-kb/documents/
git commit -m "Add processed documents for RAG system"
git push

# Wait for Railway to deploy, then generate embeddings
curl -X POST https://s21.up.railway.app/api/admin/generate-embeddings

# Option B: Process locally with Railway database
railway run npm run rag:build
```

**Note**: May need to increase Railway memory first:
```bash
# Add to Railway environment variables:
NODE_OPTIONS=--max-old-space-size=4096
```

---

### Step 5: Verify Data Population

```bash
# Re-check health endpoint
curl https://s21.up.railway.app/api/health/rag | jq .

# Should now show:
# - documents: 140-142
# - chunks: 800-1000
# - status: "healthy"
```

---

## File Locations

**Verification Tools**:
- `/Users/a21/routellm-chatbot/app/api/health/rag/route.ts` (API endpoint)
- `/Users/a21/routellm-chatbot/scripts/verify-rag-database.js` (CLI tool)

**Schema Files**:
- `/Users/a21/routellm-chatbot/lib/db-schema-rag.sql` (RAG schema)
- `/Users/a21/routellm-chatbot/database/schema.sql` (Main schema)

**Initialization**:
- `/Users/a21/routellm-chatbot/scripts/init-rag-database.js` (Schema setup)

**Documentation**:
- `/Users/a21/routellm-chatbot/RAG_DATABASE_VERIFICATION_REPORT.md` (Full report)
- `/Users/a21/routellm-chatbot/RAG_SYSTEM_STATUS.md` (Overall RAG status)

---

## Success Criteria

RAG database is considered verified when:

- [ ] `/api/health/rag` returns HTTP 200 (not 404)
- [ ] `status` field shows `"healthy"`
- [ ] pgvector extension is installed
- [ ] All 4 RAG tables exist
- [ ] HNSW index exists on `rag_chunks.embedding`
- [ ] 140-142 documents in `rag_documents`
- [ ] 800-1000 chunks in `rag_chunks`
- [ ] All chunks have non-NULL embeddings

---

## Current Blockers

1. **Railway Deployment**: New API route not yet deployed
   - **Solution**: Wait for automatic deployment (5-10 minutes)

2. **Network Access**: Cannot access internal PostgreSQL from local machine
   - **Solution**: Use API endpoint or railway run commands

3. **Memory Constraints**: Out-of-memory errors during embedding generation
   - **Solution**: Increase NODE_OPTIONS memory limit

4. **Missing Documents**: Processed documents not on Railway
   - **Solution**: Deploy via git or use railway run

---

## Next Actions

**Immediate** (Within 1 hour):
1. Wait for Railway to finish deploying `/api/health/rag`
2. Test endpoint: `curl https://s21.up.railway.app/api/health/rag`
3. Review database status from API response

**Short-term** (Within 24 hours):
4. Initialize schema if needed: `railway run node scripts/init-rag-database.js`
5. Deploy processed documents to Railway
6. Increase memory limit: Add `NODE_OPTIONS=--max-old-space-size=4096`
7. Generate embeddings: `railway run npm run rag:build` or via API

**Verification** (After embeddings generated):
8. Confirm 140-142 documents loaded
9. Confirm 800-1000 chunks with embeddings
10. Test RAG retrieval with sample query
11. Integrate with chat API

---

## Contact Commands

**Check deployment status**:
```bash
railway status
railway logs --tail 100
```

**Test health endpoint**:
```bash
curl -v https://s21.up.railway.app/api/health/rag
```

**Manual database verification**:
```bash
railway run psql $DATABASE_URL -c "\dt rag*"
```

---

**Report Status**: PENDING VERIFICATION
**Reason**: Awaiting Railway deployment completion
**Estimated Time**: 5-15 minutes
**Next Check**: Test `/api/health/rag` endpoint

---

**Last Updated**: October 31, 2025 05:00 UTC
