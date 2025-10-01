import { sql } from '@vercel/postgres'

export async function ensureTablesExist() {
  try {
    // Create reps table
    await sql`
      CREATE TABLE IF NOT EXISTS reps (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT NOW(),
        last_active TIMESTAMP DEFAULT NOW(),
        total_chats INTEGER DEFAULT 0
      )
    `

    // Create chat_sessions table
    await sql`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id SERIAL PRIMARY KEY,
        rep_id INTEGER REFERENCES reps(id),
        rep_name VARCHAR(255) NOT NULL,
        started_at TIMESTAMP DEFAULT NOW(),
        last_message_at TIMESTAMP DEFAULT NOW(),
        message_count INTEGER DEFAULT 0
      )
    `

    // Create chat_messages table
    await sql`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        session_id INTEGER REFERENCES chat_sessions(id),
        rep_id INTEGER REFERENCES reps(id),
        rep_name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `

    console.log('Database tables ensured')
  } catch (error) {
    console.error('Error ensuring tables:', error)
  }
}

export async function getOrCreateRep(name: string) {
  try {
    // Try to get existing rep
    const existing = await sql`
      SELECT * FROM reps WHERE name = ${name}
    `

    if (existing.rows.length > 0) {
      // Update last active
      await sql`
        UPDATE reps
        SET last_active = NOW()
        WHERE id = ${existing.rows[0].id}
      `
      return existing.rows[0]
    }

    // Create new rep
    const result = await sql`
      INSERT INTO reps (name, created_at, last_active, total_chats)
      VALUES (${name}, NOW(), NOW(), 0)
      RETURNING *
    `

    return result.rows[0]
  } catch (error) {
    console.error('Error getting/creating rep:', error)
    throw error
  }
}

export async function createChatSession(repId: number, repName: string) {
  try {
    const result = await sql`
      INSERT INTO chat_sessions (rep_id, rep_name, started_at, last_message_at, message_count)
      VALUES (${repId}, ${repName}, NOW(), NOW(), 0)
      RETURNING *
    `
    return result.rows[0]
  } catch (error) {
    console.error('Error creating chat session:', error)
    throw error
  }
}

export async function logChatMessage(
  sessionId: number,
  repId: number,
  repName: string,
  role: 'user' | 'assistant',
  content: string
) {
  try {
    // Insert message
    await sql`
      INSERT INTO chat_messages (session_id, rep_id, rep_name, role, content, created_at)
      VALUES (${sessionId}, ${repId}, ${repName}, ${role}, ${content}, NOW())
    `

    // Update session message count and last message time
    await sql`
      UPDATE chat_sessions
      SET message_count = message_count + 1,
          last_message_at = NOW()
      WHERE id = ${sessionId}
    `

    // Update rep total chats
    await sql`
      UPDATE reps
      SET total_chats = total_chats + 1,
          last_active = NOW()
      WHERE id = ${repId}
    `
  } catch (error) {
    console.error('Error logging chat message:', error)
    throw error
  }
}

export async function getTodaysChats() {
  try {
    const result = await sql`
      SELECT
        r.name as rep_name,
        COUNT(DISTINCT s.id) as session_count,
        COUNT(m.id) as message_count,
        MIN(m.created_at) as first_message,
        MAX(m.created_at) as last_message
      FROM reps r
      LEFT JOIN chat_sessions s ON r.id = s.rep_id
      LEFT JOIN chat_messages m ON s.id = m.session_id
      WHERE DATE(m.created_at) = CURRENT_DATE
      GROUP BY r.id, r.name
      ORDER BY message_count DESC
    `
    return result.rows
  } catch (error) {
    console.error('Error getting todays chats:', error)
    return []
  }
}

export async function getTodaysChatTranscripts() {
  try {
    const result = await sql`
      SELECT
        s.id as session_id,
        s.rep_name,
        s.started_at,
        json_agg(
          json_build_object(
            'role', m.role,
            'content', m.content,
            'timestamp', m.created_at
          ) ORDER BY m.created_at
        ) as messages
      FROM chat_sessions s
      JOIN chat_messages m ON s.id = m.session_id
      WHERE DATE(m.created_at) = CURRENT_DATE
      GROUP BY s.id, s.rep_name, s.started_at
      ORDER BY s.started_at
    `
    return result.rows
  } catch (error) {
    console.error('Error getting chat transcripts:', error)
    return []
  }
}

export async function getAllRepsStats() {
  try {
    const result = await sql`
      SELECT
        r.name,
        r.total_chats,
        r.last_active,
        COUNT(DISTINCT s.id) as total_sessions,
        COUNT(m.id) as total_messages
      FROM reps r
      LEFT JOIN chat_sessions s ON r.id = s.rep_id
      LEFT JOIN chat_messages m ON s.id = m.session_id
      GROUP BY r.id, r.name, r.total_chats, r.last_active
      ORDER BY r.total_chats DESC
    `
    return result.rows
  } catch (error) {
    console.error('Error getting reps stats:', error)
    return []
  }
}
