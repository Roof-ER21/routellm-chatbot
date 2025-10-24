# Data Viewer Guide

## Overview

The Data Viewer is a comprehensive administrative dashboard that displays all saved data across the Susan AI system. It provides complete visibility into conversations, emails, feedback, user activity, system logs, and RAG (Retrieval-Augmented Generation) system status.

## Access

**URL:** `https://your-domain.com/admin/data-viewer`

**Passcode:** `2110`

## Features

### 1. Conversations Viewer

Displays all user conversations with Susan AI.

**Information Shown:**
- User name
- Conversation start time
- Total message count
- Full message transcript (user and assistant messages)
- Timestamps for each message

**Actions:**
- Search conversations by user, content, or date
- Filter by date range
- Export to CSV or JSON
- View full conversation details

**Example Use Case:**
Review a specific user's conversation history to understand their usage patterns.

### 2. Emails Generated Viewer

Shows all emails generated through Susan's template system.

**Information Shown:**
- User who generated the email
- Template used (e.g., "Reinspection Request", "Appeal Letter")
- Recipient email address
- Email subject
- Full email body
- Generation timestamp
- Delivery status (sent/pending)

**Actions:**
- Search by user, template, or content
- Filter by date range
- Export email records
- Track which templates are most used

**Example Use Case:**
Audit all appeal letters generated in the last month to ensure quality.

### 3. Feedback & Corrections Viewer

Tracks instances where users report Susan was wrong or provide corrections.

**Information Shown:**
- User who submitted feedback
- Original question asked
- Susan's response
- User's correction/explanation of what was wrong
- Severity level (low/medium/high)
- Status (new/reviewed/fixed)
- Timestamp

**Actions:**
- Filter by severity or status
- Mark feedback as reviewed or fixed
- Export for training data improvement

**Example Use Case:**
Review all high-severity feedback items to identify knowledge gaps in Susan's training.

**Note:** This feature requires a new database table (`user_feedback`) to be implemented. Currently returns empty array.

### 4. User Activity Viewer

Per-user breakdown of system usage.

**Information Shown:**
- User name
- Total sessions
- Total messages sent
- Total emails generated
- Most-used email template
- Error rate (future feature)
- Last active timestamp

**Actions:**
- Sort by activity metrics
- Identify power users
- Track user engagement over time

**Example Use Case:**
Identify which users are most active and which features they use most.

### 5. System Logs Viewer

Displays system events, errors, and warnings.

**Information Shown:**
- Log level (info/warning/error)
- Log message
- Timestamp
- Metadata (additional context)

**Current Implementation:**
Uses threat alerts as a proxy for system logs. Shows security-related events.

**Example Use Case:**
Debug issues by reviewing error logs from a specific time period.

### 6. RAG System Status

Displays the health and status of Susan's knowledge base and dataset connection.

**Information Shown:**
- Connection status (Connected/Disconnected)
- Total embedding chunks loaded
- Embedding dimension
- Number of source documents
- Cache size
- System paths
- Environment configuration

**Key Metrics:**
- **Total Chunks:** Number of knowledge base segments (currently 1,794)
- **Embedding Dimension:** Vector size (1536 for OpenAI text-embedding-3-small)
- **Sources:** Number of documents processed (currently 7)
- **Cache Size:** Number of cached query results

**Actions:**
- Refresh RAG status
- View system paths
- Check if dataset is loaded

**Example Use Case:**
Verify that Susan has access to her training data before troubleshooting answer quality issues.

## API Endpoints

### 1. Export Data API

**Endpoint:** `/api/admin/export-data`

**Method:** `GET`

**Query Parameters:**
- `type` - Data type to export (required)
  - `conversations` - All chat conversations
  - `emails` - Generated emails
  - `feedback` - User feedback/corrections
  - `user_activity` - Per-user statistics
  - `logs` - System logs
  - `questions` - All questions asked
  - `analytics` - Usage analytics by date
- `format` - Export format (`json` or `csv`)
- `start_date` - Filter by start date (ISO format)
- `end_date` - Filter by end date (ISO format)
- `user` - Filter by specific user

**Example Requests:**

```bash
# Export all conversations as JSON
GET /api/admin/export-data?type=conversations&format=json

# Export emails from specific date range as CSV
GET /api/admin/export-data?type=emails&format=csv&start_date=2025-01-01&end_date=2025-01-31

# Export user activity for specific user
GET /api/admin/export-data?type=user_activity&user=John

# Get analytics data
GET /api/admin/export-data?type=analytics
```

**Response Format (JSON):**

```json
{
  "success": true,
  "type": "conversations",
  "count": 150,
  "data": [ /* array of data objects */ ],
  "timestamp": "2025-10-24T20:00:00.000Z"
}
```

**Response Format (CSV):**

Returns CSV file with appropriate headers for download.

### 2. Dataset Health Check API

**Endpoint:** `/api/health/dataset`

**Method:** `GET` - Check status | `POST` - Reload embeddings

**GET Response:**

```json
{
  "success": true,
  "connected": true,
  "timestamp": "2025-10-24T20:00:00.000Z",
  "rag": {
    "loaded": true,
    "enabled": true,
    "totalChunks": 1794,
    "cacheSize": 25,
    "embeddingDimension": 1536
  },
  "files": {
    "embeddings": {
      "exists": true,
      "path": "/path/to/susan_ai_embeddings.json",
      "stats": {
        "size": 85802147,
        "sizeFormatted": "81.82 MB",
        "modified": "2025-10-24T03:32:00.000Z"
      }
    },
    "knowledgeBase": {
      "exists": true,
      "path": "/path/to/susan_ai_knowledge_base.json",
      "stats": {
        "size": 32972,
        "sizeFormatted": "32.2 KB",
        "modified": "2025-10-04T04:27:00.000Z"
      }
    }
  },
  "metadata": {
    "total_chunks": 1794,
    "embedding_model": "text-embedding-3-small",
    "sources_processed": 7,
    "total_tokens_used": 356708,
    "estimated_cost_usd": 7.1342
  },
  "environment": {
    "RAG_ENABLED": "true",
    "RAG_TOP_K": "5",
    "OPENAI_API_KEY": "configured"
  },
  "health": {
    "status": "healthy",
    "issues": []
  }
}
```

**POST Request (Reload Embeddings):**

```bash
POST /api/health/dataset
```

Triggers a reload of the RAG embeddings from disk.

## Filters & Search

### Search Functionality

The search bar at the top of each tab allows you to search across:
- User names
- Message content
- Email subjects and bodies
- Dates (formatted strings match)
- Any text content in the current view

### Date Range Filtering

Select start and end dates to filter data within a specific time period.

### User Filtering

Select a specific user to view only their data, or choose "All Users" for complete data.

### Items Per Page

Choose how many items to display per page:
- 50 items (default)
- 100 items
- 200 items

## Export Functionality

### Export to CSV

- Click the "CSV" button to download current data as a CSV file
- File name format: `{type}_{date}.csv`
- Includes headers for all fields
- Compatible with Excel, Google Sheets, and data analysis tools

### Export to JSON

- Click the "JSON" button to download current data as JSON
- File name format: `{type}_{date}.json`
- Includes all data with proper structure
- Can be re-imported or used for analysis

## Use Cases

### 1. Quality Assurance

**Scenario:** Review Susan's responses for accuracy

**Steps:**
1. Go to Conversations tab
2. Search for specific topics or keywords
3. Review Susan's responses
4. If issues found, note them in Feedback tab
5. Export problematic conversations for training data review

### 2. Template Performance Analysis

**Scenario:** Which email templates are most used?

**Steps:**
1. Go to Emails Generated tab
2. Export all emails as CSV
3. Analyze template usage in Excel/Sheets
4. Identify most popular templates
5. Review quality of generated emails

### 3. User Engagement Tracking

**Scenario:** Monitor user adoption and engagement

**Steps:**
1. Go to User Activity tab
2. Sort by total messages or sessions
3. Identify power users
4. Track engagement trends over time
5. Export for executive reporting

### 4. System Health Monitoring

**Scenario:** Ensure Susan has access to knowledge base

**Steps:**
1. Go to RAG System tab
2. Verify "Connected" status is green
3. Check total chunks loaded (should be 1,794)
4. Verify embedding dimension (should be 1536)
5. If issues, click "Refresh RAG Status"

### 5. Incident Investigation

**Scenario:** User reports Susan gave wrong answer

**Steps:**
1. Go to Conversations tab
2. Search for user name
3. Find relevant conversation
4. Review full transcript
5. Check RAG System tab to verify dataset connection
6. Document in Feedback tab if needed

## Database Schema

### Tables Used

1. **chat_sessions** - Conversation metadata
2. **chat_messages** - Individual messages
3. **reps** - User information
4. **sent_emails** - Generated emails
5. **threat_alerts** - Security events (used for logs)

### Future Tables (Recommended)

1. **user_feedback** - Track corrections and feedback
   ```sql
   CREATE TABLE user_feedback (
     id SERIAL PRIMARY KEY,
     user_id INTEGER REFERENCES reps(id),
     question TEXT NOT NULL,
     susan_response TEXT NOT NULL,
     user_correction TEXT NOT NULL,
     severity VARCHAR(20) DEFAULT 'medium',
     status VARCHAR(20) DEFAULT 'new',
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

2. **system_logs** - Dedicated logging table
   ```sql
   CREATE TABLE system_logs (
     id SERIAL PRIMARY KEY,
     level VARCHAR(20) NOT NULL,
     message TEXT NOT NULL,
     metadata JSONB,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

3. **template_usage** - Track template statistics
   ```sql
   CREATE TABLE template_usage (
     id SERIAL PRIMARY KEY,
     user_id INTEGER REFERENCES reps(id),
     template_name VARCHAR(255) NOT NULL,
     generation_time_ms INTEGER,
     copied BOOLEAN DEFAULT FALSE,
     regenerated BOOLEAN DEFAULT FALSE,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

## Troubleshooting

### Issue: "No data available"

**Possible Causes:**
- Database not connected
- No data has been created yet
- Date range filter too restrictive

**Solutions:**
1. Check Database tab in main admin dashboard
2. Run "Initialize Tables" if needed
3. Clear filters and search
4. Verify users are actively using the system

### Issue: "Dataset Disconnected" in RAG tab

**Possible Causes:**
- Embeddings file missing
- RAG_ENABLED environment variable set to false
- File permissions issue

**Solutions:**
1. Check `/data/susan_ai_embeddings.json` exists
2. Verify environment: `RAG_ENABLED=true`
3. Click "Refresh RAG Status" button
4. Check server logs for errors

### Issue: Export fails

**Possible Causes:**
- Large dataset causing timeout
- Browser blocking download
- API error

**Solutions:**
1. Use date range filters to reduce data size
2. Check browser popup blocker settings
3. Check browser console for errors
4. Try different export format (CSV vs JSON)

## Security

### Authentication

- Passcode required: `2110`
- Session-based authentication (stored in sessionStorage)
- Logout clears authentication

### Data Protection

- All data queries go through authenticated API routes
- Database credentials stored securely in environment variables
- No sensitive data exposed in client-side code

### Access Control

- Admin-only access (passcode protected)
- No data modification capabilities (read-only)
- Audit trail via system logs

## Performance

### Optimization Features

- Pagination (50/100/200 items per page)
- Client-side search filtering
- Lazy loading of data
- Efficient database queries with indexes

### Best Practices

- Use date range filters for large datasets
- Export large datasets in smaller chunks
- Clear search filters when not needed
- Use pagination for better performance

## Future Enhancements

### Planned Features

1. **Advanced Analytics Dashboard**
   - Conversation trends over time
   - Popular questions analysis
   - Template effectiveness metrics
   - User engagement heatmaps

2. **Real-time Monitoring**
   - Live conversation feed
   - Real-time user activity
   - System health alerts
   - Performance metrics

3. **Data Visualization**
   - Charts and graphs
   - Trend analysis
   - Comparison views
   - Interactive dashboards

4. **Enhanced Filtering**
   - Multi-select filters
   - Saved filter presets
   - Advanced query builder
   - Custom date ranges

5. **Feedback Management**
   - In-app feedback submission
   - Automated quality scoring
   - Training data pipeline
   - Response improvement tracking

## Support

For issues or questions about the Data Viewer:

1. Check this documentation
2. Review system logs in the dashboard
3. Verify database connection in Database tab
4. Check RAG system status in RAG System tab
5. Contact system administrator

## Change Log

### Version 1.0 (October 2025)
- Initial release
- Conversations viewer
- Emails viewer
- User activity viewer
- System logs viewer
- RAG system status
- Export functionality (CSV/JSON)
- Search and filters
- Pagination

---

**Last Updated:** October 24, 2025

**Document Version:** 1.0

**System Version:** Susan AI-21 Production
