-- ============================================================================
-- Susan AI Roofing Assistant - PostgreSQL Database Schema
-- Production-ready schema optimized for Railway deployment
-- ============================================================================

-- Enable UUID extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Message role enumeration
CREATE TYPE message_role AS ENUM ('user', 'assistant');

-- Threat severity levels
CREATE TYPE severity_level AS ENUM ('critical', 'high', 'medium', 'low');

-- ============================================================================
-- TABLES
-- ============================================================================

-- Users table: Stores user accounts with PIN-based authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    code CHAR(4) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    remember_me BOOLEAN NOT NULL DEFAULT FALSE,

    -- Constraints
    CONSTRAINT users_name_unique UNIQUE (name),
    CONSTRAINT users_code_check CHECK (code ~ '^\d{4}$')
);

-- Create index for fast login lookups (case-insensitive)
CREATE INDEX idx_users_name_lower ON users (LOWER(name));
CREATE INDEX idx_users_last_active ON users (last_active DESC);

-- Add comment for documentation
COMMENT ON TABLE users IS 'User accounts with PIN-based authentication';
COMMENT ON COLUMN users.name IS 'Lowercase username for login lookups';
COMMENT ON COLUMN users.display_name IS 'Original case username for display';
COMMENT ON COLUMN users.code IS '4-digit PIN for authentication';

-- ============================================================================

-- Conversations table: Stores conversation metadata
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    title VARCHAR(100) NOT NULL,
    preview VARCHAR(200) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_flagged BOOLEAN NOT NULL DEFAULT FALSE,
    highest_severity severity_level,
    message_count INTEGER NOT NULL DEFAULT 0,

    -- Foreign keys
    CONSTRAINT fk_conversations_user_id
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    -- Constraints
    CONSTRAINT conversations_message_count_check CHECK (message_count >= 0)
);

-- Indexes for efficient querying
CREATE INDEX idx_conversations_user_id ON conversations (user_id);
CREATE INDEX idx_conversations_created_at ON conversations (created_at DESC);
CREATE INDEX idx_conversations_updated_at ON conversations (updated_at DESC);
CREATE INDEX idx_conversations_is_flagged ON conversations (is_flagged) WHERE is_flagged = TRUE;
CREATE INDEX idx_conversations_highest_severity ON conversations (highest_severity) WHERE highest_severity IS NOT NULL;

-- Composite index for admin dashboard queries
CREATE INDEX idx_conversations_flagged_severity ON conversations (is_flagged, highest_severity, updated_at DESC);

-- Composite index for user conversation retrieval
CREATE INDEX idx_conversations_user_updated ON conversations (user_id, updated_at DESC);

COMMENT ON TABLE conversations IS 'Conversation metadata and threat summaries';
COMMENT ON COLUMN conversations.title IS 'First 50 characters of first user message';
COMMENT ON COLUMN conversations.preview IS 'First 100 characters of first user message';
COMMENT ON COLUMN conversations.highest_severity IS 'Most severe threat detected in conversation';

-- ============================================================================

-- Messages table: Stores individual messages in conversations
CREATE TABLE messages (
    id BIGSERIAL PRIMARY KEY,
    conversation_id UUID NOT NULL,
    role message_role NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    message_index INTEGER NOT NULL,

    -- Foreign keys
    CONSTRAINT fk_messages_conversation_id
        FOREIGN KEY (conversation_id)
        REFERENCES conversations(id)
        ON DELETE CASCADE,

    -- Constraints
    CONSTRAINT messages_message_index_check CHECK (message_index >= 0),
    CONSTRAINT messages_unique_index UNIQUE (conversation_id, message_index)
);

-- Indexes for efficient message retrieval
CREATE INDEX idx_messages_conversation_id ON messages (conversation_id, message_index);
CREATE INDEX idx_messages_created_at ON messages (created_at DESC);
CREATE INDEX idx_messages_role ON messages (role);

COMMENT ON TABLE messages IS 'Individual messages in conversations';
COMMENT ON COLUMN messages.message_index IS 'Sequential order of message in conversation (0-based)';

-- ============================================================================

-- Threat alerts table: Stores detected suspicious patterns
CREATE TABLE threat_alerts (
    id BIGSERIAL PRIMARY KEY,
    conversation_id UUID NOT NULL,
    message_id BIGINT NOT NULL,
    pattern VARCHAR(500) NOT NULL,
    category VARCHAR(100) NOT NULL,
    severity severity_level NOT NULL,
    risk_score INTEGER NOT NULL,
    highlighted_text TEXT NOT NULL,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign keys
    CONSTRAINT fk_threat_alerts_conversation_id
        FOREIGN KEY (conversation_id)
        REFERENCES conversations(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_threat_alerts_message_id
        FOREIGN KEY (message_id)
        REFERENCES messages(id)
        ON DELETE CASCADE,

    -- Constraints
    CONSTRAINT threat_alerts_risk_score_check CHECK (risk_score >= 0 AND risk_score <= 100),
    CONSTRAINT threat_alerts_category_check CHECK (
        category IN (
            'Business Planning',
            'Data Theft',
            'Financial Fraud',
            'Exit Planning',
            'General Suspicious'
        )
    )
);

-- Indexes for efficient threat queries
CREATE INDEX idx_threat_alerts_conversation_id ON threat_alerts (conversation_id);
CREATE INDEX idx_threat_alerts_message_id ON threat_alerts (message_id);
CREATE INDEX idx_threat_alerts_severity ON threat_alerts (severity);
CREATE INDEX idx_threat_alerts_detected_at ON threat_alerts (detected_at DESC);
CREATE INDEX idx_threat_alerts_category ON threat_alerts (category);
CREATE INDEX idx_threat_alerts_risk_score ON threat_alerts (risk_score DESC);

-- Composite index for admin alert filtering
CREATE INDEX idx_threat_alerts_severity_detected ON threat_alerts (severity, detected_at DESC);

-- Composite index for conversation threat analysis
CREATE INDEX idx_threat_alerts_conv_severity ON threat_alerts (conversation_id, severity, detected_at DESC);

COMMENT ON TABLE threat_alerts IS 'Detected suspicious patterns and threat indicators';
COMMENT ON COLUMN threat_alerts.pattern IS 'Regex or pattern that matched';
COMMENT ON COLUMN threat_alerts.risk_score IS 'Risk score from 0-100';
COMMENT ON COLUMN threat_alerts.highlighted_text IS 'Specific suspicious phrase detected';

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Function to update conversation updated_at timestamp
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on messages insert
CREATE TRIGGER trg_messages_update_conversation
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_timestamp();

-- Function to update conversation message count
CREATE OR REPLACE FUNCTION update_message_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE conversations
        SET message_count = message_count + 1
        WHERE id = NEW.conversation_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE conversations
        SET message_count = message_count - 1
        WHERE id = OLD.conversation_id;
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger for message count maintenance
CREATE TRIGGER trg_messages_update_count
    AFTER INSERT OR DELETE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_message_count();

-- Function to update conversation flagging and severity
CREATE OR REPLACE FUNCTION update_conversation_threat_status()
RETURNS TRIGGER AS $$
DECLARE
    max_severity severity_level;
BEGIN
    -- Get the highest severity for this conversation
    SELECT MAX(severity) INTO max_severity
    FROM threat_alerts
    WHERE conversation_id = NEW.conversation_id;

    -- Update conversation with flag and severity
    UPDATE conversations
    SET
        is_flagged = TRUE,
        highest_severity = max_severity
    WHERE id = NEW.conversation_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on threat alert insert
CREATE TRIGGER trg_threat_alerts_update_conversation
    AFTER INSERT ON threat_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_threat_status();

-- Function to update user last_active timestamp
CREATE OR REPLACE FUNCTION update_user_last_active()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users
    SET last_active = CURRENT_TIMESTAMP
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on conversation creation
CREATE TRIGGER trg_conversations_update_user_activity
    AFTER INSERT ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_user_last_active();

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View: Active conversations with threat summary
CREATE VIEW v_conversations_with_threats AS
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
    c.message_count,
    COUNT(DISTINCT ta.id) as alert_count,
    MAX(ta.risk_score) as max_risk_score
FROM conversations c
JOIN users u ON c.user_id = u.id
LEFT JOIN threat_alerts ta ON c.id = ta.conversation_id
GROUP BY c.id, u.display_name;

COMMENT ON VIEW v_conversations_with_threats IS 'Conversations with aggregated threat statistics';

-- View: Recent flagged conversations for admin dashboard
CREATE VIEW v_flagged_conversations AS
SELECT
    c.id,
    c.user_id,
    u.display_name,
    c.title,
    c.preview,
    c.created_at,
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
GROUP BY c.id, u.display_name
ORDER BY c.updated_at DESC;

COMMENT ON VIEW v_flagged_conversations IS 'Flagged conversations with detailed threat information';

-- View: User activity summary
CREATE VIEW v_user_activity AS
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
GROUP BY u.id;

COMMENT ON VIEW v_user_activity IS 'User activity and threat summary statistics';

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get or create user
CREATE OR REPLACE FUNCTION get_or_create_user(
    p_name VARCHAR,
    p_display_name VARCHAR,
    p_code CHAR(4)
)
RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Try to find existing user
    SELECT id INTO v_user_id
    FROM users
    WHERE LOWER(name) = LOWER(p_name);

    -- If not found, create new user
    IF v_user_id IS NULL THEN
        INSERT INTO users (name, display_name, code)
        VALUES (LOWER(p_name), p_display_name, p_code)
        RETURNING id INTO v_user_id;
    END IF;

    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to authenticate user
CREATE OR REPLACE FUNCTION authenticate_user(
    p_name VARCHAR,
    p_code CHAR(4)
)
RETURNS TABLE (
    user_id UUID,
    display_name VARCHAR,
    remember_me BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.display_name, u.remember_me
    FROM users u
    WHERE LOWER(u.name) = LOWER(p_name)
    AND u.code = p_code;
END;
$$ LANGUAGE plpgsql;

-- Function to get conversation with messages
CREATE OR REPLACE FUNCTION get_conversation_with_messages(
    p_conversation_id UUID
)
RETURNS TABLE (
    message_id BIGINT,
    role message_role,
    content TEXT,
    created_at TIMESTAMPTZ,
    message_index INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT m.id, m.role, m.content, m.created_at, m.message_index
    FROM messages m
    WHERE m.conversation_id = p_conversation_id
    ORDER BY m.message_index ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to get conversation threat alerts
CREATE OR REPLACE FUNCTION get_conversation_alerts(
    p_conversation_id UUID
)
RETURNS TABLE (
    alert_id BIGINT,
    message_id BIGINT,
    pattern VARCHAR,
    category VARCHAR,
    severity severity_level,
    risk_score INTEGER,
    highlighted_text TEXT,
    detected_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ta.id,
        ta.message_id,
        ta.pattern,
        ta.category,
        ta.severity,
        ta.risk_score,
        ta.highlighted_text,
        ta.detected_at
    FROM threat_alerts ta
    WHERE ta.conversation_id = p_conversation_id
    ORDER BY ta.detected_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PERFORMANCE OPTIMIZATION
-- ============================================================================

-- Analyze tables for query planner
ANALYZE users;
ANALYZE conversations;
ANALYZE messages;
ANALYZE threat_alerts;

-- Grant appropriate permissions (adjust as needed for your Railway setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_app_user;
