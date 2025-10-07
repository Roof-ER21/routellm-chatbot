/**
 * ============================================================================
 * Susan AI Roofing Assistant - Database Integration Examples
 * Production-ready Node.js integration with PostgreSQL
 * ============================================================================
 */

const { Pool } = require('pg');

// ============================================================================
// Database Connection Pool Setup
// ============================================================================

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
});

// Error handling
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// ============================================================================
// User Authentication & Management
// ============================================================================

/**
 * Authenticate user with name and PIN
 * @param {string} name - Username (case-insensitive)
 * @param {string} code - 4-digit PIN
 * @returns {Object|null} User object or null if not found
 */
async function authenticateUser(name, code) {
  const query = `
    SELECT id, display_name, remember_me, last_active
    FROM users
    WHERE LOWER(name) = LOWER($1) AND code = $2
  `;

  try {
    const result = await pool.query(query, [name, code]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
}

/**
 * Create new user account
 * @param {string} name - Username
 * @param {string} displayName - Display name (original case)
 * @param {string} code - 4-digit PIN
 * @returns {Object} Created user object
 */
async function createUser(name, displayName, code) {
  const query = `
    INSERT INTO users (name, display_name, code)
    VALUES (LOWER($1), $2, $3)
    RETURNING id, display_name, created_at
  `;

  try {
    const result = await pool.query(query, [name, displayName, code]);
    return result.rows[0];
  } catch (error) {
    if (error.code === '23505') { // Unique constraint violation
      throw new Error('Username already exists');
    }
    console.error('Create user error:', error);
    throw error;
  }
}

/**
 * Update user's remember me setting
 * @param {string} userId - User UUID
 * @param {boolean} rememberMe - Remember me setting
 */
async function updateRememberMe(userId, rememberMe) {
  const query = `
    UPDATE users
    SET remember_me = $2, last_active = CURRENT_TIMESTAMP
    WHERE id = $1
  `;

  try {
    await pool.query(query, [userId, rememberMe]);
  } catch (error) {
    console.error('Update remember me error:', error);
    throw error;
  }
}

/**
 * Get all users with statistics (Admin)
 * @returns {Array} List of users with conversation counts
 */
async function getAllUsers() {
  const query = `
    SELECT
      u.id,
      u.display_name,
      u.created_at,
      u.last_active,
      COUNT(DISTINCT c.id) as conversation_count,
      COUNT(DISTINCT CASE WHEN c.is_flagged THEN c.id END) as flagged_count
    FROM users u
    LEFT JOIN conversations c ON u.id = c.user_id
    GROUP BY u.id
    ORDER BY u.last_active DESC
  `;

  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('Get all users error:', error);
    throw error;
  }
}

// ============================================================================
// Conversation Management
// ============================================================================

/**
 * Get user's conversations
 * @param {string} userId - User UUID
 * @param {number} limit - Number of conversations to return (default: 50)
 * @returns {Array} List of conversations
 */
async function getUserConversations(userId, limit = 50) {
  const query = `
    SELECT
      id,
      title,
      preview,
      created_at,
      updated_at,
      message_count,
      is_flagged,
      highest_severity
    FROM conversations
    WHERE user_id = $1
    ORDER BY updated_at DESC
    LIMIT $2
  `;

  try {
    const result = await pool.query(query, [userId, limit]);
    return result.rows;
  } catch (error) {
    console.error('Get user conversations error:', error);
    throw error;
  }
}

/**
 * Create new conversation
 * @param {string} userId - User UUID
 * @param {string} firstMessage - First user message
 * @returns {Object} Created conversation object
 */
async function createConversation(userId, firstMessage) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Extract title and preview from first message
    const title = firstMessage.substring(0, 50);
    const preview = firstMessage.substring(0, 100);

    // Create conversation
    const convQuery = `
      INSERT INTO conversations (user_id, title, preview)
      VALUES ($1, $2, $3)
      RETURNING id, created_at
    `;
    const convResult = await client.query(convQuery, [userId, title, preview]);
    const conversation = convResult.rows[0];

    // Add first message
    const msgQuery = `
      INSERT INTO messages (conversation_id, role, content, message_index)
      VALUES ($1, 'user', $2, 0)
      RETURNING id
    `;
    await client.query(msgQuery, [conversation.id, firstMessage]);

    await client.query('COMMIT');
    return conversation;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create conversation error:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get conversation details
 * @param {string} conversationId - Conversation UUID
 * @returns {Object} Conversation details
 */
async function getConversation(conversationId) {
  const query = `
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
    WHERE c.id = $1
  `;

  try {
    const result = await pool.query(query, [conversationId]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Get conversation error:', error);
    throw error;
  }
}

/**
 * Get all flagged conversations (Admin)
 * @param {string} severityFilter - Optional severity filter ('critical', 'high', etc.)
 * @param {number} limit - Number of conversations to return
 * @returns {Array} List of flagged conversations
 */
async function getFlaggedConversations(severityFilter = null, limit = 100) {
  const query = `
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
      STRING_AGG(DISTINCT ta.category, ', ' ORDER BY ta.category) as threat_categories
    FROM conversations c
    JOIN users u ON c.user_id = u.id
    LEFT JOIN threat_alerts ta ON c.id = ta.conversation_id
    WHERE c.is_flagged = TRUE
      AND ($1::severity_level IS NULL OR c.highest_severity = $1::severity_level)
    GROUP BY c.id, u.display_name
    ORDER BY c.highest_severity DESC, c.updated_at DESC
    LIMIT $2
  `;

  try {
    const result = await pool.query(query, [severityFilter, limit]);
    return result.rows;
  } catch (error) {
    console.error('Get flagged conversations error:', error);
    throw error;
  }
}

// ============================================================================
// Message Management
// ============================================================================

/**
 * Get messages for conversation
 * @param {string} conversationId - Conversation UUID
 * @returns {Array} List of messages in order
 */
async function getMessages(conversationId) {
  const query = `
    SELECT
      id,
      role,
      content,
      created_at,
      message_index
    FROM messages
    WHERE conversation_id = $1
    ORDER BY message_index ASC
  `;

  try {
    const result = await pool.query(query, [conversationId]);
    return result.rows;
  } catch (error) {
    console.error('Get messages error:', error);
    throw error;
  }
}

/**
 * Add message to conversation
 * @param {string} conversationId - Conversation UUID
 * @param {string} role - Message role ('user' or 'assistant')
 * @param {string} content - Message content
 * @returns {Object} Created message object
 */
async function addMessage(conversationId, role, content) {
  const query = `
    INSERT INTO messages (conversation_id, role, content, message_index)
    VALUES (
      $1,
      $2::message_role,
      $3,
      (SELECT COALESCE(MAX(message_index) + 1, 0)
       FROM messages WHERE conversation_id = $1)
    )
    RETURNING id, created_at, message_index
  `;

  try {
    const result = await pool.query(query, [conversationId, role, content]);
    return result.rows[0];
  } catch (error) {
    console.error('Add message error:', error);
    throw error;
  }
}

/**
 * Get conversation with all messages
 * @param {string} conversationId - Conversation UUID
 * @returns {Object} Conversation with messages array
 */
async function getConversationWithMessages(conversationId) {
  try {
    const conversation = await getConversation(conversationId);
    if (!conversation) {
      return null;
    }

    const messages = await getMessages(conversationId);
    return {
      ...conversation,
      messages
    };
  } catch (error) {
    console.error('Get conversation with messages error:', error);
    throw error;
  }
}

// ============================================================================
// Threat Alert Management
// ============================================================================

/**
 * Create threat alert
 * @param {Object} alert - Alert object
 * @returns {Object} Created alert
 */
async function createThreatAlert(alert) {
  const {
    conversationId,
    messageId,
    pattern,
    category,
    severity,
    riskScore,
    highlightedText
  } = alert;

  const query = `
    INSERT INTO threat_alerts (
      conversation_id,
      message_id,
      pattern,
      category,
      severity,
      risk_score,
      highlighted_text
    )
    VALUES ($1, $2, $3, $4, $5::severity_level, $6, $7)
    RETURNING id, detected_at
  `;

  try {
    const result = await pool.query(query, [
      conversationId,
      messageId,
      pattern,
      category,
      severity,
      riskScore,
      highlightedText
    ]);
    return result.rows[0];
  } catch (error) {
    console.error('Create threat alert error:', error);
    throw error;
  }
}

/**
 * Get alerts for conversation
 * @param {string} conversationId - Conversation UUID
 * @returns {Array} List of alerts
 */
async function getConversationAlerts(conversationId) {
  const query = `
    SELECT
      ta.id,
      ta.message_id,
      ta.pattern,
      ta.category,
      ta.severity,
      ta.risk_score,
      ta.highlighted_text,
      ta.detected_at,
      m.content as message_content
    FROM threat_alerts ta
    JOIN messages m ON ta.message_id = m.id
    WHERE ta.conversation_id = $1
    ORDER BY ta.detected_at DESC
  `;

  try {
    const result = await pool.query(query, [conversationId]);
    return result.rows;
  } catch (error) {
    console.error('Get conversation alerts error:', error);
    throw error;
  }
}

/**
 * Get recent critical/high alerts (Admin dashboard)
 * @param {number} hours - Hours to look back (default: 24)
 * @param {number} limit - Number of alerts to return
 * @returns {Array} List of alerts
 */
async function getRecentHighPriorityAlerts(hours = 24, limit = 50) {
  const query = `
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
      AND ta.detected_at > CURRENT_TIMESTAMP - INTERVAL '${hours} hours'
    ORDER BY ta.severity DESC, ta.detected_at DESC
    LIMIT $1
  `;

  try {
    const result = await pool.query(query, [limit]);
    return result.rows;
  } catch (error) {
    console.error('Get recent high priority alerts error:', error);
    throw error;
  }
}

/**
 * Get alert statistics by category
 * @returns {Array} Alert statistics
 */
async function getAlertStatistics() {
  const query = `
    SELECT
      category,
      COUNT(*) as total_alerts,
      COUNT(DISTINCT conversation_id) as affected_conversations,
      AVG(risk_score)::int as avg_risk_score,
      MAX(risk_score) as max_risk_score,
      COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical_count,
      COUNT(CASE WHEN severity = 'high' THEN 1 END) as high_count,
      COUNT(CASE WHEN severity = 'medium' THEN 1 END) as medium_count,
      COUNT(CASE WHEN severity = 'low' THEN 1 END) as low_count
    FROM threat_alerts
    GROUP BY category
    ORDER BY total_alerts DESC
  `;

  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('Get alert statistics error:', error);
    throw error;
  }
}

// ============================================================================
// Analytics & Reporting
// ============================================================================

/**
 * Get user activity summary
 * @returns {Array} User activity statistics
 */
async function getUserActivitySummary() {
  const query = `
    SELECT
      u.id,
      u.display_name,
      u.created_at,
      u.last_active,
      COUNT(DISTINCT c.id) as total_conversations,
      COUNT(DISTINCT m.id) as total_messages,
      COUNT(DISTINCT CASE WHEN c.is_flagged THEN c.id END) as flagged_conversations,
      COUNT(DISTINCT ta.id) as total_alerts,
      MAX(ta.severity) as highest_severity_detected
    FROM users u
    LEFT JOIN conversations c ON u.id = c.user_id
    LEFT JOIN messages m ON c.id = m.conversation_id
    LEFT JOIN threat_alerts ta ON c.id = ta.conversation_id
    GROUP BY u.id
    ORDER BY total_alerts DESC NULLS LAST
  `;

  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('Get user activity summary error:', error);
    throw error;
  }
}

/**
 * Get daily threat statistics for last N days
 * @param {number} days - Number of days to look back
 * @returns {Array} Daily statistics
 */
async function getDailyThreatStatistics(days = 30) {
  const query = `
    SELECT
      DATE(detected_at) as date,
      COUNT(*) as total_alerts,
      COUNT(DISTINCT conversation_id) as conversations_affected,
      COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical_alerts,
      COUNT(CASE WHEN severity = 'high' THEN 1 END) as high_alerts,
      AVG(risk_score)::int as avg_risk_score
    FROM threat_alerts
    WHERE detected_at > CURRENT_TIMESTAMP - INTERVAL '${days} days'
    GROUP BY DATE(detected_at)
    ORDER BY date DESC
  `;

  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('Get daily threat statistics error:', error);
    throw error;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Close database connection pool (for graceful shutdown)
 */
async function closePool() {
  await pool.end();
}

/**
 * Test database connection
 * @returns {boolean} Connection status
 */
async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('Database connection successful:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// ============================================================================
// Exports
// ============================================================================

module.exports = {
  pool,

  // User functions
  authenticateUser,
  createUser,
  updateRememberMe,
  getAllUsers,

  // Conversation functions
  getUserConversations,
  createConversation,
  getConversation,
  getFlaggedConversations,

  // Message functions
  getMessages,
  addMessage,
  getConversationWithMessages,

  // Threat alert functions
  createThreatAlert,
  getConversationAlerts,
  getRecentHighPriorityAlerts,
  getAlertStatistics,

  // Analytics functions
  getUserActivitySummary,
  getDailyThreatStatistics,

  // Utility functions
  closePool,
  testConnection
};

// ============================================================================
// Example Usage
// ============================================================================

/*

// Example 1: User Authentication
const user = await authenticateUser('john.smith', '1234');
if (user) {
  console.log('Logged in:', user.display_name);
}

// Example 2: Create Conversation
const conversation = await createConversation(
  userId,
  'How do I schedule a roof inspection?'
);

// Example 3: Add Messages
await addMessage(conversation.id, 'user', 'I need help with my roof');
await addMessage(conversation.id, 'assistant', 'I would be happy to help!');

// Example 4: Create Threat Alert
await createThreatAlert({
  conversationId: conversation.id,
  messageId: messageId,
  pattern: 'export.*customer.*data',
  category: 'Data Theft',
  severity: 'high',
  riskScore: 85,
  highlightedText: 'export all customer data'
});

// Example 5: Get Flagged Conversations
const flagged = await getFlaggedConversations('critical', 20);

// Example 6: Get Analytics
const stats = await getAlertStatistics();
const dailyStats = await getDailyThreatStatistics(30);

// Graceful shutdown
process.on('SIGTERM', async () => {
  await closePool();
  process.exit(0);
});

*/
