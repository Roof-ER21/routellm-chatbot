-- ============================================================================
-- RAG SYSTEM DATABASE SCHEMA
-- PostgreSQL + pgvector for Susan AI-21
-- ============================================================================
--
-- Purpose: Store document embeddings and enable fast vector similarity search
-- Database: PostgreSQL (Vercel Postgres)
-- Extension: pgvector (vector similarity search)
--
-- Features:
-- - Vector similarity search using HNSW index
-- - Full-text search for hybrid retrieval
-- - Metadata filtering (category, state, scenario)
-- - Document versioning and change detection
-- - Query result caching for performance
--
-- Cost: FREE (included in Vercel Postgres free tier)
-- ============================================================================

-- ============================================================================
-- 1. ENABLE EXTENSIONS
-- ============================================================================

-- Enable pgvector extension for vector operations
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable pg_trgm for fuzzy text matching (optional, for advanced search)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================================
-- 2. DOCUMENTS TABLE
-- ============================================================================

-- Store source documents with metadata and version tracking
CREATE TABLE IF NOT EXISTS rag_documents (
  -- Primary identification
  id TEXT PRIMARY KEY,                    -- UUID or filename-based ID
  filename TEXT NOT NULL,                 -- Original filename
  filepath TEXT NOT NULL,                 -- Full path to source file

  -- Document type
  type TEXT NOT NULL CHECK (type IN ('pdf', 'docx', 'image')),

  -- Content
  content TEXT NOT NULL,                  -- Full extracted text
  summary TEXT,                           -- Auto-generated summary (optional)

  -- Metadata (flexible JSONB for extensibility)
  metadata JSONB DEFAULT '{}',            -- Category, keywords, states, etc.

  -- Versioning and change detection
  version INTEGER DEFAULT 1,              -- Version number
  hash TEXT NOT NULL,                     -- SHA256 hash of content for change detection

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Indexes for common queries
  CONSTRAINT unique_document_hash UNIQUE(hash)
);

-- Indexes for documents table
CREATE INDEX IF NOT EXISTS idx_documents_type
  ON rag_documents(type);

CREATE INDEX IF NOT EXISTS idx_documents_filename
  ON rag_documents(filename);

CREATE INDEX IF NOT EXISTS idx_documents_created
  ON rag_documents(created_at DESC);

-- GIN index for JSONB metadata (enables fast metadata filtering)
CREATE INDEX IF NOT EXISTS idx_documents_metadata
  ON rag_documents USING gin(metadata);

-- Specific metadata indexes for common filters
CREATE INDEX IF NOT EXISTS idx_documents_category
  ON rag_documents USING btree ((metadata->>'category'));

-- ============================================================================
-- 3. CHUNKS TABLE (Main Vector Search Table)
-- ============================================================================

-- Store document chunks with vector embeddings
CREATE TABLE IF NOT EXISTS rag_chunks (
  -- Primary identification
  id TEXT PRIMARY KEY,                    -- UUID for chunk
  document_id TEXT NOT NULL,              -- Foreign key to rag_documents

  -- Chunk content
  text TEXT NOT NULL,                     -- Chunk text content
  tokens INTEGER NOT NULL,                -- Token count (for context length)

  -- Position in document
  chunk_index INTEGER NOT NULL,           -- 0-based index within document
  total_chunks INTEGER NOT NULL,          -- Total chunks in document
  position_start INTEGER,                 -- Character position start (optional)
  position_end INTEGER,                   -- Character position end (optional)

  -- Vector embedding (OpenAI text-embedding-ada-002: 1536 dimensions)
  embedding vector(1536),                 -- pgvector type

  -- Metadata (inherited from document + chunk-specific)
  metadata JSONB DEFAULT '{}',            -- Category, keywords, states, scenarios, etc.

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),

  -- Foreign key constraint
  CONSTRAINT fk_chunk_document
    FOREIGN KEY (document_id)
    REFERENCES rag_documents(id)
    ON DELETE CASCADE,                    -- Delete chunks when document is deleted

  -- Unique constraint (one chunk index per document)
  CONSTRAINT unique_document_chunk
    UNIQUE(document_id, chunk_index)
);

-- ============================================================================
-- 4. VECTOR SIMILARITY INDEXES
-- ============================================================================

-- HNSW index for fast approximate nearest neighbor search
-- hnsw (Hierarchical Navigable Small World) is faster than IVFFlat for our use case
-- m = 16: connections per layer (higher = more accurate but slower build)
-- ef_construction = 64: size of dynamic candidate list (higher = better quality)
CREATE INDEX IF NOT EXISTS idx_chunks_embedding_hnsw
  ON rag_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Alternative: IVFFlat index (use if HNSW not available)
-- CREATE INDEX IF NOT EXISTS idx_chunks_embedding_ivfflat
--   ON rag_chunks
--   USING ivfflat (embedding vector_cosine_ops)
--   WITH (lists = 100);

-- ============================================================================
-- 5. METADATA INDEXES FOR FILTERING
-- ============================================================================

-- GIN index on full metadata JSONB
CREATE INDEX IF NOT EXISTS idx_chunks_metadata
  ON rag_chunks USING gin(metadata);

-- B-tree indexes for specific metadata fields (faster than GIN for equality)
CREATE INDEX IF NOT EXISTS idx_chunks_category
  ON rag_chunks USING btree ((metadata->>'category'));

-- GIN index for array fields (states, scenarios)
CREATE INDEX IF NOT EXISTS idx_chunks_states
  ON rag_chunks USING gin ((metadata->'states'));

CREATE INDEX IF NOT EXISTS idx_chunks_scenarios
  ON rag_chunks USING gin ((metadata->'scenarios'));

-- Index for document_id (for joins)
CREATE INDEX IF NOT EXISTS idx_chunks_document_id
  ON rag_chunks(document_id);

-- ============================================================================
-- 6. FULL-TEXT SEARCH INDEX (For Hybrid Search)
-- ============================================================================

-- Full-text search index using PostgreSQL's built-in text search
-- Enables hybrid search: vector similarity + keyword matching
CREATE INDEX IF NOT EXISTS idx_chunks_text_search
  ON rag_chunks
  USING gin(to_tsvector('english', text));

-- Optional: Add GIN index on trigrams for fuzzy matching
-- CREATE INDEX IF NOT EXISTS idx_chunks_text_trgm
--   ON rag_chunks
--   USING gin(text gin_trgm_ops);

-- ============================================================================
-- 7. QUERY CACHE TABLE (Optional - for analytics and performance)
-- ============================================================================

-- Cache query results for frequently asked questions
CREATE TABLE IF NOT EXISTS rag_query_cache (
  -- Query identification
  query_hash TEXT PRIMARY KEY,            -- Hash of normalized query
  query TEXT NOT NULL,                    -- Original query text

  -- Cached results
  results JSONB NOT NULL,                 -- Serialized RAGContext

  -- Statistics
  hit_count INTEGER DEFAULT 1,            -- Number of times this query was requested
  avg_latency_ms INTEGER,                 -- Average retrieval latency

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  last_accessed TIMESTAMP DEFAULT NOW(),

  -- TTL (Time To Live) - queries older than 15 min are stale
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '15 minutes')
);

-- Index for cache lookup and expiration
CREATE INDEX IF NOT EXISTS idx_query_cache_accessed
  ON rag_query_cache(last_accessed DESC);

CREATE INDEX IF NOT EXISTS idx_query_cache_expires
  ON rag_query_cache(expires_at);

-- ============================================================================
-- 8. ANALYTICS TABLE (Optional - for monitoring and improvement)
-- ============================================================================

-- Track query performance and user feedback
CREATE TABLE IF NOT EXISTS rag_analytics (
  id SERIAL PRIMARY KEY,

  -- Query details
  query TEXT NOT NULL,
  query_hash TEXT,

  -- Retrieval details
  top_k INTEGER,                          -- Number of results requested
  min_score REAL,                         -- Minimum relevance threshold
  retrieval_time_ms INTEGER,              -- Time to retrieve results

  -- Results
  num_results INTEGER,                    -- Number of results returned
  top_score REAL,                         -- Highest relevance score
  avg_score REAL,                         -- Average relevance score

  -- Filters applied
  filters JSONB,                          -- Category, state, scenario filters

  -- User feedback (optional)
  feedback TEXT,                          -- 'thumbs_up', 'thumbs_down', null
  feedback_comment TEXT,                  -- User comment (optional)

  -- User identification (optional)
  session_id TEXT,
  user_id TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_analytics_created
  ON rag_analytics(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_query_hash
  ON rag_analytics(query_hash);

CREATE INDEX IF NOT EXISTS idx_analytics_feedback
  ON rag_analytics(feedback) WHERE feedback IS NOT NULL;

-- ============================================================================
-- 9. HELPER FUNCTIONS
-- ============================================================================

-- Function: Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update updated_at on rag_documents
CREATE TRIGGER trigger_update_documents_timestamp
  BEFORE UPDATE ON rag_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function: Vector similarity search with metadata filtering
-- Usage: SELECT * FROM search_similar_chunks('[0.1, 0.2, ...]'::vector, 5, 0.7, '{"category": "pushback"}');
CREATE OR REPLACE FUNCTION search_similar_chunks(
  query_embedding vector(1536),
  top_k INTEGER DEFAULT 5,
  min_score REAL DEFAULT 0.7,
  filter_metadata JSONB DEFAULT '{}'
)
RETURNS TABLE (
  chunk_id TEXT,
  document_id TEXT,
  text TEXT,
  score REAL,
  metadata JSONB,
  filename TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.document_id,
    c.text,
    (1 - (c.embedding <=> query_embedding))::REAL AS similarity_score,
    c.metadata,
    d.filename
  FROM rag_chunks c
  JOIN rag_documents d ON c.document_id = d.id
  WHERE
    (1 - (c.embedding <=> query_embedding)) >= min_score
    AND (
      filter_metadata = '{}'::JSONB
      OR c.metadata @> filter_metadata
    )
  ORDER BY c.embedding <=> query_embedding
  LIMIT top_k;
END;
$$ LANGUAGE plpgsql;

-- Function: Hybrid search (vector + full-text)
-- Combines vector similarity with keyword matching using RRF (Reciprocal Rank Fusion)
CREATE OR REPLACE FUNCTION hybrid_search(
  query_embedding vector(1536),
  query_text TEXT,
  top_k INTEGER DEFAULT 5,
  vector_weight REAL DEFAULT 0.7,
  keyword_weight REAL DEFAULT 0.3
)
RETURNS TABLE (
  chunk_id TEXT,
  text TEXT,
  combined_score REAL,
  vector_score REAL,
  keyword_score REAL,
  metadata JSONB,
  filename TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH vector_results AS (
    SELECT
      c.id,
      c.text,
      (1 - (c.embedding <=> query_embedding))::REAL AS score,
      c.metadata,
      d.filename,
      ROW_NUMBER() OVER (ORDER BY c.embedding <=> query_embedding) AS rank
    FROM rag_chunks c
    JOIN rag_documents d ON c.document_id = d.id
    ORDER BY c.embedding <=> query_embedding
    LIMIT top_k * 2
  ),
  keyword_results AS (
    SELECT
      c.id,
      c.text,
      ts_rank(to_tsvector('english', c.text), plainto_tsquery('english', query_text))::REAL AS score,
      c.metadata,
      d.filename,
      ROW_NUMBER() OVER (ORDER BY ts_rank(to_tsvector('english', c.text), plainto_tsquery('english', query_text)) DESC) AS rank
    FROM rag_chunks c
    JOIN rag_documents d ON c.document_id = d.id
    WHERE to_tsvector('english', c.text) @@ plainto_tsquery('english', query_text)
    ORDER BY score DESC
    LIMIT top_k * 2
  )
  SELECT
    COALESCE(v.id, k.id) AS chunk_id,
    COALESCE(v.text, k.text) AS text,
    (
      COALESCE(v.score * vector_weight, 0) +
      COALESCE(k.score * keyword_weight, 0)
    )::REAL AS combined_score,
    v.score AS vector_score,
    k.score AS keyword_score,
    COALESCE(v.metadata, k.metadata) AS metadata,
    COALESCE(v.filename, k.filename) AS filename
  FROM vector_results v
  FULL OUTER JOIN keyword_results k ON v.id = k.id
  ORDER BY combined_score DESC
  LIMIT top_k;
END;
$$ LANGUAGE plpgsql;

-- Function: Clean expired cache entries
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM rag_query_cache
  WHERE expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 10. PERFORMANCE TUNING SETTINGS (Optional)
-- ============================================================================

-- Increase work_mem for complex queries (adjust based on available RAM)
-- ALTER SYSTEM SET work_mem = '256MB';

-- Increase shared_buffers for better caching (adjust based on available RAM)
-- ALTER SYSTEM SET shared_buffers = '512MB';

-- Increase maintenance_work_mem for faster index creation
-- ALTER SYSTEM SET maintenance_work_mem = '512MB';

-- Enable parallel query execution
-- ALTER SYSTEM SET max_parallel_workers_per_gather = 4;

-- Note: These settings require PostgreSQL restart and may not be available on managed services

-- ============================================================================
-- 11. USEFUL QUERIES FOR MONITORING
-- ============================================================================

-- Check total documents and chunks
-- SELECT
--   (SELECT COUNT(*) FROM rag_documents) AS total_documents,
--   (SELECT COUNT(*) FROM rag_chunks) AS total_chunks,
--   (SELECT COUNT(*) FROM rag_query_cache) AS cached_queries;

-- Check database size
-- SELECT
--   pg_size_pretty(pg_database_size(current_database())) AS database_size,
--   pg_size_pretty(pg_relation_size('rag_chunks')) AS chunks_table_size,
--   pg_size_pretty(pg_total_relation_size('rag_chunks')) AS chunks_total_size;

-- Check index sizes
-- SELECT
--   indexname,
--   pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
-- FROM pg_indexes
-- WHERE tablename IN ('rag_documents', 'rag_chunks')
-- ORDER BY pg_relation_size(indexrelid) DESC;

-- Check query cache statistics
-- SELECT
--   COUNT(*) AS cached_queries,
--   AVG(hit_count) AS avg_hits,
--   SUM(hit_count) AS total_hits,
--   pg_size_pretty(pg_total_relation_size('rag_query_cache')) AS cache_size
-- FROM rag_query_cache;

-- Find slow queries (requires pg_stat_statements extension)
-- SELECT
--   query,
--   calls,
--   mean_exec_time,
--   max_exec_time
-- FROM pg_stat_statements
-- WHERE query LIKE '%rag_%'
-- ORDER BY mean_exec_time DESC
-- LIMIT 10;

-- ============================================================================
-- 12. CLEANUP COMMANDS
-- ============================================================================

-- Drop all RAG tables (use with caution!)
-- DROP TABLE IF EXISTS rag_analytics CASCADE;
-- DROP TABLE IF EXISTS rag_query_cache CASCADE;
-- DROP TABLE IF EXISTS rag_chunks CASCADE;
-- DROP TABLE IF EXISTS rag_documents CASCADE;
-- DROP FUNCTION IF EXISTS search_similar_chunks;
-- DROP FUNCTION IF EXISTS hybrid_search;
-- DROP FUNCTION IF EXISTS clean_expired_cache;
-- DROP FUNCTION IF EXISTS update_updated_at_column;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
