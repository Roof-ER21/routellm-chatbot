-- ============================================================================
-- Susan AI Roofing Assistant - Common Query Patterns
-- Production-optimized queries for typical application operations
-- ============================================================================

-- ============================================================================
-- USER AUTHENTICATION & MANAGEMENT
-- ============================================================================

-- 1. User Login (case-insensitive)
-- Usage: Authenticate user with name and PIN
SELECT id, display_name, remember_me, last_active
FROM users
WHERE LOWER(name) = LOWER('john.smith')
  AND code = '1234';

-- Alternative using helper function:
SELECT * FROM authenticate_user('john.smith', '1234');

-- 2. Create New User
-- Usage: Register a new user account
INSERT INTO users (name, display_name, code)
VALUES (LOWER('Jane.Doe'), 'Jane Doe', '4567')
RETURNING id, display_name, created_at;

-- 3. Update User Remember Me Setting
UPDATE users
SET remember_me = TRUE,
    last_active = CURRENT_TIMESTAMP
WHERE id = 'user-uuid-here';

-- 4. Get All Users (Admin)
SELECT
    id,
    display_name,
    created_at,
    last_active,
    (SELECT COUNT(*) FROM conversations WHERE user_id = u.id) as conversation_count
FROM users u
ORDER BY last_active DESC;

-- ============================================================================
-- CONVERSATION QUERIES
-- ============================================================================

-- 5. Get User's Conversations (Most Recent First)
-- Usage: Display conversation history for a user
SELECT
    c.id,
    c.title,
    c.preview,
    c.created_at,
    c.updated_at,
    c.message_count,
    c.is_flagged,
    c.highest_severity
FROM conversations c
WHERE c.user_id = 'user-uuid-here'
ORDER BY c.updated_at DESC
LIMIT 50;

-- 6. Get Single Conversation with Full Details
-- Usage: Load a specific conversation
SELECT
    c.id,
    c.user_id,
    u.display_name,
    c.title,
    c.preview,
    c.created_at,
    c.updated_at,
    c.is_flagged,
    c.highest_severity,
    c.message_count
FROM conversations c
JOIN users u ON c.user_id = u.id
WHERE c.id = 'conversation-uuid-here';

-- 7. Create New Conversation
-- Usage: Start a new conversation
WITH new_conv AS (
    INSERT INTO conversations (user_id, title, preview)
    VALUES (
        'user-uuid-here',
        'First 50 characters of first message here...',
        'First 100 characters of first message here for preview...'
    )
    RETURNING id, created_at
)
SELECT * FROM new_conv;

-- 8. Get All Conversations (Admin Dashboard)
-- Usage: Admin view of all conversations with threat info
SELECT
    c.id,
    u.display_name as user_name,
    c.title,
    c.preview,
    c.created_at,
    c.updated_at,
    c.is_flagged,
    c.highest_severity,
    c.message_count,
    COUNT(DISTINCT ta.id) as alert_count
FROM conversations c
JOIN users u ON c.user_id = u.id
LEFT JOIN threat_alerts ta ON c.id = ta.conversation_id
GROUP BY c.id, u.display_name
ORDER BY c.updated_at DESC
LIMIT 100;

-- 9. Get Flagged Conversations Only (Admin Alert View)
-- Usage: View only conversations with detected threats
SELECT * FROM v_flagged_conversations
ORDER BY highest_severity DESC, updated_at DESC
LIMIT 50;

-- Alternative with custom filtering:
SELECT
    c.id,
    u.display_name,
    c.title,
    c.preview,
    c.updated_at,
    c.highest_severity,
    c.message_count,
    COUNT(DISTINCT ta.id) as alert_count,
    MAX(ta.risk_score) as max_risk_score,
    STRING_AGG(DISTINCT ta.category, ', ') as threat_categories
FROM conversations c
JOIN users u ON c.user_id = u.id
JOIN threat_alerts ta ON c.id = ta.conversation_id
WHERE c.is_flagged = TRUE
  AND c.highest_severity IN ('critical', 'high')
GROUP BY c.id, u.display_name
ORDER BY c.highest_severity DESC, c.updated_at DESC;

-- 10. Search Conversations by Title/Preview
-- Usage: Search functionality
SELECT
    c.id,
    c.user_id,
    u.display_name,
    c.title,
    c.preview,
    c.updated_at,
    c.is_flagged
FROM conversations c
JOIN users u ON c.user_id = u.id
WHERE c.title ILIKE '%roof inspection%'
   OR c.preview ILIKE '%roof inspection%'
ORDER BY c.updated_at DESC;

-- ============================================================================
-- MESSAGE QUERIES
-- ============================================================================

-- 11. Get Messages for Conversation (In Order)
-- Usage: Load conversation history
SELECT
    id,
    role,
    content,
    created_at,
    message_index
FROM messages
WHERE conversation_id = 'conversation-uuid-here'
ORDER BY message_index ASC;

-- Alternative using helper function:
SELECT * FROM get_conversation_with_messages('conversation-uuid-here');

-- 12. Add New Message to Conversation
-- Usage: Store user or assistant message
WITH new_message AS (
    INSERT INTO messages (conversation_id, role, content, message_index)
    VALUES (
        'conversation-uuid-here',
        'user',
        'Message content here...',
        (SELECT COALESCE(MAX(message_index) + 1, 0)
         FROM messages
         WHERE conversation_id = 'conversation-uuid-here')
    )
    RETURNING id, created_at, message_index
)
SELECT * FROM new_message;

-- 13. Get Latest Message in Conversation
SELECT
    id,
    role,
    content,
    created_at
FROM messages
WHERE conversation_id = 'conversation-uuid-here'
ORDER BY message_index DESC
LIMIT 1;

-- 14. Get Message Count for Conversation
SELECT COUNT(*) as message_count
FROM messages
WHERE conversation_id = 'conversation-uuid-here';

-- Alternative (faster - uses denormalized count):
SELECT message_count
FROM conversations
WHERE id = 'conversation-uuid-here';

-- ============================================================================
-- THREAT ALERT QUERIES
-- ============================================================================

-- 15. Create Threat Alert
-- Usage: Record detected suspicious activity
INSERT INTO threat_alerts (
    conversation_id,
    message_id,
    pattern,
    category,
    severity,
    risk_score,
    highlighted_text
)
VALUES (
    'conversation-uuid-here',
    123456,
    'export.*customer.*data',
    'Data Theft',
    'high',
    85,
    'export all customer data to external drive'
)
RETURNING id, detected_at;

-- 16. Get All Alerts for Conversation
-- Usage: View threat details for specific conversation
SELECT * FROM get_conversation_alerts('conversation-uuid-here');

-- Alternative with full details:
SELECT
    ta.id,
    ta.message_id,
    m.content as message_content,
    ta.pattern,
    ta.category,
    ta.severity,
    ta.risk_score,
    ta.highlighted_text,
    ta.detected_at
FROM threat_alerts ta
JOIN messages m ON ta.message_id = m.id
WHERE ta.conversation_id = 'conversation-uuid-here'
ORDER BY ta.detected_at DESC;

-- 17. Get All Critical/High Severity Alerts (Admin Dashboard)
-- Usage: Monitor high-priority threats
SELECT
    ta.id,
    c.id as conversation_id,
    u.display_name,
    c.title,
    ta.category,
    ta.severity,
    ta.risk_score,
    ta.highlighted_text,
    ta.detected_at
FROM threat_alerts ta
JOIN conversations c ON ta.conversation_id = c.id
JOIN users u ON c.user_id = u.id
WHERE ta.severity IN ('critical', 'high')
ORDER BY ta.severity DESC, ta.detected_at DESC
LIMIT 100;

-- 18. Get Alert Statistics by Category
-- Usage: Analytics dashboard
SELECT
    category,
    COUNT(*) as total_alerts,
    COUNT(DISTINCT conversation_id) as affected_conversations,
    AVG(risk_score) as avg_risk_score,
    MAX(risk_score) as max_risk_score,
    COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical_count,
    COUNT(CASE WHEN severity = 'high' THEN 1 END) as high_count,
    COUNT(CASE WHEN severity = 'medium' THEN 1 END) as medium_count,
    COUNT(CASE WHEN severity = 'low' THEN 1 END) as low_count
FROM threat_alerts
GROUP BY category
ORDER BY total_alerts DESC;

-- 19. Get Recent Alerts (Last 24 Hours)
-- Usage: Real-time monitoring
SELECT
    ta.id,
    u.display_name,
    c.title,
    ta.category,
    ta.severity,
    ta.risk_score,
    ta.highlighted_text,
    ta.detected_at
FROM threat_alerts ta
JOIN conversations c ON ta.conversation_id = c.id
JOIN users u ON c.user_id = u.id
WHERE ta.detected_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
ORDER BY ta.detected_at DESC;

-- 20. Get Alerts by Severity with Pagination
-- Usage: Filtered alert view with pagination
SELECT
    ta.id,
    u.display_name,
    c.title,
    c.id as conversation_id,
    ta.category,
    ta.severity,
    ta.risk_score,
    ta.highlighted_text,
    ta.detected_at
FROM threat_alerts ta
JOIN conversations c ON ta.conversation_id = c.id
JOIN users u ON c.user_id = u.id
WHERE ta.severity = 'critical'
ORDER BY ta.detected_at DESC
LIMIT 20 OFFSET 0;  -- Change OFFSET for pagination

-- ============================================================================
-- ANALYTICS & REPORTING QUERIES
-- ============================================================================

-- 21. User Activity Summary
-- Usage: User analytics dashboard
SELECT * FROM v_user_activity
ORDER BY total_alerts DESC;

-- 22. Daily Threat Statistics (Last 30 Days)
-- Usage: Trend analysis
SELECT
    DATE(detected_at) as date,
    COUNT(*) as total_alerts,
    COUNT(DISTINCT conversation_id) as conversations_affected,
    COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical_alerts,
    COUNT(CASE WHEN severity = 'high' THEN 1 END) as high_alerts,
    AVG(risk_score) as avg_risk_score
FROM threat_alerts
WHERE detected_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
GROUP BY DATE(detected_at)
ORDER BY date DESC;

-- 23. Top Users by Alert Count
-- Usage: Identify high-risk users
SELECT
    u.id,
    u.display_name,
    COUNT(DISTINCT ta.id) as total_alerts,
    COUNT(DISTINCT c.id) as flagged_conversations,
    MAX(ta.severity) as highest_severity,
    MAX(ta.risk_score) as max_risk_score,
    MAX(ta.detected_at) as last_alert_date
FROM users u
JOIN conversations c ON u.id = c.user_id
JOIN threat_alerts ta ON c.id = ta.conversation_id
GROUP BY u.id, u.display_name
HAVING COUNT(DISTINCT ta.id) > 0
ORDER BY total_alerts DESC
LIMIT 10;

-- 24. Conversation Activity by Hour (24h)
-- Usage: Peak usage analysis
SELECT
    EXTRACT(HOUR FROM created_at) as hour,
    COUNT(*) as conversation_count,
    COUNT(DISTINCT user_id) as unique_users
FROM conversations
WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
GROUP BY EXTRACT(HOUR FROM created_at)
ORDER BY hour;

-- 25. Average Messages per Conversation
-- Usage: Engagement metrics
SELECT
    AVG(message_count) as avg_messages,
    MIN(message_count) as min_messages,
    MAX(message_count) as max_messages,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY message_count) as median_messages
FROM conversations;

-- ============================================================================
-- MAINTENANCE & CLEANUP QUERIES
-- ============================================================================

-- 26. Delete Old Conversations (Data Retention)
-- Usage: Cleanup old non-flagged conversations after 90 days
DELETE FROM conversations
WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '90 days'
  AND is_flagged = FALSE;

-- 27. Find Conversations with No Messages (Orphaned)
-- Usage: Data integrity check
SELECT c.id, c.user_id, c.created_at
FROM conversations c
WHERE NOT EXISTS (
    SELECT 1 FROM messages m WHERE m.conversation_id = c.id
);

-- 28. Vacuum and Analyze (Performance Maintenance)
-- Usage: Regular maintenance
VACUUM ANALYZE users;
VACUUM ANALYZE conversations;
VACUUM ANALYZE messages;
VACUUM ANALYZE threat_alerts;

-- 29. Get Database Statistics
-- Usage: Monitor database size and growth
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY size_bytes DESC;

-- 30. Get Index Usage Statistics
-- Usage: Identify unused indexes
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC;

-- ============================================================================
-- PERFORMANCE TIPS
-- ============================================================================

-- For Railway deployment, ensure these settings are optimized:
-- 1. Connection pooling: Use PgBouncer or connection pool in your app
-- 2. Index maintenance: Run VACUUM ANALYZE weekly
-- 3. Query planning: Use EXPLAIN ANALYZE for slow queries
-- 4. Partitioning: Consider partitioning messages table if > 10M rows
-- 5. Archiving: Move old flagged conversations to archive table

-- Example: Check slow queries (requires pg_stat_statements extension)
-- SELECT query, mean_exec_time, calls
-- FROM pg_stat_statements
-- ORDER BY mean_exec_time DESC
-- LIMIT 10;
