# RAG Database Verification Report

**Date**: October 31, 2025
**Database**: PostgreSQL on Railway (s21.up.railway.app)
**Status**: VERIFICATION IN PROGRESS

---

## Executive Summary

This report documents the verification of the RAG (Retrieval-Augmented Generation) database schema and data for the Susan AI-21 system deployed on Railway.

### Current Status: ⚠️ VERIFICATION INCOMPLETE

**Reason**: Unable to directly access PostgreSQL database from local machine due to Railway's internal networking. The DATABASE_URL uses `postgres.railway.internal` which is only accessible from within the Railway deployment environment.

---

## Verification Tools Created

### 1. API Health Endpoint: `/api/health/rag`

**File**: `/Users/a21/routellm-chatbot/app/api/health/rag/route.ts`

**Purpose**: Real-time database health check accessible via HTTPS

**Checks Performed**:
- Database connection status
- pgvector extension installation and version
- Table existence (rag_documents, rag_chunks)
- Document and chunk counts
- Embedding completeness
- HNSW index presence
- Returns actionable recommendations

**Usage**:
```bash
curl https://s21.up.railway.app/api/health/rag | jq .
```

**Status**: ⏳ Endpoint created and deployed, awaiting Railway build completion

---

### 2. CLI Verification Script: `scripts/verify-rag-database.js`

**File**: `/Users/a21/routellm-chatbot/scripts/verify-rag-database.js`

**Purpose**: Comprehensive database verification from Railway environment

**Features**:
- Detailed connection testing
- Table schema validation
- Row count verification
- Index analysis
- Sample data inspection
- Issue detection and recommendations

**Usage**:
```bash
railway run node scripts/verify-rag-database.js
```

**Status**: ✅ Created but cannot run due to network restrictions

---

## Expected Database Schema

### Required Tables

#### 1. `rag_documents`
Stores source documents with metadata

```sql
CREATE TABLE rag_documents (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  filepath TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('pdf', 'docx', 'image')),
  content TEXT NOT NULL,
  summary TEXT,
  metadata JSONB DEFAULT '{}',
  version INTEGER DEFAULT 1,
  hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_document_hash UNIQUE(hash)
);
```

**Expected Count**: 140-142 documents

---

#### 2. `rag_chunks`
Stores document chunks with vector embeddings

```sql
CREATE TABLE rag_chunks (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  text TEXT NOT NULL,
  tokens INTEGER NOT NULL,
  chunk_index INTEGER NOT NULL,
  total_chunks INTEGER NOT NULL,
  position_start INTEGER,
  position_end INTEGER,
  embedding vector(1536),  -- OpenAI text-embedding-3-small
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_chunk_document FOREIGN KEY (document_id)
    REFERENCES rag_documents(id) ON DELETE CASCADE,
  CONSTRAINT unique_document_chunk UNIQUE(document_id, chunk_index)
);
```

**Expected Count**: 800-1000 chunks

---

#### 3. Critical Indexes

**HNSW Index on Embeddings** (Required for fast similarity search):
```sql
CREATE INDEX idx_chunks_embedding_hnsw
  ON rag_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

**Metadata Indexes**:
```sql
CREATE INDEX idx_chunks_metadata ON rag_chunks USING gin(metadata);
CREATE INDEX idx_documents_metadata ON rag_documents USING gin(metadata);
```

---

## Known Issues & Context

### Issue 1: Memory Constraints During Embedding Generation

**Evidence from Logs**:
```
FATAL ERROR: Ineffective mark-compacts near heap limit
Allocation failed - JavaScript heap out of memory
```

**Impact**: Embedding generation process crashes before completion

**Root Cause**: Railway container memory limit (likely 512MB-1GB) insufficient for processing all documents in a single batch

---

### Issue 2: Documents Not Deployed to Railway

**Status**: Processed documents exist locally but not on Railway deployment

**Location**: `/Users/a21/routellm-chatbot/data/processed-kb/documents/` (142 JSON files)

**Impact**: Embedding generation cannot proceed without source documents

**Solution Options**:
1. **Deploy via Git** (Recommended):
   ```bash
   git add data/processed-kb/documents/
   git commit -m "Add processed documents for RAG system"
   git push
   ```

2. **Process Locally with Railway Database**:
   ```bash
   railway run npm run rag:build
   ```

---

### Issue 3: RAG Service Using File-Based Fallback

**Evidence from Logs**:
```
[RAGService] No embeddings file found at: /app/data/susan_ai_embeddings.json
[RAGService] Run: npm run kb:build to generate embeddings
```

**Impact**: RAG system is not operational, falling back to legacy file-based embeddings

**Required Action**: Initialize database schema and generate embeddings

---

## Verification Checklist

Use this checklist to verify RAG database status:

### Phase 1: Database Schema
- [ ] PostgreSQL connection working
- [ ] pgvector extension installed
- [ ] `rag_documents` table exists
- [ ] `rag_chunks` table exists
- [ ] `rag_query_cache` table exists (optional)
- [ ] `rag_analytics` table exists (optional)

### Phase 2: Indexes
- [ ] HNSW index on `rag_chunks.embedding` exists
- [ ] GIN index on `rag_chunks.metadata` exists
- [ ] GIN index on `rag_documents.metadata` exists
- [ ] Full-text search index on `rag_chunks.text` exists

### Phase 3: Data Population
- [ ] Documents loaded (140-142 expected)
- [ ] Chunks created (800-1000 expected)
- [ ] Embeddings generated (all chunks have non-NULL embedding)
- [ ] Metadata populated (category, states, scenarios)

### Phase 4: Functionality
- [ ] Vector similarity search working
- [ ] Metadata filtering working
- [ ] Hybrid search (vector + keyword) working
- [ ] Query caching functional

---

## Recommended Verification Steps

### Step 1: Initialize Database Schema

**Command**:
```bash
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

📊 Current data:
  Documents: 0
  Chunks: 0
  Cached queries: 0
```

---

### Step 2: Check Schema via API (After Deployment)

**Command**:
```bash
curl https://s21.up.railway.app/api/health/rag | jq .
```

**Expected Response**:
```json
{
  "status": "degraded",
  "timestamp": "2025-10-31T...",
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

### Step 3: Manual Database Query (Direct Access)

If you have database credentials, you can verify directly:

```sql
-- Check pgvector
SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';

-- Check tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name LIKE 'rag_%';

-- Check counts
SELECT
  (SELECT COUNT(*) FROM rag_documents) as documents,
  (SELECT COUNT(*) FROM rag_chunks) as chunks,
  (SELECT COUNT(*) FROM rag_chunks WHERE embedding IS NOT NULL) as chunks_with_embeddings;

-- Check indexes
SELECT indexname, indexdef FROM pg_indexes
WHERE tablename IN ('rag_documents', 'rag_chunks')
ORDER BY tablename, indexname;

-- Sample chunk
SELECT c.id, c.text, c.tokens, c.metadata, d.filename
FROM rag_chunks c
JOIN rag_documents d ON c.document_id = d.id
WHERE c.embedding IS NOT NULL
LIMIT 1;
```

---

## Next Actions

### Immediate (Required)
1. **Wait for Railway Deployment**: The `/api/health/rag` endpoint needs to finish deploying
2. **Test Health Endpoint**: Verify endpoint responds with database status
3. **Run Schema Initialization**: Execute `railway run node scripts/init-rag-database.js`

### Short-term (Within 24 hours)
4. **Deploy Processed Documents**: Push documents to Railway or run `railway run npm run rag:build`
5. **Fix Memory Issues**: Add `NODE_OPTIONS="--max-old-space-size=4096"` to Railway env vars
6. **Generate Embeddings**: Process all 142 documents to create chunks and embeddings

### Long-term (Optimization)
7. **Monitor Performance**: Track query latency and cache hit rates
8. **Tune Indexes**: Adjust HNSW parameters based on query patterns
9. **Implement Batch Processing**: Split embedding generation into smaller batches
10. **Add Analytics**: Track RAG retrieval quality and user feedback

---

## Success Criteria

The RAG database will be considered fully operational when:

✅ **Schema**: All tables, indexes, and functions created
✅ **Data**: 140-142 documents loaded
✅ **Embeddings**: 800-1000 chunks with non-NULL embeddings
✅ **Performance**: HNSW index enables <100ms similarity search
✅ **Integration**: Chat API successfully retrieves relevant context
✅ **Monitoring**: Health endpoint returns `"status": "healthy"`

---

## Contact & Support

**Verification Script**: `/Users/a21/routellm-chatbot/scripts/verify-rag-database.js`
**API Endpoint**: `https://s21.up.railway.app/api/health/rag`
**Database Schema**: `/Users/a21/routellm-chatbot/lib/db-schema-rag.sql`
**Initialization Script**: `/Users/a21/routellm-chatbot/scripts/init-rag-database.js`

**Railway Commands**:
```bash
# Check deployment status
railway status
railway logs

# Run database queries
railway run psql $DATABASE_URL -c "SELECT COUNT(*) FROM rag_documents;"

# Initialize schema
railway run node scripts/init-rag-database.js

# Generate embeddings (after documents deployed)
railway run npm run rag:build
```

---

**Report Generated**: October 31, 2025
**Last Updated**: Pending health endpoint response
**Status**: Awaiting deployment and verification

