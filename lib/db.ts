// Use Railway PostgreSQL instead of Vercel
import sql from './railway-db'

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

    // Add missing columns if they don't exist (for existing deployments)
    try {
      await sql`ALTER TABLE reps ADD COLUMN IF NOT EXISTS last_active TIMESTAMP DEFAULT NOW()`
    } catch (e) {
      // Column might already exist, ignore error
    }

    try {
      await sql`ALTER TABLE reps ADD COLUMN IF NOT EXISTS total_chats INTEGER DEFAULT 0`
    } catch (e) {
      // Column might already exist, ignore error
    }

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

    // Add missing columns to chat_sessions if they don't exist (for existing deployments)
    try {
      await sql`ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS rep_name VARCHAR(255)`
    } catch (e) {
      // Column might already exist, ignore error
    }

    try {
      await sql`ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS message_count INTEGER DEFAULT 0`
    } catch (e) {
      // Column might already exist, ignore error
    }

    try {
      await sql`ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP DEFAULT NOW()`
    } catch (e) {
      // Column might already exist, ignore error
    }

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

    // Create sent_emails table
    await sql`
      CREATE TABLE IF NOT EXISTS sent_emails (
        id SERIAL PRIMARY KEY,
        session_id INTEGER REFERENCES chat_sessions(id),
        rep_name VARCHAR(255) NOT NULL,
        to_email TEXT NOT NULL,
        from_email TEXT NOT NULL,
        subject TEXT NOT NULL,
        body TEXT NOT NULL,
        html_body TEXT,
        template_used TEXT,
        attachments JSONB,
        delivery_status TEXT DEFAULT 'sent',
        resend_id TEXT,
        sent_at TIMESTAMP DEFAULT NOW(),
        delivered_at TIMESTAMP
      )
    `

    // Create threat_alerts table
    await sql`
      CREATE TABLE IF NOT EXISTS threat_alerts (
        id SERIAL PRIMARY KEY,
        session_id INTEGER REFERENCES chat_sessions(id),
        message_id INTEGER REFERENCES chat_messages(id),
        rep_name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        pattern VARCHAR(500) NOT NULL,
        severity VARCHAR(20) NOT NULL,
        risk_score INTEGER NOT NULL,
        matched_text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Create indexes for threat_alerts
    await sql`CREATE INDEX IF NOT EXISTS idx_threat_alerts_session ON threat_alerts(session_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_threat_alerts_severity ON threat_alerts(severity)`
    await sql`CREATE INDEX IF NOT EXISTS idx_threat_alerts_rep ON threat_alerts(rep_name)`
    await sql`CREATE INDEX IF NOT EXISTS idx_threat_alerts_created ON threat_alerts(created_at)`

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
    // Insert message and return the ID
    const result = await sql`
      INSERT INTO chat_messages (session_id, rep_id, rep_name, role, content, created_at)
      VALUES (${sessionId}, ${repId}, ${repName}, ${role}, ${content}, NOW())
      RETURNING id
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

    // Return the message ID
    return result.rows[0].id
  } catch (error) {
    console.error('Error logging chat message:', error)
    throw error
  }
}

export interface ThreatAlert {
  sessionId: number
  messageId: number
  repName: string
  category: string
  pattern: string
  severity: string
  riskScore: number
  matchedText: string
}

export async function logThreatAlert(alertData: ThreatAlert) {
  try {
    const result = await sql`
      INSERT INTO threat_alerts (
        session_id,
        message_id,
        rep_name,
        category,
        pattern,
        severity,
        risk_score,
        matched_text,
        created_at
      )
      VALUES (
        ${alertData.sessionId},
        ${alertData.messageId},
        ${alertData.repName},
        ${alertData.category},
        ${alertData.pattern},
        ${alertData.severity},
        ${alertData.riskScore},
        ${alertData.matchedText},
        NOW()
      )
      RETURNING *
    `
    return result.rows[0]
  } catch (error) {
    console.error('Error logging threat alert:', error)
    throw error
  }
}

export async function getThreatAlerts(sessionId?: number, limit = 100) {
  try {
    if (sessionId) {
      const result = await sql`
        SELECT * FROM threat_alerts
        WHERE session_id = ${sessionId}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `
      return result.rows
    } else {
      const result = await sql`
        SELECT * FROM threat_alerts
        ORDER BY created_at DESC
        LIMIT ${limit}
      `
      return result.rows
    }
  } catch (error) {
    console.error('Error getting threat alerts:', error)
    return []
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

// Email logging functions
export interface EmailLog {
  sessionId?: number
  repName: string
  toEmail: string
  fromEmail: string
  subject: string
  body: string
  htmlBody?: string
  templateUsed?: string
  attachments?: any[]
  resendId?: string
}

export async function logSentEmail(emailData: EmailLog) {
  try {
    const result = await sql`
      INSERT INTO sent_emails (
        session_id,
        rep_name,
        to_email,
        from_email,
        subject,
        body,
        html_body,
        template_used,
        attachments,
        resend_id,
        sent_at
      )
      VALUES (
        ${emailData.sessionId || null},
        ${emailData.repName},
        ${emailData.toEmail},
        ${emailData.fromEmail},
        ${emailData.subject},
        ${emailData.body},
        ${emailData.htmlBody || null},
        ${emailData.templateUsed || null},
        ${JSON.stringify(emailData.attachments || [])},
        ${emailData.resendId || null},
        NOW()
      )
      RETURNING *
    `
    return result.rows[0]
  } catch (error) {
    console.error('Error logging sent email:', error)
    throw error
  }
}

export async function updateEmailDeliveryStatus(
  emailId: number,
  status: string,
  deliveredAt?: Date
) {
  try {
    await sql`
      UPDATE sent_emails
      SET delivery_status = ${status},
          delivered_at = ${deliveredAt ? deliveredAt.toISOString() : null}
      WHERE id = ${emailId}
    `
  } catch (error) {
    console.error('Error updating email delivery status:', error)
    throw error
  }
}

export async function getEmailHistory(sessionId?: number, limit = 50) {
  try {
    if (sessionId) {
      const result = await sql`
        SELECT * FROM sent_emails
        WHERE session_id = ${sessionId}
        ORDER BY sent_at DESC
        LIMIT ${limit}
      `
      return result.rows
    } else {
      const result = await sql`
        SELECT * FROM sent_emails
        ORDER BY sent_at DESC
        LIMIT ${limit}
      `
      return result.rows
    }
  } catch (error) {
    console.error('Error getting email history:', error)
    return []
  }
}

export async function getEmailById(emailId: number) {
  try {
    const result = await sql`
      SELECT * FROM sent_emails
      WHERE id = ${emailId}
    `
    return result.rows[0] || null
  } catch (error) {
    console.error('Error getting email by ID:', error)
    return null
  }
}

// NOAA Weather Data Helper Functions
export async function ensureWeatherTablesExist() {
  try {
    // Create hail_events table
    await sql`
      CREATE TABLE IF NOT EXISTS hail_events (
        id SERIAL PRIMARY KEY,
        event_id TEXT UNIQUE NOT NULL,
        event_date DATE NOT NULL,
        state VARCHAR(2) NOT NULL,
        county VARCHAR(100),
        city VARCHAR(100),
        zip_code VARCHAR(10),
        latitude DECIMAL(10, 7),
        longitude DECIMAL(10, 7),
        hail_size DECIMAL(5, 2),
        magnitude VARCHAR(50),
        event_narrative TEXT,
        episode_narrative TEXT,
        begin_time TIMESTAMP,
        end_time TIMESTAMP,
        source VARCHAR(50) DEFAULT 'NOAA',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Create weather_sync_log table
    await sql`
      CREATE TABLE IF NOT EXISTS weather_sync_log (
        id SERIAL PRIMARY KEY,
        sync_date DATE NOT NULL,
        state VARCHAR(2) NOT NULL,
        events_added INTEGER DEFAULT 0,
        events_updated INTEGER DEFAULT 0,
        sync_status VARCHAR(20) DEFAULT 'pending',
        error_message TEXT,
        started_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP,
        UNIQUE(sync_date, state)
      )
    `

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_hail_date_state ON hail_events(event_date, state)`
    await sql`CREATE INDEX IF NOT EXISTS idx_hail_location ON hail_events(state, county, city)`
    await sql`CREATE INDEX IF NOT EXISTS idx_hail_zip ON hail_events(zip_code)`
    await sql`CREATE INDEX IF NOT EXISTS idx_hail_coordinates ON hail_events(latitude, longitude)`
    await sql`CREATE INDEX IF NOT EXISTS idx_hail_event_id ON hail_events(event_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_sync_log_date ON weather_sync_log(sync_date)`
    await sql`CREATE INDEX IF NOT EXISTS idx_sync_log_status ON weather_sync_log(sync_status)`

    console.log('Weather data tables ensured')
  } catch (error) {
    console.error('Error ensuring weather tables:', error)
  }
}

export async function getWeatherSyncStatus() {
  try {
    const result = await sql`
      SELECT
        state,
        sync_date,
        events_added,
        events_updated,
        sync_status,
        completed_at
      FROM weather_sync_log
      WHERE sync_date >= CURRENT_DATE - INTERVAL '7 days'
      ORDER BY sync_date DESC, state
    `
    return result.rows
  } catch (error) {
    console.error('Error getting weather sync status:', error)
    return []
  }
}

export async function getHailEventStats() {
  try {
    const result = await sql`
      SELECT
        state,
        COUNT(*) as total_events,
        MIN(event_date) as earliest_event,
        MAX(event_date) as latest_event,
        AVG(hail_size) as avg_hail_size,
        MAX(hail_size) as max_hail_size
      FROM hail_events
      GROUP BY state
      ORDER BY state
    `
    return result.rows
  } catch (error) {
    console.error('Error getting hail event stats:', error)
    return []
  }
}

// Storm data search by location
export async function searchStormsByLocation(params: {
  address?: string
  city?: string
  state?: string
  zipCode?: string
  latitude?: number
  longitude?: number
  radiusMiles?: number
  startYear?: number
  endYear?: number
}) {
  try {
    let query = `
      SELECT
        id,
        event_date,
        state,
        county,
        city,
        zip_code,
        latitude,
        longitude,
        hail_size,
        event_narrative,
        begin_time,
        end_time,
        source
      FROM hail_events
      WHERE 1=1
    `
    const values: any[] = []
    let paramCount = 1

    // Filter by state
    if (params.state) {
      query += ` AND state = $${paramCount}`
      values.push(params.state.toUpperCase())
      paramCount++
    }

    // Filter by city
    if (params.city) {
      query += ` AND LOWER(city) LIKE LOWER($${paramCount})`
      values.push(`%${params.city}%`)
      paramCount++
    }

    // Filter by zip code
    if (params.zipCode) {
      query += ` AND zip_code = $${paramCount}`
      values.push(params.zipCode)
      paramCount++
    }

    // Filter by year range
    if (params.startYear) {
      query += ` AND EXTRACT(YEAR FROM event_date) >= $${paramCount}`
      values.push(params.startYear)
      paramCount++
    }

    if (params.endYear) {
      query += ` AND EXTRACT(YEAR FROM event_date) <= $${paramCount}`
      values.push(params.endYear)
      paramCount++
    }

    // Filter by radius if coordinates provided
    if (params.latitude && params.longitude && params.radiusMiles) {
      query += ` AND (
        3959 * acos(
          cos(radians($${paramCount})) * cos(radians(latitude)) *
          cos(radians(longitude) - radians($${paramCount + 1})) +
          sin(radians($${paramCount})) * sin(radians(latitude))
        )
      ) <= $${paramCount + 2}`
      values.push(params.latitude, params.longitude, params.radiusMiles)
      paramCount += 3
    }

    query += ' ORDER BY event_date DESC LIMIT 100'

    const { query: dbQuery } = await import('./railway-db')
    const result = await dbQuery(query, values)
    return result.rows
  } catch (error) {
    console.error('Error searching storms by location:', error)
    return []
  }
}

// Get storm summary for location
export async function getStormSummary(params: {
  latitude: number
  longitude: number
  radiusMiles: number
  years?: number
}) {
  try {
    const yearsBack = params.years || 2
    const startDate = new Date()
    startDate.setFullYear(startDate.getFullYear() - yearsBack)

    const result = await sql`
      SELECT
        COUNT(*) as total_events,
        COUNT(*) FILTER (WHERE hail_size >= 1.0) as severe_hail_events,
        COUNT(*) FILTER (WHERE hail_size >= 2.0) as very_severe_hail_events,
        MAX(hail_size) as max_hail_size,
        AVG(hail_size) as avg_hail_size,
        MIN(event_date) as earliest_event,
        MAX(event_date) as most_recent_event,
        array_agg(DISTINCT EXTRACT(YEAR FROM event_date)::int ORDER BY EXTRACT(YEAR FROM event_date)::int DESC) as years_with_events
      FROM hail_events
      WHERE event_date >= ${startDate.toISOString().split('T')[0]}
        AND latitude IS NOT NULL
        AND longitude IS NOT NULL
        AND (
          3959 * acos(
            cos(radians(${params.latitude})) * cos(radians(latitude)) *
            cos(radians(longitude) - radians(${params.longitude})) +
            sin(radians(${params.latitude})) * sin(radians(latitude))
          )
        ) <= ${params.radiusMiles}
    `

    return result.rows[0] || null
  } catch (error) {
    console.error('Error getting storm summary:', error)
    return null
  }
}
