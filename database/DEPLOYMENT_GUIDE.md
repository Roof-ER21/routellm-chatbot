# Susan AI Roofing Assistant - Railway Deployment Guide

## Quick Deployment (5 Minutes)

### Step 1: Connect to Railway PostgreSQL

```bash
# From your Railway dashboard, copy the DATABASE_URL
export DATABASE_URL="postgresql://user:password@host:port/database"

# Or use Railway CLI
railway link
railway run bash
```

### Step 2: Deploy Schema

```bash
# Option A: Automated setup script
cd database
./setup.sh

# Option B: Manual deployment
psql $DATABASE_URL -f database/schema.sql

# Option C: With sample data
psql $DATABASE_URL -f database/schema.sql
psql $DATABASE_URL -f database/sample_data.sql
```

### Step 3: Verify Installation

```bash
# Run performance tests
psql $DATABASE_URL -f database/performance_test.sql

# Or manually verify
psql $DATABASE_URL -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
```

### Step 4: Update Application

```javascript
// In your Node.js application
const { pool } = require('./database/integration_examples');

// Test connection
await pool.query('SELECT NOW()');
```

## Complete File Structure

```
/Users/a21/routellm-chatbot-railway/database/
├── schema.sql                    # Complete database schema
├── sample_data.sql               # Sample test data
├── common_queries.sql            # 30+ production-ready queries
├── integration_examples.js       # Node.js integration code
├── performance_test.sql          # Performance benchmarking
├── setup.sh                      # Automated deployment script
├── README.md                     # Comprehensive documentation
└── DEPLOYMENT_GUIDE.md          # This file
```

## Architecture Overview

### Tables

1. **users** - User accounts with PIN authentication
   - 4 rows typical
   - Primary index: name (lowercase)
   - Auto-updates: last_active timestamp

2. **conversations** - Conversation metadata
   - Hundreds to thousands of rows
   - Key indexes: user_id, is_flagged, updated_at
   - Auto-maintains: message_count, highest_severity

3. **messages** - Individual chat messages
   - Thousands to millions of rows
   - Key indexes: conversation_id, message_index
   - Auto-updates: conversation timestamps

4. **threat_alerts** - Detected suspicious patterns
   - Variable rows based on detections
   - Key indexes: severity, detected_at
   - Auto-updates: conversation flags

### Key Features

- **Automatic Triggers**: Updates timestamps, counts, and flags
- **Helper Functions**: Simplify common operations
- **Materialized Views**: Fast analytics queries
- **Comprehensive Indexes**: Optimized for all query patterns
- **Foreign Key Cascades**: Clean data deletion
- **Check Constraints**: Data integrity enforcement

## Performance Characteristics

### Expected Query Times (Railway Starter Plan)

- User login: < 5ms
- Get conversations: < 10ms
- Load messages: < 15ms
- Admin dashboard: < 50ms
- Analytics queries: < 100ms

### Index Strategy

**B-tree Indexes** (default):
- Equality searches (user_id, conversation_id)
- Sorting operations (created_at, updated_at)
- Range queries (timestamps)

**Partial Indexes** (performance optimization):
- Only flagged conversations
- Only conversations with threats
- Reduces index size by 90%+

**Composite Indexes** (multi-column queries):
- (user_id, updated_at) - User conversation history
- (is_flagged, highest_severity, updated_at) - Admin filtering
- (severity, detected_at) - Alert monitoring

### Scaling Thresholds

| Metric | Starter | Pro | Enterprise |
|--------|---------|-----|------------|
| Users | < 1,000 | < 10,000 | Unlimited |
| Conversations | < 50,000 | < 500,000 | Unlimited |
| Messages | < 500,000 | < 5,000,000 | Unlimited |
| Queries/sec | < 100 | < 1,000 | Unlimited |

## Common Operations

### User Authentication

```javascript
const { authenticateUser } = require('./database/integration_examples');

const user = await authenticateUser('john.smith', '1234');
if (user) {
  console.log('Welcome,', user.display_name);
}
```

### Create Conversation

```javascript
const { createConversation } = require('./database/integration_examples');

const conv = await createConversation(
  userId,
  'How do I schedule a roof inspection?'
);
```

### Add Messages

```javascript
const { addMessage } = require('./database/integration_examples');

await addMessage(conversationId, 'user', 'I need help');
await addMessage(conversationId, 'assistant', 'Happy to help!');
```

### Record Threat Alert

```javascript
const { createThreatAlert } = require('./database/integration_examples');

await createThreatAlert({
  conversationId,
  messageId,
  pattern: 'export.*customer.*data',
  category: 'Data Theft',
  severity: 'high',
  riskScore: 85,
  highlightedText: 'export all customer data'
});
```

### Get Flagged Conversations (Admin)

```javascript
const { getFlaggedConversations } = require('./database/integration_examples');

const flagged = await getFlaggedConversations('critical', 20);
```

## Environment Configuration

### Railway Environment Variables

```env
# Automatically provided by Railway
DATABASE_URL=postgresql://user:password@host:port/database
PGHOST=host
PGPORT=5432
PGUSER=user
PGPASSWORD=password
PGDATABASE=database

# Application configuration
NODE_ENV=production
```

### Connection Pool Settings

```javascript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                        // Railway Starter: 20, Pro: 100
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: { rejectUnauthorized: false }
});
```

## Maintenance Schedule

### Daily
- Monitor connection pool usage
- Check for slow queries
- Review error logs

### Weekly
```sql
-- Run VACUUM ANALYZE
VACUUM ANALYZE users;
VACUUM ANALYZE conversations;
VACUUM ANALYZE messages;
VACUUM ANALYZE threat_alerts;
```

### Monthly
```bash
# Performance testing
psql $DATABASE_URL -f database/performance_test.sql

# Review and archive old data
psql $DATABASE_URL -c "DELETE FROM conversations WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '90 days' AND is_flagged = FALSE;"
```

### Quarterly
- Review index usage statistics
- Analyze query patterns
- Optimize based on growth
- Update PostgreSQL version if needed

## Monitoring & Alerts

### Key Metrics to Monitor

1. **Connection Count**
   ```sql
   SELECT count(*) FROM pg_stat_activity;
   ```

2. **Database Size**
   ```sql
   SELECT pg_size_pretty(pg_database_size(current_database()));
   ```

3. **Slow Queries**
   ```sql
   SELECT pid, now() - query_start as duration, query
   FROM pg_stat_activity
   WHERE state = 'active' AND now() - query_start > interval '5 seconds';
   ```

4. **Cache Hit Ratio** (should be > 99%)
   ```sql
   SELECT sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) as ratio
   FROM pg_statio_user_tables;
   ```

### Railway Dashboard Alerts

Configure alerts for:
- CPU usage > 80%
- Memory usage > 90%
- Connection count > 80% of limit
- Disk usage > 75%

## Backup & Recovery

### Automated Backups (Railway)

Railway automatically backs up your database:
- **Frequency**: Daily
- **Retention**: 7 days (Starter), 30 days (Pro)
- **Recovery**: Point-in-time via Railway dashboard

### Manual Backups

```bash
# Full backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup_20250101.sql

# Schema only
pg_dump --schema-only $DATABASE_URL > schema_backup.sql

# Data only
pg_dump --data-only $DATABASE_URL > data_backup.sql
```

### Backup Before Major Changes

```bash
# Always backup before migrations
./database/setup.sh --skip-sample  # This creates automatic backup
```

## Security Best Practices

### 1. Connection Security

```javascript
// Always use SSL in production
ssl: process.env.NODE_ENV === 'production' ? {
  rejectUnauthorized: false
} : false
```

### 2. Query Parameterization

```javascript
// GOOD: Parameterized query
pool.query('SELECT * FROM users WHERE name = $1', [username]);

// BAD: String concatenation (SQL injection risk)
pool.query(`SELECT * FROM users WHERE name = '${username}'`);
```

### 3. Least Privilege

```sql
-- Create app-specific user with limited permissions
CREATE USER susan_app WITH PASSWORD 'secure_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO susan_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO susan_app;
```

### 4. Environment Variables

```javascript
// Never hardcode credentials
// GOOD:
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// BAD:
const pool = new Pool({ connectionString: 'postgresql://user:pass@...' });
```

## Troubleshooting

### Issue: Cannot Connect to Database

**Solution:**
```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check Railway status
railway status

# Verify DATABASE_URL
echo $DATABASE_URL
```

### Issue: Slow Queries

**Solution:**
```sql
-- Identify slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check index usage
SELECT * FROM pg_stat_user_indexes WHERE idx_scan = 0;

-- Run VACUUM ANALYZE
VACUUM ANALYZE;
```

### Issue: Connection Pool Exhausted

**Solution:**
```javascript
// Ensure connections are released
const client = await pool.connect();
try {
  const result = await client.query('SELECT * FROM users');
  return result.rows;
} finally {
  client.release();  // Always release!
}
```

### Issue: Deadlocks

**Solution:**
```javascript
// Acquire locks in consistent order
// Always: users -> conversations -> messages -> threat_alerts

const client = await pool.connect();
try {
  await client.query('BEGIN');
  // Insert in order
  await client.query('INSERT INTO conversations...');
  await client.query('INSERT INTO messages...');
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
}
```

## Migration from Existing Database

### From SQLite

```python
import sqlite3
import psycopg2
import os

# Connect to both databases
sqlite_conn = sqlite3.connect('old_database.db')
sqlite_conn.row_factory = sqlite3.Row
pg_conn = psycopg2.connect(os.environ['DATABASE_URL'])

# Migrate users
users = sqlite_conn.execute('SELECT * FROM users').fetchall()
for user in users:
    pg_conn.execute(
        'INSERT INTO users (name, display_name, code) VALUES (%s, %s, %s)',
        (user['name'].lower(), user['display_name'], user['code'])
    )

pg_conn.commit()
```

### From MongoDB

```javascript
const { MongoClient } = require('mongodb');
const { pool } = require('./database/integration_examples');

const mongoClient = new MongoClient(process.env.MONGODB_URI);
await mongoClient.connect();

const users = await mongoClient.db().collection('users').find().toArray();

for (const user of users) {
  await pool.query(
    'INSERT INTO users (name, display_name, code) VALUES ($1, $2, $3)',
    [user.name.toLowerCase(), user.displayName, user.code]
  );
}
```

## Testing

### Unit Tests

```javascript
const { testConnection, createUser, authenticateUser } = require('./database/integration_examples');

describe('Database Integration', () => {
  test('should connect to database', async () => {
    expect(await testConnection()).toBe(true);
  });

  test('should create and authenticate user', async () => {
    const user = await createUser('test.user', 'Test User', '1234');
    expect(user.display_name).toBe('Test User');

    const auth = await authenticateUser('test.user', '1234');
    expect(auth.id).toBe(user.id);
  });
});
```

### Performance Tests

```bash
# Run comprehensive performance tests
psql $DATABASE_URL -f database/performance_test.sql
```

### Load Testing

```javascript
// Simple load test
async function loadTest() {
  const promises = [];
  for (let i = 0; i < 100; i++) {
    promises.push(
      pool.query('SELECT * FROM users LIMIT 10')
    );
  }
  await Promise.all(promises);
}
```

## Optimization Tips

### 1. Use Connection Pooling

```javascript
// GOOD: Reuse connections
const result = await pool.query('SELECT * FROM users');

// BAD: Create new connection each time
const client = new Client();
await client.connect();
const result = await client.query('SELECT * FROM users');
await client.end();
```

### 2. Limit Result Sets

```sql
-- GOOD: Use LIMIT
SELECT * FROM messages WHERE conversation_id = $1 LIMIT 100;

-- BAD: Fetch all rows
SELECT * FROM messages WHERE conversation_id = $1;
```

### 3. Use Prepared Statements

```javascript
// Reuse query plans
const query = {
  name: 'fetch-user',
  text: 'SELECT * FROM users WHERE id = $1',
  values: [userId]
};
await pool.query(query);
```

### 4. Batch Operations

```javascript
// GOOD: Batch insert
const values = users.map((u, i) => `($${i*3+1}, $${i*3+2}, $${i*3+3})`).join(',');
await pool.query(
  `INSERT INTO users (name, display_name, code) VALUES ${values}`,
  users.flatMap(u => [u.name, u.display_name, u.code])
);

// BAD: Individual inserts
for (const user of users) {
  await pool.query('INSERT INTO users...');
}
```

## Support Resources

- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Railway Docs**: https://docs.railway.app/databases/postgresql
- **Node.js pg Library**: https://node-postgres.com/
- **Schema Files**: `/Users/a21/routellm-chatbot-railway/database/`

## Version History

- **1.0.0** (2025-10-06) - Initial production-ready schema
  - 4 tables: users, conversations, messages, threat_alerts
  - 20+ indexes for optimal performance
  - 5 triggers for automation
  - 6 helper functions
  - 3 materialized views

---

**Ready to deploy!** Your database schema is production-ready and optimized for Railway deployment.

For questions or issues, refer to the comprehensive documentation in `/Users/a21/routellm-chatbot-railway/database/README.md`
