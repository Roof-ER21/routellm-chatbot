# Conversation Sync API Documentation

Complete API documentation for the hybrid localStorage + PostgreSQL sync system for Susan AI chatbot.

## Overview

This system enables:
- **Client-side storage** (fast): Conversations saved to localStorage first
- **Server-side sync** (reliable): Conversations synced to PostgreSQL
- **Multi-device access**: Admin can see ALL conversations from ALL devices
- **Graceful degradation**: Works offline, syncs when online

## Architecture

```
┌─────────────────┐
│  Client Browser │
│   (localStorage) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────────┐
│   API Endpoints │─────▶│   PostgreSQL     │
│   (Next.js)     │      │   (Railway)      │
└─────────────────┘      └──────────────────┘
```

## Database Schema

### Tables

**sync_users**
- `id` (SERIAL PRIMARY KEY)
- `name` (VARCHAR, UNIQUE) - Username (case-insensitive)
- `code` (VARCHAR) - User passcode
- `display_name` (VARCHAR) - Display name
- `created_at` (TIMESTAMP)
- `last_active` (TIMESTAMP)

**sync_conversations**
- `id` (VARCHAR PRIMARY KEY) - Client-generated UUID
- `user_id` (INTEGER) - References sync_users
- `title` (TEXT)
- `preview` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**sync_messages**
- `id` (VARCHAR PRIMARY KEY)
- `conversation_id` (VARCHAR) - References sync_conversations
- `role` (VARCHAR) - 'user' or 'assistant'
- `content` (TEXT)
- `timestamp` (TIMESTAMP)

**sync_alerts**
- `id` (VARCHAR PRIMARY KEY)
- `conversation_id` (VARCHAR) - References sync_conversations
- `type` (VARCHAR)
- `severity` (VARCHAR) - 'info', 'warning', or 'critical'
- `title` (TEXT)
- `message` (TEXT)
- `timestamp` (TIMESTAMP)
- `flagged` (BOOLEAN)

## API Endpoints

### 1. POST /api/sync/signup

Create a new user account.

**Request:**
```json
{
  "name": "john_doe",
  "code": "secret123",
  "displayName": "John Doe"
}
```

**Response (Success):**
```json
{
  "success": true,
  "userId": 1,
  "displayName": "John Doe"
}
```

**Response (Error - User Exists):**
```json
{
  "success": false,
  "error": "User with this name already exists"
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid request
- `409` - User already exists
- `500` - Server error
- `503` - Database unavailable

---

### 2. POST /api/sync/login

Verify user credentials and update last_active timestamp.

**Request:**
```json
{
  "name": "john_doe",
  "code": "secret123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "userId": 1,
  "displayName": "John Doe",
  "lastActive": "2025-10-06T12:00:00.000Z"
}
```

**Response (Error - Invalid Credentials):**
```json
{
  "success": false,
  "error": "Invalid credentials. Please check your name and code."
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid request
- `401` - Invalid credentials
- `500` - Server error
- `503` - Database unavailable

---

### 3. POST /api/sync/conversation

Sync a conversation to the database (upsert: update if exists, create if new).

**Request:**
```json
{
  "userId": 1,
  "conversation": {
    "id": "conv-uuid-123",
    "title": "Property Damage Claim",
    "preview": "I need help with a property damage claim...",
    "createdAt": "2025-10-06T10:00:00.000Z",
    "messages": [
      {
        "id": "msg-uuid-1",
        "role": "user",
        "content": "I need help with a property damage claim",
        "timestamp": "2025-10-06T10:00:00.000Z"
      },
      {
        "id": "msg-uuid-2",
        "role": "assistant",
        "content": "I'd be happy to help you with your property damage claim...",
        "timestamp": "2025-10-06T10:00:05.000Z"
      }
    ],
    "alerts": [
      {
        "id": "alert-uuid-1",
        "type": "high_value_claim",
        "severity": "warning",
        "title": "High Value Claim Detected",
        "message": "Claim amount exceeds $10,000",
        "timestamp": "2025-10-06T10:05:00.000Z",
        "flagged": true
      }
    ]
  }
}
```

**Response (Success):**
```json
{
  "success": true,
  "conversationId": "conv-uuid-123",
  "messageCount": 2,
  "alertCount": 1
}
```

**Response (Error - User Not Found):**
```json
{
  "success": false,
  "error": "User not found. Please log in again."
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid request
- `404` - User not found
- `500` - Server error
- `503` - Database unavailable

**Notes:**
- Uses transactions to ensure data consistency
- Batch inserts for better performance
- Replaces existing messages/alerts for the conversation

---

### 4. GET /api/sync/conversations?userId=xxx

Get all conversations for a specific user.

**Request:**
```
GET /api/sync/conversations?userId=1
```

**Response (Success):**
```json
{
  "success": true,
  "conversations": [
    {
      "id": "conv-uuid-123",
      "user_id": 1,
      "title": "Property Damage Claim",
      "preview": "I need help with a property damage claim...",
      "created_at": "2025-10-06T10:00:00.000Z",
      "updated_at": "2025-10-06T10:05:00.000Z",
      "message_count": 2,
      "alert_count": 1
    }
  ],
  "count": 1
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid userId
- `500` - Server error
- `503` - Database unavailable

---

### 5. GET /api/admin/all-conversations

**Admin Only** - Get ALL conversations from ALL users.

**Authentication:**
- Header: `x-admin-passcode: 2110`
- OR Query: `?passcode=2110`

**Request:**
```
GET /api/admin/all-conversations?passcode=2110
GET /api/admin/all-conversations?passcode=2110&flagged=true
GET /api/admin/all-conversations?passcode=2110&severity=critical
GET /api/admin/all-conversations?passcode=2110&conversationId=conv-uuid-123
```

**Query Parameters:**
- `passcode` (required) - Admin passcode: 2110
- `flagged` (optional) - Filter to conversations with flagged alerts
- `severity` (optional) - Filter by alert severity: 'info', 'warning', 'critical'
- `conversationId` (optional) - Get full details for a specific conversation

**Response (List View):**
```json
{
  "success": true,
  "conversations": [
    {
      "id": "conv-uuid-123",
      "user_id": 1,
      "title": "Property Damage Claim",
      "preview": "I need help with...",
      "created_at": "2025-10-06T10:00:00.000Z",
      "updated_at": "2025-10-06T10:05:00.000Z",
      "display_name": "John Doe",
      "user_name": "john_doe",
      "message_count": 2,
      "alert_count": 1,
      "flagged_alert_count": 1,
      "critical_alert_count": 0
    }
  ],
  "stats": {
    "totalConversations": 1,
    "totalMessages": 2,
    "totalAlerts": 1,
    "flaggedConversations": 1,
    "criticalAlertConversations": 0
  },
  "count": 1
}
```

**Response (Single Conversation Detail):**
```json
{
  "success": true,
  "conversation": {
    "id": "conv-uuid-123",
    "user_id": 1,
    "title": "Property Damage Claim",
    "display_name": "John Doe",
    "user_name": "john_doe",
    "messages": [...],
    "alerts": [...]
  }
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized (invalid passcode)
- `404` - Conversation not found (when using conversationId)
- `500` - Server error
- `503` - Database unavailable

---

### 6. GET /api/admin/sync-stats

**Admin Only** - Get system-wide statistics.

**Authentication:**
- Header: `x-admin-passcode: 2110`
- OR Query: `?passcode=2110`

**Request:**
```
GET /api/admin/sync-stats?passcode=2110
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalUsers": 5,
    "totalConversations": 42,
    "totalMessages": 523,
    "totalAlerts": 18,
    "criticalAlerts": 3,
    "highAlerts": 7,
    "flaggedAlerts": 5
  },
  "userStats": [
    {
      "userId": 1,
      "name": "john_doe",
      "displayName": "John Doe",
      "lastActive": "2025-10-06T12:00:00.000Z",
      "conversationCount": 10,
      "messageCount": 120,
      "alertCount": 5,
      "criticalAlertCount": 1
    }
  ]
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized (invalid passcode)
- `500` - Server error
- `503` - Database unavailable

---

## Client-Side Integration

### Using the SyncClient Helper

```typescript
import { SyncClient } from '@/lib/sync-types'

// Initialize client
const syncClient = new SyncClient()

// Signup
const signupResult = await syncClient.signup('john_doe', 'secret123', 'John Doe')
if (signupResult.success) {
  console.log('User created:', signupResult.userId)
}

// Login
const loginResult = await syncClient.login('john_doe', 'secret123')
if (loginResult.success) {
  console.log('Logged in:', loginResult.userId)
  // userId is automatically set in the client
}

// Sync a conversation
const conversation = {
  id: 'conv-uuid-123',
  title: 'Property Damage Claim',
  preview: 'I need help with...',
  messages: [...],
  alerts: [...]
}

const syncResult = await syncClient.syncConversation(conversation)
if (syncResult.success) {
  console.log('Conversation synced')
}

// Get all user conversations
const conversations = await syncClient.getConversations()
console.log('User has', conversations.count, 'conversations')

// Admin: Get all conversations
const allConversations = await syncClient.getAllConversations('2110', { flagged: true })
console.log('Flagged conversations:', allConversations.conversations)

// Admin: Get system stats
const stats = await syncClient.getSystemStats('2110')
console.log('System stats:', stats.stats)
```

### Hybrid Sync Pattern

```typescript
// 1. Save to localStorage first (fast, always works)
function saveConversationLocally(conversation: ConversationData) {
  const conversations = JSON.parse(localStorage.getItem('conversations') || '[]')
  const index = conversations.findIndex((c: any) => c.id === conversation.id)

  if (index >= 0) {
    conversations[index] = conversation
  } else {
    conversations.push(conversation)
  }

  localStorage.setItem('conversations', JSON.stringify(conversations))
}

// 2. Sync to server (reliable, for admin access)
async function syncConversationToServer(conversation: ConversationData) {
  try {
    const result = await syncClient.syncConversation(conversation)
    if (result.success) {
      console.log('Synced to server')
      return true
    }
  } catch (error) {
    console.error('Sync failed, will retry later:', error)
    // Queue for retry
    queueForRetry(conversation)
  }
  return false
}

// 3. Combined save function
async function saveConversation(conversation: ConversationData) {
  // Save locally first (always succeeds)
  saveConversationLocally(conversation)

  // Then sync to server (best effort)
  await syncConversationToServer(conversation)
}
```

### Retry Queue Pattern

```typescript
// Retry failed syncs when connection is restored
let syncQueue: ConversationData[] = []

function queueForRetry(conversation: ConversationData) {
  const index = syncQueue.findIndex(c => c.id === conversation.id)
  if (index >= 0) {
    syncQueue[index] = conversation
  } else {
    syncQueue.push(conversation)
  }
  localStorage.setItem('syncQueue', JSON.stringify(syncQueue))
}

async function processSyncQueue() {
  const queue = JSON.parse(localStorage.getItem('syncQueue') || '[]')

  for (const conversation of queue) {
    try {
      const result = await syncClient.syncConversation(conversation)
      if (result.success) {
        // Remove from queue
        syncQueue = syncQueue.filter(c => c.id !== conversation.id)
      }
    } catch (error) {
      console.error('Retry failed:', error)
      break // Stop processing on first failure
    }
  }

  localStorage.setItem('syncQueue', JSON.stringify(syncQueue))
}

// Process queue every 5 minutes
setInterval(processSyncQueue, 5 * 60 * 1000)

// Process queue when online
window.addEventListener('online', processSyncQueue)
```

## Security

### User Endpoints
- Users can only access their own data
- User credentials verified on every request
- SQL injection prevention via parameterized queries

### Admin Endpoints
- Admin passcode required: `2110`
- Can be passed via header or query parameter
- Access to all users' data

### Database
- Connection pooling for performance
- Transactions for data consistency
- Foreign key constraints for referential integrity
- Indexes for query optimization

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message here"
}
```

**Error Types:**
- **400** - Bad Request (invalid input)
- **401** - Unauthorized (invalid credentials/passcode)
- **404** - Not Found (user/conversation doesn't exist)
- **409** - Conflict (user already exists)
- **500** - Internal Server Error
- **503** - Service Unavailable (database connection failed)

## Performance Optimizations

1. **Connection Pooling** - Reuses database connections
2. **Batch Inserts** - Inserts multiple messages/alerts at once
3. **Transactions** - Ensures atomic operations
4. **Indexes** - Fast queries on common operations
5. **Limit Results** - Max 1000 conversations per admin query

## Testing

### Test User Signup
```bash
curl -X POST http://localhost:4000/api/sync/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"test_user","code":"test123","displayName":"Test User"}'
```

### Test Login
```bash
curl -X POST http://localhost:4000/api/sync/login \
  -H "Content-Type: application/json" \
  -d '{"name":"test_user","code":"test123"}'
```

### Test Conversation Sync
```bash
curl -X POST http://localhost:4000/api/sync/conversation \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "conversation": {
      "id": "test-conv-1",
      "title": "Test Conversation",
      "preview": "This is a test",
      "messages": [
        {
          "id": "msg-1",
          "role": "user",
          "content": "Hello",
          "timestamp": "2025-10-06T12:00:00.000Z"
        }
      ]
    }
  }'
```

### Test Get Conversations
```bash
curl http://localhost:4000/api/sync/conversations?userId=1
```

### Test Admin Endpoints
```bash
# Get all conversations
curl http://localhost:4000/api/admin/all-conversations?passcode=2110

# Get system stats
curl http://localhost:4000/api/admin/sync-stats?passcode=2110
```

## Environment Variables

Required:
```env
DATABASE_URL=postgresql://user:password@host:port/database
```

## Migration

To create the tables:

```typescript
import { ensureSyncTablesExist } from '@/lib/sync-db'

await ensureSyncTablesExist()
```

Tables are created automatically on first API call, but you can also run:

```bash
# Add to your migration script
node -e "require('./lib/sync-db').ensureSyncTablesExist()"
```

## Files Created

1. `/lib/sync-db.ts` - Database helper functions
2. `/lib/sync-types.ts` - TypeScript types and SyncClient helper
3. `/app/api/sync/signup/route.ts` - Signup endpoint
4. `/app/api/sync/login/route.ts` - Login endpoint
5. `/app/api/sync/conversation/route.ts` - Conversation sync endpoint
6. `/app/api/sync/conversations/route.ts` - Get user conversations endpoint
7. `/app/api/admin/all-conversations/route.ts` - Admin all conversations endpoint
8. `/app/api/admin/sync-stats/route.ts` - Admin system stats endpoint

## Next Steps

1. **Frontend Integration**: Use the SyncClient helper in your React components
2. **Auto-Sync**: Implement auto-sync on conversation updates
3. **Retry Logic**: Implement retry queue for failed syncs
4. **Admin Dashboard**: Build UI to view all conversations and stats
5. **Monitoring**: Add logging and monitoring for sync failures

## Support

For issues or questions, check:
- Server logs: Check Railway logs for errors
- Database: Verify DATABASE_URL is correct
- Network: Check CORS if calling from different domain
