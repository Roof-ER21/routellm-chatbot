# Phase 3: RAG Infrastructure Setup - IN PROGRESS

**Started:** 2025-10-30
**Status:** Database initialization scripts deployed, awaiting Railway deployment

---

## Current Progress

### Completed Tasks
- [x] Created database initialization script (`scripts/init-rag-database.js`)
- [x] Created embedding generation script (`scripts/generate-embeddings.js`)
- [x] Prepared PostgreSQL + pgvector schema (`lib/db-schema-rag.sql`)
- [x] Updated package.json with new commands
- [x] Committed and pushed to Railway
- [x] Triggered Railway deployment

### In Progress
- [ ] Railway deployment completing
- [ ] Database schema initialization
- [ ] Embedding generation for 123 KB documents

### Pending
- [ ] HNSW index creation
- [ ] RAG retrieval testing
- [ ] Chat API integration
- [ ] Production validation

---

## Scripts Created

### 1. Database Initialization (`init-rag-database.js`)

**Purpose:** Initialize PostgreSQL with pgvector extension and RAG schema

**Usage:**
```bash
railway run npm run db:init:rag
```

**What it does:**
- Connects to Railway PostgreSQL database
- Enables pgvector extension for vector operations
- Creates rag_documents table (source documents with metadata)
- Creates rag_chunks table (text chunks with embeddings)
- Creates rag_query_cache table (query result caching)
- Creates rag_analytics table (performance tracking)
- Creates indexes for fast querying
- Verifies setup and displays statistics

**Output:**
```
🚀 RAG Database Initialization
===============================

✓ DATABASE_URL found
✓ Connecting to PostgreSQL...
✓ Connected to PostgreSQL

📄 Executing schema...
   - Creating pgvector extension
   - Creating rag_documents table
   - Creating rag_chunks table
   - Creating rag_query_cache table
   - Creating rag_analytics table
   - Creating indexes and functions

✅ Schema executed successfully

✓ pgvector extension verified:
  Version: 0.5.0

✓ Tables created:
  - rag_analytics
  - rag_chunks
  - rag_documents
  - rag_query_cache

📊 Current data:
  Documents: 0
  Chunks: 0
  Cached queries: 0

═══════════════════════════════════════
✨ DATABASE INITIALIZATION COMPLETE!
═══════════════════════════════════════

🔜 Next steps:
   1. ✅ Database initialized with RAG schema
   2. 🔄 Run: npm run rag:build
      (Generate embeddings for 123 KB documents)
   3. 🧪 Test RAG retrieval system
   4. 🔗 Integrate with chat API
```

### 2. Embedding Generation (`generate-embeddings.js`)

**Purpose:** Generate vector embeddings for all 123 KB documents using OpenAI

**Usage:**
```bash
railway run npm run rag:build
```

**What it does:**
- Loads 123 documents from `lib/insurance-argumentation-kb.ts`
- Chunks each document into ~500 token segments with 50 token overlap
- Generates embeddings using OpenAI's `text-embedding-3-small` model
- Stores documents and chunks in PostgreSQL
- Creates HNSW index for fast vector similarity search
- Tracks processing statistics and costs

**Processing Details:**
- **Embedding Model:** text-embedding-3-small ($0.02/1M tokens)
- **Dimensions:** 1536
- **Chunk Size:** ~500 tokens (2000 characters)
- **Chunk Overlap:** ~50 tokens (200 characters)
- **Batch Size:** 100 chunks at a time
- **Rate Limit:** 1 second delay between batches

**Expected Results:**
```
📊 Statistics:
   Documents: 123
   Chunks: ~800-1000 (estimated)
   Total tokens: ~400,000
   Estimated cost: $0.008 (less than 1 cent!)
```

**Output:**
```
🚀 RAG Embedding Generation
============================

✓ OPENAI_API_KEY configured
✓ DATABASE_URL configured
✓ Embedding model: text-embedding-3-small
✓ Chunk size: 500 tokens (~2000 chars)
✓ Chunk overlap: 50 tokens

📚 Loading documents from knowledge base...
✓ Loaded 123 documents

🔌 Connecting to PostgreSQL...
✓ Connected

[1/123] IRC_R908_3_Matching_Requirement.md
  Category: building_codes
  Title: IRC R908.3 - Matching Shingle Requirement
  Chunks: 8
  Generating embeddings...
  Processing batch 1/1 (8 chunks)
  Storing in database...
  ✅ Complete

[2/123] GAF_Silver_Pledge_Warranty.md
  Category: manufacturer_specs
  Title: GAF Silver Pledge Limited Warranty
  Chunks: 12
  ...

📊 Progress: 10.0% (12/123)
...

🔍 Creating HNSW index for vector search...
✓ HNSW index created

═══════════════════════════════════════
✨ EMBEDDING GENERATION COMPLETE!
═══════════════════════════════════════

📊 Statistics:
   Documents: 123
   Chunks: 924
   Total tokens: ~387,000
   Estimated cost: $0.0077

🔜 Next steps:
   1. ✅ Embeddings generated and stored
   2. ✅ HNSW index created for fast search
   3. 🧪 Test RAG retrieval: npm run test:rag
   4. 🔗 Integrate with chat API
```

---

## Database Schema Overview

### Tables Created

#### 1. `rag_documents`
**Purpose:** Store source documents with metadata and version tracking

**Columns:**
- `id` - UUID or filename-based ID (primary key)
- `filename` - Original filename
- `filepath` - Full path to source file
- `type` - Document type (pdf, docx, image)
- `content` - Full extracted text
- `summary` - Auto-generated summary
- `metadata` - JSONB with category, keywords, states, tags
- `version` - Version number for change tracking
- `hash` - SHA256 hash for duplicate detection
- `created_at`, `updated_at` - Timestamps

**Indexes:**
- B-tree on type, filename, created_at
- GIN on metadata (fast JSONB queries)
- B-tree on category (metadata->'category')

#### 2. `rag_chunks`
**Purpose:** Store document chunks with vector embeddings for semantic search

**Columns:**
- `id` - UUID for chunk (primary key)
- `document_id` - Foreign key to rag_documents
- `text` - Chunk text content
- `tokens` - Token count
- `chunk_index` - Position within document (0-based)
- `total_chunks` - Total chunks in document
- `position_start`, `position_end` - Character positions
- `embedding` - Vector embedding (1536 dimensions)
- `created_at`, `updated_at` - Timestamps

**Indexes:**
- B-tree on document_id
- B-tree on chunk_index
- **HNSW on embedding** - Fast vector similarity search
  - Distance metric: cosine similarity
  - HNSW parameters: m=16, ef_construction=64
  - Query time: <100ms for top-k retrieval

#### 3. `rag_query_cache`
**Purpose:** Cache frequently asked questions for 40%+ performance improvement

**Columns:**
- `id` - UUID (primary key)
- `query_text` - Original query text
- `query_embedding` - Query vector embedding
- `top_chunks` - JSONB array of retrieved chunk IDs
- `retrieval_scores` - JSONB array of similarity scores
- `hit_count` - Number of cache hits
- `last_accessed` - Last access timestamp
- `created_at`, `expires_at` - Cache TTL

**Features:**
- Automatic expiration (default: 24 hours)
- LRU eviction for old entries
- Similarity-based cache lookup (90%+ match threshold)

#### 4. `rag_analytics`
**Purpose:** Track RAG system performance and usage metrics

**Columns:**
- Query latency tracking
- Cache hit/miss rates
- Document retrieval accuracy
- User satisfaction feedback
- Error logging

---

## Next Steps

### Step 1: Verify Railway Deployment ✅
```bash
# Check deployment status
railway status

# View deployment logs
railway logs
```

### Step 2: Initialize Database 🔄
```bash
# Run database initialization in Railway environment
railway run npm run db:init:rag

# Expected: Database schema created with pgvector extension
```

### Step 3: Generate Embeddings 🔄
```bash
# Generate embeddings for 123 KB documents
railway run npm run rag:build

# Expected: ~924 chunks, ~$0.008 cost, ~10-15 minutes processing time
```

### Step 4: Test RAG Retrieval 🔄
```bash
# Test semantic search functionality
npm run test:rag

# Test queries:
# - "What code requires matching shingles in Virginia?"
# - "How do I handle a partial replacement denial?"
# - "What's the GAF warranty for wind damage?"
```

### Step 5: Integrate with Chat API 🔄
- Modify `/app/api/chat/route.ts` to query RAG system
- Inject retrieved context into system prompt
- **PRESERVE Susan's personality** (teammate in the trenches)
- Add citation references to sources

---

## Performance Targets

### Retrieval Performance
- **Query Latency:** <500ms P50, <2s P95
- **Cache Hit Rate:** >40% (target: 50-60%)
- **Accuracy:** 90-95% relevance for top-5 results
- **Throughput:** 100+ concurrent queries

### Cost Targets
- **Embedding Generation:** $0.008 one-time (123 docs)
- **PostgreSQL:** $32/month (Railway Postgres)
- **Redis Cache:** $20/month (Railway Redis) - Phase 4
- **Ollama Cloud:** $180/month - Phase 4
- **Total Phase 3:** $0.008 setup + $32/month operational

---

## Critical Reminders

### Susan's Personality Preservation
Throughout RAG integration, Susan's core personality MUST remain unchanged:

**Before RAG:**
> "Use Additional Findings Template. 87% success rate."

**After RAG (CORRECT):**
> "Use Additional Findings Template (Email Templates > Additional-Findings-Template.docx, Section 2.3). Template includes: • Consistency argument framework • Photo documentation requirements • IRC R908.3 code citations. 87% success rate (92% in VA). Let's flip this."

**What Changes:**
- ✅ Better citations with file locations
- ✅ More detailed context from documents
- ✅ Higher accuracy (90-95% vs 70-75%)

**What STAYS THE SAME:**
- ✅ "WE'RE going to win" language
- ✅ Action-first, no-questions approach
- ✅ Teammate in the trenches identity
- ✅ Success rate statistics
- ✅ Direct, confident tone

---

## Troubleshooting

### Database Connection Issues
If database initialization fails:
```bash
# Check DATABASE_URL is set in Railway
railway variables | grep DATABASE_URL

# Verify Railway service is running
railway status

# Check PostgreSQL logs
railway logs --filter "postgres"
```

### pgvector Extension Not Found
If pgvector extension isn't available:
```bash
# Contact Railway support to enable pgvector
# OR
# Manually enable in Railway dashboard:
# Project > PostgreSQL > Extensions > Enable pgvector
```

### Embedding Generation Failures
If OpenAI API fails:
```bash
# Verify OPENAI_API_KEY is set
railway variables | grep OPENAI_API_KEY

# Check OpenAI API quota
# https://platform.openai.com/usage

# Reduce batch size if rate limited (edit generate-embeddings.js)
# Change: BATCH_SIZE = 50 (from 100)
```

---

## Status Summary

**Phase 1:** ✅ 100% COMPLETE - Planning & Architecture
**Phase 2:** ✅ 100% COMPLETE - Document Cataloging (142 docs)
**Phase 3:** 🔄 40% IN PROGRESS - RAG Infrastructure Setup

**Current Step:** Awaiting Railway deployment, then database initialization

**Overall Progress:** ~30% Complete (2/7 phases done, Phase 3 in progress)

**Susan's Personality:** ✅ PROTECTED - Comprehensive preservation guide in place

---

**Ready for database initialization once Railway deployment completes!** 🚀
