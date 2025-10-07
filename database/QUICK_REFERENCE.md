# Susan AI PostgreSQL - Quick Reference Card

## One-Liner Commands

```bash
# Deploy to Railway
railway run ./database/setup.sh

# Test connection
psql $DATABASE_URL -c "SELECT version();"

# Run performance tests
psql $DATABASE_URL -f database/performance_test.sql

# Backup database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore database
psql $DATABASE_URL < backup.sql
```

## Essential SQL Queries

### User Authentication
```sql
-- Login
SELECT id, display_name, remember_me
FROM users
WHERE LOWER(name) = LOWER('username') AND code = '1234';

-- Create user
INSERT INTO users (name, display_name, code)
VALUES (LOWER('john.doe'), 'John Doe', '1234')
RETURNING id;
```

### Conversations
```sql
-- Get user conversations
SELECT id, title, preview, updated_at, is_flagged
FROM conversations
WHERE user_id = 'user-uuid'
ORDER BY updated_at DESC
LIMIT 50;

-- Get flagged only
SELECT * FROM v_flagged_conversations
WHERE highest_severity IN ('critical', 'high')
LIMIT 20;
```

### Messages
```sql
-- Get conversation messages
SELECT role, content, message_index
FROM messages
WHERE conversation_id = 'conv-uuid'
ORDER BY message_index ASC;

-- Add message
INSERT INTO messages (conversation_id, role, content, message_index)
VALUES ('conv-uuid', 'user', 'message text',
  (SELECT COALESCE(MAX(message_index) + 1, 0)
   FROM messages WHERE conversation_id = 'conv-uuid')
);
```

### Threat Alerts
```sql
-- Create alert
INSERT INTO threat_alerts (
  conversation_id, message_id, pattern, category,
  severity, risk_score, highlighted_text
)
VALUES (
  'conv-uuid', 123, 'pattern', 'Data Theft',
  'high', 85, 'suspicious text'
);

-- Get critical alerts
SELECT c.title, u.display_name, ta.category, ta.detected_at
FROM threat_alerts ta
JOIN conversations c ON ta.conversation_id = c.id
JOIN users u ON c.user_id = u.id
WHERE ta.severity = 'critical'
ORDER BY ta.detected_at DESC;
```

## Node.js Quick Start

```javascript
const { Pool } = require('pg');

// Setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// User login
const user = await pool.query(
  'SELECT * FROM users WHERE LOWER(name) = LOWER($1) AND code = $2',
  ['john.smith', '1234']
);

// Create conversation
const conv = await pool.query(
  'INSERT INTO conversations (user_id, title, preview) VALUES ($1, $2, $3) RETURNING id',
  [userId, 'Title', 'Preview']
);

// Add message
await pool.query(
  'INSERT INTO messages (conversation_id, role, content, message_index) VALUES ($1, $2, $3, 0)',
  [convId, 'user', 'Hello']
);

// Get flagged conversations
const flagged = await pool.query(
  'SELECT * FROM v_flagged_conversations WHERE highest_severity = $1',
  ['critical']
);
```

## Using Helper Functions

```javascript
const {
  authenticateUser,
  createConversation,
  addMessage,
  createThreatAlert,
  getFlaggedConversations
} = require('./database/integration_examples');

// Login
const user = await authenticateUser('john.smith', '1234');

// Create conversation
const conv = await createConversation(userId, 'First message');

// Add messages
await addMessage(conv.id, 'user', 'Question');
await addMessage(conv.id, 'assistant', 'Answer');

// Record threat
await createThreatAlert({
  conversationId: conv.id,
  messageId: msgId,
  pattern: 'suspicious pattern',
  category: 'Data Theft',
  severity: 'high',
  riskScore: 85,
  highlightedText: 'export customer data'
});

// Get flagged
const flagged = await getFlaggedConversations('critical');
```

## Database Maintenance

```sql
-- Weekly maintenance
VACUUM ANALYZE users;
VACUUM ANALYZE conversations;
VACUUM ANALYZE messages;
VACUUM ANALYZE threat_alerts;

-- Check database size
SELECT pg_size_pretty(pg_database_size(current_database()));

-- Check table sizes
SELECT tablename, pg_size_pretty(pg_total_relation_size('public.'||tablename))
FROM pg_tables WHERE schemaname = 'public';

-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Find slow queries
SELECT pid, query_start, query
FROM pg_stat_activity
WHERE state = 'active' AND now() - query_start > interval '5 seconds';

-- Kill slow query
SELECT pg_terminate_backend(pid);
```

## Common Views

```sql
-- Conversations with threat stats
SELECT * FROM v_conversations_with_threats
WHERE is_flagged = TRUE;

-- Flagged conversations details
SELECT * FROM v_flagged_conversations
ORDER BY highest_severity DESC, updated_at DESC;

-- User activity summary
SELECT * FROM v_user_activity
WHERE total_alerts > 0;
```

## Performance Checks

```sql
-- Index usage
SELECT tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Cache hit ratio (should be > 99%)
SELECT
  sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) * 100 as cache_hit_ratio
FROM pg_statio_user_tables;

-- Row counts
SELECT
  'users' as table, COUNT(*) FROM users
UNION ALL SELECT 'conversations', COUNT(*) FROM conversations
UNION ALL SELECT 'messages', COUNT(*) FROM messages
UNION ALL SELECT 'threat_alerts', COUNT(*) FROM threat_alerts;
```

## Troubleshooting

```sql
-- Connection issues
SELECT client_addr, state, query FROM pg_stat_activity;

-- Deadlocks
SELECT * FROM pg_stat_database WHERE datname = current_database();

-- Bloat check
SELECT tablename, n_dead_tup, n_live_tup
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY n_dead_tup DESC;

-- Missing indexes (high seq_scan)
SELECT tablename, seq_scan, seq_tup_read, idx_scan
FROM pg_stat_user_tables
WHERE seq_scan > 1000
ORDER BY seq_scan DESC;
```

## Enums & Types

```sql
-- Message roles
'user' | 'assistant'

-- Severity levels
'critical' | 'high' | 'medium' | 'low'

-- Threat categories
'Business Planning'
'Data Theft'
'Financial Fraud'
'Exit Planning'
'General Suspicious'
```

## Index List

```sql
-- Users
idx_users_name_lower (LOWER(name))
idx_users_last_active (last_active DESC)

-- Conversations
idx_conversations_user_id (user_id)
idx_conversations_updated_at (updated_at DESC)
idx_conversations_is_flagged (is_flagged) WHERE is_flagged = TRUE
idx_conversations_flagged_severity (is_flagged, highest_severity, updated_at)
idx_conversations_user_updated (user_id, updated_at DESC)

-- Messages
idx_messages_conversation_id (conversation_id, message_index)
idx_messages_created_at (created_at DESC)

-- Threat Alerts
idx_threat_alerts_conversation_id (conversation_id)
idx_threat_alerts_severity (severity)
idx_threat_alerts_detected_at (detected_at DESC)
idx_threat_alerts_severity_detected (severity, detected_at DESC)
```

## Railway CLI Quick Commands

```bash
# Link to project
railway link

# Show environment variables
railway variables

# Run commands in Railway environment
railway run psql $DATABASE_URL

# Deploy
railway up

# View logs
railway logs

# Open dashboard
railway open
```

## Environment Variables

```env
DATABASE_URL=postgresql://user:pass@host:port/db
NODE_ENV=production
PGHOST=host
PGPORT=5432
PGUSER=user
PGPASSWORD=password
PGDATABASE=database
```

## File Locations

```
/Users/a21/routellm-chatbot-railway/database/
├── schema.sql                  # Full schema
├── sample_data.sql             # Test data
├── common_queries.sql          # Query examples
├── integration_examples.js     # Node.js code
├── performance_test.sql        # Benchmarks
├── setup.sh                    # Deployment
├── README.md                   # Full docs
├── DEPLOYMENT_GUIDE.md         # Deploy guide
└── QUICK_REFERENCE.md          # This file
```

## Import Order (for fresh setup)

```bash
1. psql $DATABASE_URL -f database/schema.sql
2. psql $DATABASE_URL -f database/sample_data.sql (optional)
3. psql $DATABASE_URL -f database/performance_test.sql (verify)
```

## Connection Pool Config

```javascript
// Production (Railway)
{
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: { rejectUnauthorized: false }
}

// Development (Local)
{
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
}
```

## Common Errors

| Error Code | Meaning | Solution |
|------------|---------|----------|
| 23505 | Unique violation | Username exists |
| 23503 | FK violation | Referenced record missing |
| 42P01 | Table not found | Run schema.sql |
| 53300 | Too many connections | Increase pool size |
| 08P01 | Connection error | Check DATABASE_URL |

## Quick Stats Queries

```sql
-- Dashboard overview
SELECT
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM conversations) as total_conversations,
  (SELECT COUNT(*) FROM conversations WHERE is_flagged = TRUE) as flagged_conversations,
  (SELECT COUNT(*) FROM threat_alerts) as total_alerts,
  (SELECT COUNT(*) FROM threat_alerts WHERE severity IN ('critical', 'high')) as high_priority_alerts;

-- Recent activity (24h)
SELECT
  (SELECT COUNT(*) FROM conversations WHERE created_at > NOW() - INTERVAL '24 hours') as new_conversations,
  (SELECT COUNT(*) FROM messages WHERE created_at > NOW() - INTERVAL '24 hours') as new_messages,
  (SELECT COUNT(*) FROM threat_alerts WHERE detected_at > NOW() - INTERVAL '24 hours') as new_alerts;
```

---

**Keep this reference handy for quick database operations!**

For comprehensive documentation, see: `/Users/a21/routellm-chatbot-railway/database/README.md`
