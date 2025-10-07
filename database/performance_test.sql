-- ============================================================================
-- Susan AI Roofing Assistant - Performance Testing & Benchmarks
-- Test query performance and validate indexes
-- ============================================================================

-- Enable timing
\timing on

-- Display query plans
SET client_min_messages TO NOTICE;

-- ============================================================================
-- PERFORMANCE BENCHMARK TESTS
-- ============================================================================

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo 'Performance Benchmark Tests'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

-- Test 1: User Login (Should use idx_users_name_lower)
\echo '1. User Login Query (case-insensitive)'
EXPLAIN ANALYZE
SELECT id, display_name, remember_me, last_active
FROM users
WHERE LOWER(name) = LOWER('john.smith')
  AND code = '1234';

-- Test 2: Get User Conversations (Should use idx_conversations_user_updated)
\echo ''
\echo '2. Get User Conversations Query'
EXPLAIN ANALYZE
SELECT id, title, preview, created_at, updated_at, message_count, is_flagged
FROM conversations
WHERE user_id = (SELECT id FROM users WHERE name = 'john.smith')
ORDER BY updated_at DESC
LIMIT 50;

-- Test 3: Get Conversation Messages (Should use idx_messages_conversation_id)
\echo ''
\echo '3. Get Conversation Messages Query'
EXPLAIN ANALYZE
SELECT id, role, content, created_at, message_index
FROM messages
WHERE conversation_id = (
  SELECT id FROM conversations LIMIT 1
)
ORDER BY message_index ASC;

-- Test 4: Get Flagged Conversations (Should use idx_conversations_flagged_severity)
\echo ''
\echo '4. Get Flagged Conversations Query'
EXPLAIN ANALYZE
SELECT
  c.id,
  u.display_name,
  c.title,
  c.updated_at,
  c.highest_severity,
  COUNT(DISTINCT ta.id) as alert_count
FROM conversations c
JOIN users u ON c.user_id = u.id
LEFT JOIN threat_alerts ta ON c.id = ta.conversation_id
WHERE c.is_flagged = TRUE
GROUP BY c.id, u.display_name
ORDER BY c.highest_severity DESC, c.updated_at DESC
LIMIT 20;

-- Test 5: Get Recent High Priority Alerts (Should use idx_threat_alerts_severity_detected)
\echo ''
\echo '5. Get Recent High Priority Alerts Query'
EXPLAIN ANALYZE
SELECT
  ta.id,
  ta.conversation_id,
  ta.category,
  ta.severity,
  ta.detected_at
FROM threat_alerts ta
WHERE ta.severity IN ('critical', 'high')
  AND ta.detected_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
ORDER BY ta.severity DESC, ta.detected_at DESC
LIMIT 50;

-- Test 6: Alert Statistics (Aggregate query)
\echo ''
\echo '6. Alert Statistics Query'
EXPLAIN ANALYZE
SELECT
  category,
  COUNT(*) as total_alerts,
  COUNT(DISTINCT conversation_id) as affected_conversations,
  AVG(risk_score) as avg_risk_score
FROM threat_alerts
GROUP BY category
ORDER BY total_alerts DESC;

-- ============================================================================
-- INDEX USAGE ANALYSIS
-- ============================================================================

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo 'Index Usage Statistics'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- ============================================================================
-- TABLE SIZE ANALYSIS
-- ============================================================================

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo 'Table Size Analysis'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size('public.'||tablename)) AS total_size,
  pg_size_pretty(pg_relation_size('public.'||tablename)) AS table_size,
  pg_size_pretty(pg_total_relation_size('public.'||tablename) - pg_relation_size('public.'||tablename)) AS indexes_size,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.tablename) AS column_count
FROM pg_tables t
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size('public.'||tablename) DESC;

-- ============================================================================
-- ROW COUNT ANALYSIS
-- ============================================================================

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo 'Row Count Analysis'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

SELECT
  'users' as table_name,
  COUNT(*) as row_count,
  COUNT(*) FILTER (WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '7 days') as last_7_days,
  COUNT(*) FILTER (WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '30 days') as last_30_days
FROM users
UNION ALL
SELECT
  'conversations' as table_name,
  COUNT(*) as row_count,
  COUNT(*) FILTER (WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '7 days') as last_7_days,
  COUNT(*) FILTER (WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '30 days') as last_30_days
FROM conversations
UNION ALL
SELECT
  'messages' as table_name,
  COUNT(*) as row_count,
  COUNT(*) FILTER (WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '7 days') as last_7_days,
  COUNT(*) FILTER (WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '30 days') as last_30_days
FROM messages
UNION ALL
SELECT
  'threat_alerts' as table_name,
  COUNT(*) as row_count,
  COUNT(*) FILTER (WHERE detected_at > CURRENT_TIMESTAMP - INTERVAL '7 days') as last_7_days,
  COUNT(*) FILTER (WHERE detected_at > CURRENT_TIMESTAMP - INTERVAL '30 days') as last_30_days
FROM threat_alerts;

-- ============================================================================
-- QUERY PERFORMANCE SUMMARY
-- ============================================================================

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo 'Database Health Check'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

-- Check for missing indexes (sequential scans on large tables)
SELECT
  schemaname,
  tablename,
  seq_scan,
  seq_tup_read,
  idx_scan,
  idx_tup_fetch,
  CASE
    WHEN seq_scan > 0 THEN ROUND((100.0 * idx_scan / (seq_scan + idx_scan))::numeric, 2)
    ELSE 100
  END as index_usage_pct
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY seq_scan DESC;

-- Check for bloat (tables needing VACUUM)
\echo ''
\echo 'Tables Needing Maintenance (VACUUM):'
SELECT
  schemaname,
  tablename,
  n_dead_tup as dead_tuples,
  n_live_tup as live_tuples,
  CASE
    WHEN n_live_tup > 0
    THEN ROUND((100.0 * n_dead_tup / (n_live_tup + n_dead_tup))::numeric, 2)
    ELSE 0
  END as dead_tuple_pct,
  last_vacuum,
  last_autovacuum
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_dead_tup DESC;

-- ============================================================================
-- CONNECTION STATISTICS
-- ============================================================================

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo 'Connection Statistics'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

SELECT
  state,
  COUNT(*) as connection_count
FROM pg_stat_activity
WHERE datname = current_database()
GROUP BY state
ORDER BY connection_count DESC;

-- ============================================================================
-- CACHE HIT RATIO
-- ============================================================================

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo 'Cache Hit Ratio (Should be > 99%)'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

SELECT
  'Index Hit Rate' as metric,
  CASE
    WHEN (idx_blks_hit + idx_blks_read) > 0
    THEN ROUND((100.0 * idx_blks_hit / (idx_blks_hit + idx_blks_read))::numeric, 2)
    ELSE 0
  END as percentage
FROM pg_statio_user_indexes
WHERE schemaname = 'public'
UNION ALL
SELECT
  'Table Hit Rate' as metric,
  CASE
    WHEN (heap_blks_hit + heap_blks_read) > 0
    THEN ROUND((100.0 * heap_blks_hit / (heap_blks_hit + heap_blks_read))::numeric, 2)
    ELSE 0
  END as percentage
FROM pg_statio_user_tables
WHERE schemaname = 'public';

-- ============================================================================
-- RECOMMENDATIONS
-- ============================================================================

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo 'Performance Recommendations'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

-- Unused indexes
\echo 'Potentially Unused Indexes (idx_scan = 0):'
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0
  AND indexrelname NOT LIKE '%pkey'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Duplicate indexes
\echo ''
\echo 'Note: Review indexes manually for potential duplicates'

-- Missing foreign key indexes
\echo ''
\echo 'Foreign Key Columns (All should have indexes):'
SELECT
  tc.table_name,
  kcu.column_name,
  CASE
    WHEN i.indexname IS NOT NULL THEN 'Yes'
    ELSE 'No (Add index!)'
  END as has_index
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
LEFT JOIN pg_indexes i
  ON i.tablename = tc.table_name
  AND i.indexdef LIKE '%' || kcu.column_name || '%'
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo 'Performance Test Complete'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

-- Disable timing
\timing off
