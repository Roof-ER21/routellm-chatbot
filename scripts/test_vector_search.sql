-- Test Vector Search Queries
-- Run with: psql $DATABASE_URL < test_vector_search.sql

\echo '=========================================='
\echo 'TESTING VECTOR SEARCH FUNCTIONALITY'
\echo '=========================================='
\echo ''

-- Test 1: Basic chunk retrieval
\echo '1. Sample chunks in database:'
\echo '---------------------------'
SELECT
    id,
    LEFT(text, 100) || '...' AS text_preview,
    metadata->>'category' AS category,
    metadata->>'filename' AS filename
FROM rag_chunks
LIMIT 5;

\echo ''
\echo '2. Documents in database:'
\echo '------------------------'
SELECT
    id,
    filename,
    type,
    metadata->>'category' AS category,
    LENGTH(content) AS content_length
FROM rag_documents
LIMIT 5;

\echo ''
\echo '3. Test vector similarity (self-similarity should be 0):'
\echo '-------------------------------------------------------'
SELECT
    id,
    LEFT(text, 50) || '...' AS text,
    (embedding <=> embedding) AS distance_to_self
FROM rag_chunks
LIMIT 3;

\echo ''
\echo '4. Find similar chunks to a random chunk:'
\echo '-----------------------------------------'
WITH random_chunk AS (
    SELECT id, text, embedding
    FROM rag_chunks
    ORDER BY RANDOM()
    LIMIT 1
)
SELECT
    c.id,
    LEFT(c.text, 80) || '...' AS similar_text,
    (c.embedding <=> rc.embedding) AS distance,
    (1 - (c.embedding <=> rc.embedding)) AS similarity_score
FROM rag_chunks c, random_chunk rc
WHERE c.id != rc.id
ORDER BY c.embedding <=> rc.embedding
LIMIT 5;

\echo ''
\echo '5. Category distribution:'
\echo '------------------------'
SELECT
    metadata->>'category' AS category,
    COUNT(*) AS chunk_count,
    COUNT(DISTINCT document_id) AS document_count
FROM rag_chunks
GROUP BY metadata->>'category'
ORDER BY chunk_count DESC;

\echo ''
\echo '6. Verify embedding dimensions:'
\echo '------------------------------'
SELECT
    id,
    array_length(embedding::float[], 1) AS embedding_dimension
FROM rag_chunks
LIMIT 1;

\echo ''
\echo '7. Check for null embeddings (should be 0):'
\echo '------------------------------------------'
SELECT COUNT(*) AS null_embeddings
FROM rag_chunks
WHERE embedding IS NULL;

\echo ''
\echo '=========================================='
\echo 'TEST COMPLETE'
\echo '=========================================='
\echo ''
\echo 'If all queries returned results, vector search is working!'
\echo ''
