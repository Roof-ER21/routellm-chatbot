# Susan AI Roofing Assistant - PostgreSQL Database Documentation

## Overview

Production-ready PostgreSQL database schema optimized for Railway deployment. Designed for high-performance conversation storage, real-time threat detection, and centralized admin monitoring across all devices.

## Quick Start

### 1. Railway Deployment

```bash
# Connect to your Railway PostgreSQL instance
psql $DATABASE_URL

# Run the schema
\i /path/to/schema.sql

# Load sample data (optional - for testing)
\i /path/to/sample_data.sql
```

### 2. Local Development

```bash
# Create local database
createdb susan_ai_roofing

# Connect
psql susan_ai_roofing

# Run schema
\i database/schema.sql

# Run sample data
\i database/sample_data.sql
```

### 3. Environment Variables

Add to your `.env` file:

```env
DATABASE_URL=postgresql://user:password@host:port/database
PGUSER=your_username
PGPASSWORD=your_password
PGHOST=your_host
PGPORT=5432
PGDATABASE=susan_ai_roofing
```

## Database Schema

### Tables

#### 1. `users`
Stores user accounts with PIN-based authentication.

- **Primary Key:** `id` (UUID)
- **Unique Constraint:** `name` (lowercase)
- **Indexes:**
  - `idx_users_name_lower` - Fast case-insensitive login lookups
  - `idx_users_last_active` - User activity tracking

**Key Features:**
- Automatic lowercase normalization for `name`
- 4-digit PIN validation via check constraint
- Remember me functionality
- Automatic timestamp tracking

#### 2. `conversations`
Stores conversation metadata and threat summaries.

- **Primary Key:** `id` (UUID)
- **Foreign Keys:** `user_id` → `users.id` (CASCADE)
- **Indexes:**
  - `idx_conversations_user_id` - User conversation lookups
  - `idx_conversations_created_at` - Chronological sorting
  - `idx_conversations_updated_at` - Recent activity
  - `idx_conversations_is_flagged` - Partial index for flagged items
  - `idx_conversations_flagged_severity` - Admin dashboard queries
  - `idx_conversations_user_updated` - User-specific recent conversations

**Key Features:**
- Automatic flagging when threats detected
- Denormalized message count for performance
- Highest severity tracking
- Title/preview auto-extraction from first message

#### 3. `messages`
Stores individual messages in conversations.

- **Primary Key:** `id` (BIGSERIAL)
- **Foreign Keys:** `conversation_id` → `conversations.id` (CASCADE)
- **Indexes:**
  - `idx_messages_conversation_id` - Fast conversation retrieval
  - `idx_messages_created_at` - Chronological sorting
  - `messages_unique_index` - Ensures unique message ordering

**Key Features:**
- Sequential message indexing within conversation
- Automatic conversation timestamp updates via trigger
- Role-based message types (user/assistant)

#### 4. `threat_alerts`
Stores detected suspicious patterns and threat indicators.

- **Primary Key:** `id` (BIGSERIAL)
- **Foreign Keys:**
  - `conversation_id` → `conversations.id` (CASCADE)
  - `message_id` → `messages.id` (CASCADE)
- **Indexes:**
  - `idx_threat_alerts_conversation_id` - Conversation threat lookups
  - `idx_threat_alerts_severity` - Severity filtering
  - `idx_threat_alerts_detected_at` - Chronological sorting
  - `idx_threat_alerts_severity_detected` - Admin alert filtering
  - `idx_threat_alerts_conv_severity` - Conversation analysis

**Key Features:**
- Multi-category threat classification
- Risk scoring (0-100)
- Pattern matching tracking
- Automatic conversation flagging via trigger

### Enums

- `message_role`: 'user', 'assistant'
- `severity_level`: 'critical', 'high', 'medium', 'low'

### Views

#### `v_conversations_with_threats`
Conversations with aggregated threat statistics.

```sql
SELECT * FROM v_conversations_with_threats
WHERE is_flagged = TRUE
ORDER BY updated_at DESC;
```

#### `v_flagged_conversations`
Detailed view of flagged conversations with threat categories.

```sql
SELECT * FROM v_flagged_conversations
WHERE highest_severity = 'critical';
```

#### `v_user_activity`
User activity and threat summary statistics.

```sql
SELECT * FROM v_user_activity
WHERE total_alerts > 0
ORDER BY highest_severity_detected DESC;
```

## Triggers & Automation

### 1. Conversation Timestamp Update
Automatically updates `conversations.updated_at` when messages are added.

### 2. Message Count Maintenance
Automatically maintains `conversations.message_count` on insert/delete.

### 3. Threat Status Update
Automatically flags conversations and updates severity when alerts are created.

### 4. User Activity Tracking
Updates `users.last_active` when conversations are created.

## Helper Functions

### Authentication

```sql
-- Authenticate user
SELECT * FROM authenticate_user('john.smith', '1234');

-- Get or create user
SELECT get_or_create_user('jane.doe', 'Jane Doe', '5678');
```

### Data Retrieval

```sql
-- Get conversation with all messages
SELECT * FROM get_conversation_with_messages('conversation-uuid');

-- Get all alerts for conversation
SELECT * FROM get_conversation_alerts('conversation-uuid');
```

## Performance Optimization

### Index Strategy

**B-tree Indexes:**
- Primary keys (UUID, BIGSERIAL)
- Foreign key lookups
- Timestamp sorting
- Text equality searches

**Partial Indexes:**
- `idx_conversations_is_flagged` - Only indexes flagged conversations
- `idx_conversations_highest_severity` - Only indexes conversations with threats

**Composite Indexes:**
- `(user_id, updated_at)` - User conversation history
- `(is_flagged, highest_severity, updated_at)` - Admin dashboard
- `(severity, detected_at)` - Alert filtering

### Query Optimization Tips

1. **Always use prepared statements** to prevent SQL injection and improve performance
2. **Use LIMIT** for paginated results
3. **Leverage indexes** - Check EXPLAIN ANALYZE output
4. **Use views** for complex aggregations
5. **Avoid SELECT *** - Specify only needed columns

### Maintenance Schedule

**Daily:**
- Monitor connection pool usage
- Check for long-running queries

**Weekly:**
```sql
VACUUM ANALYZE users;
VACUUM ANALYZE conversations;
VACUUM ANALYZE messages;
VACUUM ANALYZE threat_alerts;
```

**Monthly:**
- Review index usage statistics
- Analyze slow query logs
- Archive old conversations (optional)

## Common Query Patterns

See `common_queries.sql` for production-ready query examples:

### User Operations
- User login (case-insensitive)
- Create new user
- Update remember me setting
- Get all users (admin)

### Conversation Operations
- Get user's conversations
- Get single conversation details
- Create new conversation
- Get all conversations (admin)
- Get flagged conversations only
- Search conversations

### Message Operations
- Get messages for conversation
- Add new message
- Get latest message
- Get message count

### Threat Alert Operations
- Create threat alert
- Get alerts for conversation
- Get critical/high severity alerts
- Get alert statistics
- Get recent alerts (24h)
- Alert pagination

### Analytics
- User activity summary
- Daily threat statistics
- Top users by alert count
- Conversation activity by hour
- Average messages per conversation

## Railway-Specific Configuration

### Connection Pooling

Railway PostgreSQL has connection limits. Use connection pooling:

**Node.js (pg-pool):**
```javascript
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

**Python (psycopg2):**
```python
from psycopg2 import pool
connection_pool = pool.SimpleConnectionPool(
    1, 20,
    dsn=os.environ['DATABASE_URL']
)
```

### SSL Configuration

Railway requires SSL:

```javascript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});
```

### Environment Detection

```javascript
const isProduction = process.env.RAILWAY_ENVIRONMENT === 'production';
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: isProduction ? 20 : 5,
  ssl: isProduction ? { rejectUnauthorized: false } : false
};
```

## Data Retention & Archiving

### Archive Old Conversations

```sql
-- Archive non-flagged conversations older than 90 days
CREATE TABLE conversations_archive (LIKE conversations INCLUDING ALL);

INSERT INTO conversations_archive
SELECT * FROM conversations
WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '90 days'
  AND is_flagged = FALSE;

DELETE FROM conversations
WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '90 days'
  AND is_flagged = FALSE;
```

### Backup Strategy

**Automated Backups (Railway):**
- Railway automatically backs up databases
- Point-in-time recovery available

**Manual Backup:**
```bash
# Full backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Schema only
pg_dump --schema-only $DATABASE_URL > schema_backup.sql

# Data only
pg_dump --data-only $DATABASE_URL > data_backup.sql
```

## Security Best Practices

1. **Never store plaintext passwords** - Use hashed PINs if needed
2. **Use parameterized queries** - Prevent SQL injection
3. **Limit permissions** - Grant minimal required privileges
4. **Enable SSL** - Always use encrypted connections
5. **Regular updates** - Keep PostgreSQL version current
6. **Audit logs** - Enable query logging in production
7. **Row-level security** - Consider RLS for multi-tenant scenarios

## Monitoring & Debugging

### Check Connection Count
```sql
SELECT count(*) FROM pg_stat_activity;
```

### Find Long-Running Queries
```sql
SELECT pid, now() - query_start as duration, query
FROM pg_stat_activity
WHERE state = 'active'
ORDER BY duration DESC;
```

### Check Table Sizes
```sql
SELECT
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Index Usage
```sql
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

## Scaling Considerations

### When to Scale

**Vertical Scaling (Upgrade Plan):**
- CPU usage consistently > 80%
- Memory usage > 90%
- Slow query performance
- Connection limit reached

**Horizontal Scaling (Read Replicas):**
- Heavy read traffic
- Admin dashboard queries slow
- Analytics queries impacting performance

### Optimization Strategies

1. **Partition large tables** (messages > 10M rows)
2. **Implement caching** (Redis for frequent queries)
3. **Use materialized views** for complex analytics
4. **Archive old data** regularly
5. **Optimize indexes** based on query patterns

## Troubleshooting

### Issue: Slow Login Queries
**Solution:** Ensure `idx_users_name_lower` index exists
```sql
CREATE INDEX IF NOT EXISTS idx_users_name_lower ON users (LOWER(name));
```

### Issue: Slow Conversation Retrieval
**Solution:** Check index usage
```sql
EXPLAIN ANALYZE
SELECT * FROM conversations WHERE user_id = 'uuid-here';
```

### Issue: Deadlocks
**Solution:** Ensure consistent transaction ordering
```javascript
// Always acquire locks in same order
// 1. users, 2. conversations, 3. messages, 4. threat_alerts
```

### Issue: Connection Pool Exhausted
**Solution:** Increase pool size or fix connection leaks
```javascript
// Always release connections
try {
  const client = await pool.connect();
  // ... query
} finally {
  client.release();
}
```

## Testing

### Run All Tests
```bash
# Create test database
createdb susan_ai_roofing_test

# Load schema
psql susan_ai_roofing_test < database/schema.sql

# Load test data
psql susan_ai_roofing_test < database/sample_data.sql

# Run test queries
psql susan_ai_roofing_test < database/common_queries.sql
```

### Verify Schema
```sql
-- Check all tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';

-- Check all indexes
SELECT indexname FROM pg_indexes
WHERE schemaname = 'public';

-- Check all triggers
SELECT trigger_name FROM information_schema.triggers
WHERE trigger_schema = 'public';
```

## Migration Strategy

### From SQLite/Other Database

1. **Export data** from current database
2. **Transform data** to match schema
3. **Load into PostgreSQL**
4. **Verify integrity**
5. **Update application code**

Example migration script:
```python
# Example: SQLite to PostgreSQL
import sqlite3
import psycopg2

# Connect to both databases
sqlite_conn = sqlite3.connect('old_database.db')
pg_conn = psycopg2.connect(os.environ['DATABASE_URL'])

# Migrate users
users = sqlite_conn.execute('SELECT * FROM users').fetchall()
for user in users:
    pg_conn.execute(
        'INSERT INTO users (name, display_name, code) VALUES (%s, %s, %s)',
        (user['name'].lower(), user['display_name'], user['code'])
    )
```

## Support & Resources

- PostgreSQL Documentation: https://www.postgresql.org/docs/
- Railway PostgreSQL Guide: https://docs.railway.app/databases/postgresql
- SQL Style Guide: https://www.sqlstyle.guide/

## License

Proprietary - Susan AI Roofing Assistant

---

**Database Version:** 1.0.0
**PostgreSQL Version:** 14+ (Recommended)
**Last Updated:** 2025-10-06
