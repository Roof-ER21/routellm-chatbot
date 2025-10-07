/**
 * Conversation Sync Database Helper
 *
 * Manages hybrid localStorage + PostgreSQL sync for Susan AI chatbot
 * Supports multi-device conversation synchronization
 */

import sql, { pool, query } from './railway-db'

// Types for conversation sync
export interface SyncUser {
  id: number
  name: string
  code: string
  display_name: string
  created_at: Date
  last_active: Date
}

export interface SyncConversation {
  id: string
  user_id: number
  title: string
  preview: string
  created_at: Date
  updated_at: Date
  message_count: number
  alert_count: number
}

export interface SyncMessage {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface SyncAlert {
  id: string
  conversation_id: string
  type: string
  severity: 'info' | 'warning' | 'critical'
  title: string
  message: string
  timestamp: Date
  flagged: boolean
}

/**
 * Ensure all conversation sync tables exist
 */
export async function ensureSyncTablesExist() {
  try {
    // Create sync_users table
    await sql`
      CREATE TABLE IF NOT EXISTS sync_users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        code VARCHAR(255) NOT NULL,
        display_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        last_active TIMESTAMP DEFAULT NOW()
      )
    `

    // Create sync_conversations table
    await sql`
      CREATE TABLE IF NOT EXISTS sync_conversations (
        id VARCHAR(255) PRIMARY KEY,
        user_id INTEGER REFERENCES sync_users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        preview TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Create sync_messages table
    await sql`
      CREATE TABLE IF NOT EXISTS sync_messages (
        id VARCHAR(255) PRIMARY KEY,
        conversation_id VARCHAR(255) REFERENCES sync_conversations(id) ON DELETE CASCADE,
        role VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT NOW()
      )
    `

    // Create sync_alerts table
    await sql`
      CREATE TABLE IF NOT EXISTS sync_alerts (
        id VARCHAR(255) PRIMARY KEY,
        conversation_id VARCHAR(255) REFERENCES sync_conversations(id) ON DELETE CASCADE,
        type VARCHAR(100) NOT NULL,
        severity VARCHAR(20) NOT NULL DEFAULT 'info',
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT NOW(),
        flagged BOOLEAN DEFAULT false
      )
    `

    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_sync_conversations_user ON sync_conversations(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_sync_conversations_updated ON sync_conversations(updated_at DESC)`
    await sql`CREATE INDEX IF NOT EXISTS idx_sync_messages_conversation ON sync_messages(conversation_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_sync_messages_timestamp ON sync_messages(timestamp DESC)`
    await sql`CREATE INDEX IF NOT EXISTS idx_sync_alerts_conversation ON sync_alerts(conversation_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_sync_alerts_severity ON sync_alerts(severity)`
    await sql`CREATE INDEX IF NOT EXISTS idx_sync_alerts_flagged ON sync_alerts(flagged)`
    await sql`CREATE INDEX IF NOT EXISTS idx_sync_users_name_lower ON sync_users(LOWER(name))`

    console.log('Conversation sync tables ensured')
    return true
  } catch (error) {
    console.error('Error ensuring sync tables:', error)
    throw error
  }
}

/**
 * Create a new user account
 */
export async function createSyncUser(name: string, code: string, displayName: string): Promise<SyncUser | null> {
  try {
    // Check if user already exists (case-insensitive)
    const existing = await sql`
      SELECT * FROM sync_users
      WHERE LOWER(name) = LOWER(${name})
    `

    if (existing.rows.length > 0) {
      return null // User already exists
    }

    // Create new user
    const result = await sql`
      INSERT INTO sync_users (name, code, display_name, created_at, last_active)
      VALUES (${name}, ${code}, ${displayName}, NOW(), NOW())
      RETURNING *
    `

    return result.rows[0]
  } catch (error) {
    console.error('Error creating sync user:', error)
    throw error
  }
}

/**
 * Verify user credentials
 */
export async function verifySyncUser(name: string, code: string): Promise<SyncUser | null> {
  try {
    const result = await sql`
      SELECT * FROM sync_users
      WHERE LOWER(name) = LOWER(${name}) AND code = ${code}
    `

    if (result.rows.length === 0) {
      return null
    }

    // Update last_active
    const user = result.rows[0]
    await sql`
      UPDATE sync_users
      SET last_active = NOW()
      WHERE id = ${user.id}
    `

    return user
  } catch (error) {
    console.error('Error verifying sync user:', error)
    throw error
  }
}

/**
 * Upsert a conversation (update if exists, create if new)
 */
export async function upsertConversation(
  userId: number,
  conversationId: string,
  title: string,
  preview: string,
  createdAt?: Date
): Promise<string> {
  try {
    const created = createdAt || new Date()

    // Check if conversation exists
    const existing = await sql`
      SELECT id FROM sync_conversations WHERE id = ${conversationId}
    `

    if (existing.rows.length > 0) {
      // Update existing conversation
      await sql`
        UPDATE sync_conversations
        SET title = ${title},
            preview = ${preview},
            updated_at = NOW()
        WHERE id = ${conversationId}
      `
    } else {
      // Create new conversation
      await sql`
        INSERT INTO sync_conversations (id, user_id, title, preview, created_at, updated_at)
        VALUES (${conversationId}, ${userId}, ${title}, ${preview}, ${created.toISOString()}, NOW())
      `
    }

    return conversationId
  } catch (error) {
    console.error('Error upserting conversation:', error)
    throw error
  }
}

/**
 * Upsert messages for a conversation
 */
export async function upsertMessages(
  conversationId: string,
  messages: Array<{ id: string; role: string; content: string; timestamp: Date }>
): Promise<void> {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    // Delete existing messages for this conversation
    await client.query('DELETE FROM sync_messages WHERE conversation_id = $1', [conversationId])

    // Batch insert new messages
    if (messages.length > 0) {
      const values: string[] = []
      const params: any[] = []
      let paramIndex = 1

      for (const msg of messages) {
        values.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4})`)
        params.push(msg.id, conversationId, msg.role, msg.content, msg.timestamp.toISOString())
        paramIndex += 5
      }

      const insertQuery = `
        INSERT INTO sync_messages (id, conversation_id, role, content, timestamp)
        VALUES ${values.join(', ')}
      `
      await client.query(insertQuery, params)
    }

    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error upserting messages:', error)
    throw error
  } finally {
    client.release()
  }
}

/**
 * Upsert alerts for a conversation
 */
export async function upsertAlerts(
  conversationId: string,
  alerts: Array<{ id: string; type: string; severity: string; title: string; message: string; timestamp: Date; flagged: boolean }>
): Promise<void> {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    // Delete existing alerts for this conversation
    await client.query('DELETE FROM sync_alerts WHERE conversation_id = $1', [conversationId])

    // Batch insert new alerts
    if (alerts.length > 0) {
      const values: string[] = []
      const params: any[] = []
      let paramIndex = 1

      for (const alert of alerts) {
        values.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6}, $${paramIndex + 7})`)
        params.push(
          alert.id,
          conversationId,
          alert.type,
          alert.severity,
          alert.title,
          alert.message,
          alert.timestamp.toISOString(),
          alert.flagged
        )
        paramIndex += 8
      }

      const insertQuery = `
        INSERT INTO sync_alerts (id, conversation_id, type, severity, title, message, timestamp, flagged)
        VALUES ${values.join(', ')}
      `
      await client.query(insertQuery, params)
    }

    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error upserting alerts:', error)
    throw error
  } finally {
    client.release()
  }
}

/**
 * Get all conversations for a user
 */
export async function getUserConversations(userId: number): Promise<any[]> {
  try {
    const result = await query(`
      SELECT
        c.*,
        COUNT(DISTINCT m.id) as message_count,
        COUNT(DISTINCT a.id) as alert_count
      FROM sync_conversations c
      LEFT JOIN sync_messages m ON c.id = m.conversation_id
      LEFT JOIN sync_alerts a ON c.id = a.conversation_id
      WHERE c.user_id = $1
      GROUP BY c.id
      ORDER BY c.updated_at DESC
    `, [userId])

    return result.rows
  } catch (error) {
    console.error('Error getting user conversations:', error)
    throw error
  }
}

/**
 * Get all conversations (admin only)
 */
export async function getAllConversations(filters?: { flagged?: boolean; severity?: string }): Promise<any[]> {
  try {
    let queryText = `
      SELECT
        c.*,
        u.display_name,
        u.name as user_name,
        COUNT(DISTINCT m.id) as message_count,
        COUNT(DISTINCT a.id) as alert_count,
        COUNT(DISTINCT a.id) FILTER (WHERE a.flagged = true) as flagged_alert_count,
        COUNT(DISTINCT a.id) FILTER (WHERE a.severity = 'critical') as critical_alert_count
      FROM sync_conversations c
      INNER JOIN sync_users u ON c.user_id = u.id
      LEFT JOIN sync_messages m ON c.id = m.conversation_id
      LEFT JOIN sync_alerts a ON c.id = a.conversation_id
    `
    const params: any[] = []
    const whereClauses: string[] = []

    if (filters?.flagged) {
      whereClauses.push('EXISTS (SELECT 1 FROM sync_alerts WHERE conversation_id = c.id AND flagged = true)')
    }

    if (filters?.severity) {
      whereClauses.push(`EXISTS (SELECT 1 FROM sync_alerts WHERE conversation_id = c.id AND severity = $${params.length + 1})`)
      params.push(filters.severity)
    }

    if (whereClauses.length > 0) {
      queryText += ' WHERE ' + whereClauses.join(' AND ')
    }

    queryText += `
      GROUP BY c.id, u.display_name, u.name
      ORDER BY c.updated_at DESC
      LIMIT 1000
    `

    const result = await query(queryText, params)
    return result.rows
  } catch (error) {
    console.error('Error getting all conversations:', error)
    throw error
  }
}

/**
 * Get system statistics (admin only)
 */
export async function getSystemStats(): Promise<any> {
  try {
    // Get overall stats
    const statsResult = await sql`
      SELECT
        (SELECT COUNT(*) FROM sync_users) as total_users,
        (SELECT COUNT(*) FROM sync_conversations) as total_conversations,
        (SELECT COUNT(*) FROM sync_messages) as total_messages,
        (SELECT COUNT(*) FROM sync_alerts) as total_alerts,
        (SELECT COUNT(*) FROM sync_alerts WHERE severity = 'critical') as critical_alerts,
        (SELECT COUNT(*) FROM sync_alerts WHERE severity = 'high') as high_alerts,
        (SELECT COUNT(*) FROM sync_alerts WHERE flagged = true) as flagged_alerts
    `

    // Get per-user stats
    const userStatsResult = await query(`
      SELECT
        u.id,
        u.name,
        u.display_name,
        u.last_active,
        COUNT(DISTINCT c.id) as conversation_count,
        COUNT(DISTINCT m.id) as message_count,
        COUNT(DISTINCT a.id) as alert_count,
        COUNT(DISTINCT a.id) FILTER (WHERE a.severity = 'critical') as critical_alert_count
      FROM sync_users u
      LEFT JOIN sync_conversations c ON u.id = c.user_id
      LEFT JOIN sync_messages m ON c.id = m.conversation_id
      LEFT JOIN sync_alerts a ON c.id = a.conversation_id
      GROUP BY u.id, u.name, u.display_name, u.last_active
      ORDER BY u.last_active DESC
    `)

    return {
      ...statsResult.rows[0],
      user_stats: userStatsResult.rows
    }
  } catch (error) {
    console.error('Error getting system stats:', error)
    throw error
  }
}

/**
 * Get conversation with all messages and alerts
 */
export async function getFullConversation(conversationId: string): Promise<any> {
  try {
    const conversationResult = await sql`
      SELECT c.*, u.display_name, u.name as user_name
      FROM sync_conversations c
      INNER JOIN sync_users u ON c.user_id = u.id
      WHERE c.id = ${conversationId}
    `

    if (conversationResult.rows.length === 0) {
      return null
    }

    const messagesResult = await sql`
      SELECT * FROM sync_messages
      WHERE conversation_id = ${conversationId}
      ORDER BY timestamp ASC
    `

    const alertsResult = await sql`
      SELECT * FROM sync_alerts
      WHERE conversation_id = ${conversationId}
      ORDER BY timestamp DESC
    `

    return {
      ...conversationResult.rows[0],
      messages: messagesResult.rows,
      alerts: alertsResult.rows
    }
  } catch (error) {
    console.error('Error getting full conversation:', error)
    throw error
  }
}
