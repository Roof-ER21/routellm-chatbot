# Data Viewer - Quick Start Guide

## Access the Data Viewer

**URL:** `https://your-domain.com/admin/data-viewer`

**Passcode:** `2110`

---

## Dataset Connection Status

### ✅ SUSAN IS CONNECTED TO THE DATASET

- **1,794 knowledge base chunks** loaded
- **7 source documents** processed
- **RAG system** fully operational
- **Semantic search** working on all queries

---

## Available Data Views

### 1. Conversations
- All user chats with full transcripts
- Search by user, content, or date
- Export to CSV/JSON

### 2. Emails Generated
- All emails created through templates
- Template usage statistics
- Delivery status tracking

### 3. Feedback & Corrections
- Track when Susan was wrong
- User corrections captured
- *Note: Requires new database table*

### 4. User Activity
- Per-user statistics
- Total sessions, messages, emails
- Last active timestamps

### 5. System Logs
- Events, warnings, errors
- Currently shows threat alerts

### 6. RAG System Status
- **Connection indicator** (green = connected)
- Total chunks: 1,794
- Embedding dimension: 1536
- Refresh button

---

## Quick Actions

### Check Dataset Connection
1. Go to "RAG System" tab
2. Look for green "Dataset Connected" ✅
3. Verify: 1,794 chunks loaded

### Export Conversations
1. Go to "Conversations" tab
2. Click "CSV" or "JSON" button
3. File downloads automatically

### Search Data
1. Type in search box at top
2. Results filter in real-time
3. Works across all content

### Filter by Date
1. Select start and end dates
2. Data updates automatically
3. Export filtered results

---

## API Endpoints

### Export Data
```bash
GET /api/admin/export-data?type=conversations&format=json
GET /api/admin/export-data?type=emails&format=csv
GET /api/admin/export-data?type=user_activity
```

### Check Dataset Health
```bash
GET /api/health/dataset
POST /api/health/dataset  # Reload embeddings
```

---

## What's Being Saved

1. **All conversations** → PostgreSQL database
2. **All emails generated** → Tracked with templates
3. **User activity** → Sessions, messages, patterns
4. **Threat alerts** → Security monitoring
5. **RAG queries** → Cached for performance

---

## Quick Troubleshooting

### "No data available"
- Click "Pull Data" in main admin
- Check Database tab for connection
- Verify users are chatting

### "Dataset Disconnected"
- Click "Refresh RAG Status" button
- Check that files exist:
  - `/data/susan_ai_embeddings.json`
  - `/training_data/susan_ai_knowledge_base.json`

---

## Files Created

1. `/app/admin/data-viewer/page.tsx` - Main UI
2. `/app/api/admin/export-data/route.ts` - Export API
3. `/app/api/health/dataset/route.ts` - Health check
4. `/docs/DATA_VIEWER_GUIDE.md` - Full documentation

---

## Documentation

**Full Guide:** `/docs/DATA_VIEWER_GUIDE.md`

**Implementation Summary:** `/DATA_VIEWER_IMPLEMENTATION.md`

---

## Support

1. Check RAG System tab for connection
2. Review System Logs for errors
3. Verify database in Database tab
4. Read full documentation

---

**Status:** Production Ready ✅

**Dataset:** Connected ✅

**Last Updated:** October 24, 2025
