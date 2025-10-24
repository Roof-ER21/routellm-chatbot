-- ================================================
-- SUSAN AI ANALYTICS SYSTEM - DATABASE MIGRATION
-- ================================================
-- Purpose: Comprehensive usage tracking and analytics
-- Version: 1.0.0
-- Date: 2025-10-24
-- ================================================

-- ================================================
-- TABLE 1: ANALYTICS_EVENTS (Master Event Log)
-- ================================================
-- Tracks all user interactions and system events
-- ================================================

CREATE TABLE IF NOT EXISTS analytics_events (
  id SERIAL PRIMARY KEY,

  -- Event classification
  event_type VARCHAR(50) NOT NULL,
  event_category VARCHAR(50) NOT NULL,
  event_subcategory VARCHAR(50),

  -- User context
  rep_id INTEGER REFERENCES reps(id),
  rep_name VARCHAR(255) NOT NULL,
  session_id INTEGER REFERENCES chat_sessions(id),

  -- Event data (flexible JSON for different event types)
  event_data JSONB NOT NULL DEFAULT '{}',

  -- Metadata
  user_agent TEXT,
  ip_address VARCHAR(45),
  device_type VARCHAR(50),

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for analytics_events
CREATE INDEX IF NOT EXISTS idx_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_category ON analytics_events(event_category);
CREATE INDEX IF NOT EXISTS idx_events_rep ON analytics_events(rep_name);
CREATE INDEX IF NOT EXISTS idx_events_session ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_created ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_events_data_gin ON analytics_events USING gin(event_data);

-- ================================================
-- TABLE 2: EMAIL_GENERATION_ANALYTICS
-- ================================================
-- Enhanced tracking for email generation
-- ================================================

CREATE TABLE IF NOT EXISTS email_generation_analytics (
  id SERIAL PRIMARY KEY,

  -- Foreign keys
  rep_id INTEGER REFERENCES reps(id),
  rep_name VARCHAR(255) NOT NULL,
  session_id INTEGER REFERENCES chat_sessions(id),
  sent_email_id INTEGER REFERENCES sent_emails(id),

  -- Template information
  template_id VARCHAR(100),
  template_name VARCHAR(255),
  template_type VARCHAR(50), -- 'rep_sent' or 'customer_sent'
  recipient_type VARCHAR(50), -- 'insurance', 'homeowner', 'adjuster'

  -- Recommendation tracking
  was_recommended BOOLEAN DEFAULT FALSE,
  recommendation_confidence DECIMAL(5,2),
  user_accepted_recommendation BOOLEAN,

  -- Arguments used
  arguments_selected TEXT[], -- Array of argument IDs
  arguments_count INTEGER DEFAULT 0,

  -- Document context
  had_pdf_upload BOOLEAN DEFAULT FALSE,
  pdf_pages_analyzed INTEGER,
  document_analysis_summary TEXT,

  -- Generation details
  generation_time_ms INTEGER,
  character_count INTEGER,
  word_count INTEGER,

  -- Success metrics
  was_copied BOOLEAN DEFAULT FALSE,
  was_sent BOOLEAN DEFAULT FALSE,
  regeneration_count INTEGER DEFAULT 0,

  -- User feedback
  user_rating VARCHAR(20), -- 'positive', 'negative', 'neutral'
  user_feedback_text TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  copied_at TIMESTAMP,
  sent_at TIMESTAMP
);

-- Indexes for email_generation_analytics
CREATE INDEX IF NOT EXISTS idx_email_gen_rep ON email_generation_analytics(rep_name);
CREATE INDEX IF NOT EXISTS idx_email_gen_template ON email_generation_analytics(template_name);
CREATE INDEX IF NOT EXISTS idx_email_gen_created ON email_generation_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_email_gen_success ON email_generation_analytics(was_copied, was_sent);
CREATE INDEX IF NOT EXISTS idx_email_gen_session ON email_generation_analytics(session_id);

-- ================================================
-- TABLE 3: TEMPLATE_ANALYTICS
-- ================================================
-- Template performance and effectiveness tracking
-- ================================================

CREATE TABLE IF NOT EXISTS template_analytics (
  id SERIAL PRIMARY KEY,

  template_id VARCHAR(100) NOT NULL UNIQUE,
  template_name VARCHAR(255) NOT NULL,

  -- Usage stats
  times_recommended INTEGER DEFAULT 0,
  times_selected INTEGER DEFAULT 0,
  times_generated INTEGER DEFAULT 0,
  times_copied INTEGER DEFAULT 0,
  times_sent INTEGER DEFAULT 0,

  -- Success rates (calculated fields)
  acceptance_rate DECIMAL(5,2) DEFAULT 0, -- selected/recommended ratio
  copy_rate DECIMAL(5,2) DEFAULT 0, -- copied/generated ratio
  success_rate DECIMAL(5,2) DEFAULT 0, -- (copied + sent) / generated

  -- Feedback
  positive_feedback_count INTEGER DEFAULT 0,
  negative_feedback_count INTEGER DEFAULT 0,

  -- Last update
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for template_analytics
CREATE INDEX IF NOT EXISTS idx_template_stats_name ON template_analytics(template_name);
CREATE INDEX IF NOT EXISTS idx_template_stats_success ON template_analytics(success_rate DESC);

-- ================================================
-- TABLE 4: ARGUMENT_ANALYTICS
-- ================================================
-- Argument library performance tracking
-- ================================================

CREATE TABLE IF NOT EXISTS argument_analytics (
  id SERIAL PRIMARY KEY,

  argument_id VARCHAR(100) NOT NULL UNIQUE,
  argument_text TEXT NOT NULL,
  argument_category VARCHAR(100),

  -- Usage stats
  times_suggested INTEGER DEFAULT 0,
  times_selected INTEGER DEFAULT 0,
  times_used_in_successful_email INTEGER DEFAULT 0,

  -- Success rate
  success_rate DECIMAL(5,2) DEFAULT 0,

  -- Co-occurrence tracking
  commonly_paired_with TEXT[], -- Array of argument IDs that work well together

  -- Last update
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for argument_analytics
CREATE INDEX IF NOT EXISTS idx_argument_stats_category ON argument_analytics(argument_category);
CREATE INDEX IF NOT EXISTS idx_argument_stats_success ON argument_analytics(success_rate DESC);

-- ================================================
-- TABLE 5: QUESTION_ANALYTICS
-- ================================================
-- Track all questions asked and responses
-- ================================================

CREATE TABLE IF NOT EXISTS question_analytics (
  id SERIAL PRIMARY KEY,

  -- Question details
  question_text TEXT NOT NULL,
  question_hash VARCHAR(64) NOT NULL, -- SHA256 for deduplication
  question_category VARCHAR(100), -- Auto-categorized

  -- Context
  rep_name VARCHAR(255),
  session_id INTEGER REFERENCES chat_sessions(id),

  -- Response details
  response_text TEXT,
  response_time_ms INTEGER,
  response_provider VARCHAR(50), -- 'Abacus.AI', 'HuggingFace', 'Ollama'

  -- Templates suggested
  templates_suggested TEXT[],
  template_was_used BOOLEAN DEFAULT FALSE,

  -- Feedback
  was_helpful BOOLEAN,
  user_correction TEXT,
  flagged_as_wrong BOOLEAN DEFAULT FALSE,

  -- Timestamps
  asked_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for question_analytics
CREATE INDEX IF NOT EXISTS idx_question_hash ON question_analytics(question_hash);
CREATE INDEX IF NOT EXISTS idx_question_category ON question_analytics(question_category);
CREATE INDEX IF NOT EXISTS idx_question_rep ON question_analytics(rep_name);
CREATE INDEX IF NOT EXISTS idx_question_asked ON question_analytics(asked_at);
CREATE INDEX IF NOT EXISTS idx_question_flagged ON question_analytics(flagged_as_wrong);

-- ================================================
-- TABLE 6: USER_FEEDBACK
-- ================================================
-- Collect all user feedback and corrections
-- ================================================

CREATE TABLE IF NOT EXISTS user_feedback (
  id SERIAL PRIMARY KEY,

  -- Context
  rep_id INTEGER REFERENCES reps(id),
  rep_name VARCHAR(255) NOT NULL,
  session_id INTEGER REFERENCES chat_sessions(id),
  message_id INTEGER REFERENCES chat_messages(id),

  -- Feedback type
  feedback_type VARCHAR(50) NOT NULL, -- 'helpful', 'not_helpful', 'wrong_answer', 'correction', 'feature_request'
  severity VARCHAR(20), -- 'low', 'medium', 'high', 'critical'

  -- Content
  original_question TEXT,
  susan_response TEXT,
  user_comment TEXT,
  user_correction TEXT,

  -- Categorization
  category VARCHAR(100), -- 'accuracy', 'relevance', 'formatting', 'feature', 'other'

  -- Status
  reviewed BOOLEAN DEFAULT FALSE,
  action_taken TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP
);

-- Indexes for user_feedback
CREATE INDEX IF NOT EXISTS idx_feedback_type ON user_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_feedback_rep ON user_feedback(rep_name);
CREATE INDEX IF NOT EXISTS idx_feedback_reviewed ON user_feedback(reviewed);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON user_feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_feedback_severity ON user_feedback(severity);

-- ================================================
-- TABLE 7: FEATURE_USAGE_ANALYTICS
-- ================================================
-- Track feature adoption and usage patterns
-- ================================================

CREATE TABLE IF NOT EXISTS feature_usage_analytics (
  id SERIAL PRIMARY KEY,

  feature_name VARCHAR(100) NOT NULL,
  feature_category VARCHAR(50), -- 'email_generation', 'document_analysis', 'storm_data', etc.

  -- Usage by rep
  rep_name VARCHAR(255) NOT NULL,

  -- Usage details
  times_accessed INTEGER DEFAULT 0,
  average_session_duration_seconds DECIMAL(10,2),
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,

  -- Performance
  average_load_time_ms DECIMAL(10,2),

  -- Last update
  last_used_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(feature_name, rep_name)
);

-- Indexes for feature_usage_analytics
CREATE INDEX IF NOT EXISTS idx_feature_usage_name ON feature_usage_analytics(feature_name);
CREATE INDEX IF NOT EXISTS idx_feature_usage_rep ON feature_usage_analytics(rep_name);
CREATE INDEX IF NOT EXISTS idx_feature_usage_category ON feature_usage_analytics(feature_category);

-- ================================================
-- TABLE 8: PERFORMANCE_METRICS
-- ================================================
-- System performance and health monitoring
-- ================================================

CREATE TABLE IF NOT EXISTS performance_metrics (
  id SERIAL PRIMARY KEY,

  metric_type VARCHAR(50) NOT NULL, -- 'chat_response', 'email_generation', 'pdf_extraction', etc.

  -- Performance data
  response_time_ms INTEGER NOT NULL,
  success BOOLEAN NOT NULL,
  error_message TEXT,

  -- Provider info
  provider_used VARCHAR(50), -- 'Abacus.AI', 'HuggingFace', 'Ollama', 'StaticKnowledge'
  failover_occurred BOOLEAN DEFAULT FALSE,

  -- Context
  rep_name VARCHAR(255),
  session_id INTEGER REFERENCES chat_sessions(id),

  -- Timestamps
  measured_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance_metrics
CREATE INDEX IF NOT EXISTS idx_perf_type ON performance_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_perf_provider ON performance_metrics(provider_used);
CREATE INDEX IF NOT EXISTS idx_perf_measured ON performance_metrics(measured_at);
CREATE INDEX IF NOT EXISTS idx_perf_success ON performance_metrics(success);

-- ================================================
-- EXTEND EXISTING TABLES
-- ================================================

-- Extend chat_sessions with analytics fields
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS session_duration_seconds INTEGER;
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS emails_generated INTEGER DEFAULT 0;
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS errors_encountered INTEGER DEFAULT 0;
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS features_used TEXT[];
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS education_mode_active BOOLEAN DEFAULT FALSE;
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS hands_free_mode_active BOOLEAN DEFAULT FALSE;

-- Extend reps with additional tracking
ALTER TABLE reps ADD COLUMN IF NOT EXISTS emails_generated_total INTEGER DEFAULT 0;
ALTER TABLE reps ADD COLUMN IF NOT EXISTS success_rate DECIMAL(5,2);
ALTER TABLE reps ADD COLUMN IF NOT EXISTS error_rate DECIMAL(5,2);

-- ================================================
-- HELPER FUNCTIONS
-- ================================================

-- Function to update template analytics
CREATE OR REPLACE FUNCTION update_template_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update template stats when email is generated
  INSERT INTO template_analytics (template_id, template_name, times_generated)
  VALUES (NEW.template_id, NEW.template_name, 1)
  ON CONFLICT (template_id)
  DO UPDATE SET
    times_generated = template_analytics.times_generated + 1,
    updated_at = NOW();

  -- Update copy stats
  IF NEW.was_copied THEN
    UPDATE template_analytics
    SET times_copied = times_copied + 1,
        copy_rate = (times_copied::decimal / NULLIF(times_generated, 0)) * 100
    WHERE template_id = NEW.template_id;
  END IF;

  -- Update sent stats
  IF NEW.was_sent THEN
    UPDATE template_analytics
    SET times_sent = times_sent + 1,
        success_rate = ((times_copied + times_sent)::decimal / NULLIF(times_generated, 0)) * 100
    WHERE template_id = NEW.template_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for template analytics updates
DROP TRIGGER IF EXISTS trigger_update_template_analytics ON email_generation_analytics;
CREATE TRIGGER trigger_update_template_analytics
  AFTER INSERT OR UPDATE ON email_generation_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_template_analytics();

-- Function to calculate session duration
CREATE OR REPLACE FUNCTION calculate_session_duration()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_sessions
  SET session_duration_seconds = EXTRACT(EPOCH FROM (last_message_at - started_at))
  WHERE id = NEW.session_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for session duration calculation
DROP TRIGGER IF EXISTS trigger_calculate_session_duration ON chat_messages;
CREATE TRIGGER trigger_calculate_session_duration
  AFTER INSERT OR UPDATE ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION calculate_session_duration();

-- ================================================
-- MATERIALIZED VIEWS FOR FAST ANALYTICS
-- ================================================

-- Daily usage summary
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_usage_summary AS
SELECT
  DATE(created_at) as date,
  COUNT(DISTINCT rep_name) as unique_users,
  COUNT(DISTINCT session_id) as total_sessions,
  COUNT(*) as total_messages,
  COUNT(*) FILTER (WHERE role = 'user') as user_messages,
  COUNT(*) FILTER (WHERE role = 'assistant') as assistant_messages
FROM chat_messages
GROUP BY DATE(created_at)
ORDER BY date DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_usage_date ON daily_usage_summary(date);

-- Hourly usage patterns (for heatmap)
CREATE MATERIALIZED VIEW IF NOT EXISTS hourly_usage_patterns AS
SELECT
  EXTRACT(DOW FROM created_at) as day_of_week, -- 0=Sunday, 6=Saturday
  EXTRACT(HOUR FROM created_at) as hour_of_day,
  COUNT(*) as message_count,
  COUNT(DISTINCT session_id) as session_count
FROM chat_messages
GROUP BY EXTRACT(DOW FROM created_at), EXTRACT(HOUR FROM created_at)
ORDER BY day_of_week, hour_of_day;

CREATE UNIQUE INDEX IF NOT EXISTS idx_hourly_patterns ON hourly_usage_patterns(day_of_week, hour_of_day);

-- Top questions
CREATE MATERIALIZED VIEW IF NOT EXISTS top_questions AS
SELECT
  question_hash,
  question_text,
  question_category,
  COUNT(*) as ask_count,
  AVG(response_time_ms) as avg_response_time,
  COUNT(*) FILTER (WHERE was_helpful = true) as helpful_count,
  COUNT(*) FILTER (WHERE flagged_as_wrong = true) as wrong_count,
  MAX(asked_at) as last_asked
FROM question_analytics
GROUP BY question_hash, question_text, question_category
ORDER BY ask_count DESC
LIMIT 100;

CREATE UNIQUE INDEX IF NOT EXISTS idx_top_questions_hash ON top_questions(question_hash);

-- Template performance summary
CREATE MATERIALIZED VIEW IF NOT EXISTS template_performance_summary AS
SELECT
  template_id,
  template_name,
  times_generated,
  times_copied,
  times_sent,
  copy_rate,
  success_rate,
  (times_copied + times_sent) as total_successes,
  positive_feedback_count,
  negative_feedback_count,
  CASE
    WHEN negative_feedback_count = 0 THEN 100
    ELSE (positive_feedback_count::decimal / NULLIF(positive_feedback_count + negative_feedback_count, 0)) * 100
  END as feedback_satisfaction_rate
FROM template_analytics
WHERE times_generated > 0
ORDER BY success_rate DESC, times_generated DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_template_perf_id ON template_performance_summary(template_id);

-- ================================================
-- REFRESH FUNCTIONS FOR MATERIALIZED VIEWS
-- ================================================

CREATE OR REPLACE FUNCTION refresh_all_analytics_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY daily_usage_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY hourly_usage_patterns;
  REFRESH MATERIALIZED VIEW CONCURRENTLY top_questions;
  REFRESH MATERIALIZED VIEW CONCURRENTLY template_performance_summary;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- MIGRATION COMPLETE
-- ================================================

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Analytics schema migration completed successfully!';
  RAISE NOTICE 'Created 8 new tables:';
  RAISE NOTICE '  - analytics_events';
  RAISE NOTICE '  - email_generation_analytics';
  RAISE NOTICE '  - template_analytics';
  RAISE NOTICE '  - argument_analytics';
  RAISE NOTICE '  - question_analytics';
  RAISE NOTICE '  - user_feedback';
  RAISE NOTICE '  - feature_usage_analytics';
  RAISE NOTICE '  - performance_metrics';
  RAISE NOTICE 'Created 4 materialized views for fast analytics';
  RAISE NOTICE 'Created helper functions and triggers';
  RAISE NOTICE 'Extended existing tables with analytics fields';
END $$;
