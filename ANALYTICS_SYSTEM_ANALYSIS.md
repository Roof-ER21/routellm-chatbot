# Susan AI Analytics System - Complete Analysis & Design

**Date:** 2025-10-24
**System:** Susan AI-21 (RoofER/The Roof Docs)
**Purpose:** Comprehensive usage tracking and admin analytics

---

## PHASE 1: CURRENT SYSTEM ANALYSIS

### Existing Database Schema

The system currently uses PostgreSQL (Railway) with the following tables:

#### Core Tables:
1. **reps** - User/representative tracking
   - `id` (SERIAL PRIMARY KEY)
   - `name` (VARCHAR, UNIQUE)
   - `created_at`, `last_active` (TIMESTAMP)
   - `total_chats` (INTEGER)

2. **chat_sessions** - Session tracking
   - `id` (SERIAL PRIMARY KEY)
   - `rep_id` (FK to reps)
   - `rep_name` (VARCHAR)
   - `started_at`, `last_message_at` (TIMESTAMP)
   - `message_count` (INTEGER)

3. **chat_messages** - All chat interactions
   - `id` (SERIAL PRIMARY KEY)
   - `session_id` (FK to chat_sessions)
   - `rep_id` (FK to reps)
   - `rep_name` (VARCHAR)
   - `role` (user/assistant)
   - `content` (TEXT)
   - `created_at` (TIMESTAMP)

4. **sent_emails** - Email generation tracking (EXISTING!)
   - `id` (SERIAL PRIMARY KEY)
   - `session_id` (FK)
   - `rep_name` (VARCHAR)
   - `to_email`, `from_email`, `subject`, `body`, `html_body` (TEXT)
   - `template_used` (TEXT)
   - `attachments` (JSONB)
   - `delivery_status`, `resend_id` (TEXT)
   - `sent_at`, `delivered_at` (TIMESTAMP)

5. **threat_alerts** - Security monitoring (EXISTING!)
   - `id` (SERIAL PRIMARY KEY)
   - `session_id`, `message_id` (FKs)
   - `rep_name`, `category`, `pattern`, `severity` (VARCHAR)
   - `risk_score` (INTEGER)
   - `matched_text` (TEXT)
   - `created_at` (TIMESTAMP)

6. **hail_events** - NOAA storm data for claims verification

7. **weather_sync_log** - Weather data sync tracking

### Current Tracking Capabilities

**What IS Currently Tracked:**
- Basic chat message logging (user/assistant messages)
- Session creation and duration (implicit via timestamps)
- Rep activity (last_active, total_chats count)
- Email sends (via sent_emails table) - template, recipient, content
- Threat/security alerts (comprehensive pattern detection)
- NOAA storm data for insurance claims

**What IS NOT Currently Tracked:**
- Email generation attempts (success/failure/regenerations)
- Template selection rationale and changes
- Argument selection from library
- PDF upload events and success rates
- Document analysis usage
- Feature usage (template selector, argument selector, etc.)
- User feedback (thumbs up/down, corrections, "Susan was wrong")
- Response times and performance metrics
- Question categorization and frequency analysis
- Copy-to-clipboard events (success indicators)
- Education mode usage vs normal mode
- AI provider failover events
- Template recommendation acceptance rates
- Conversation topics and categorization

### Current Admin Dashboard

**Existing Features:**
- Rep statistics (total chats, sessions, messages)
- Today's activity view
- Full chat transcripts (with search)
- Threat alert monitoring (with severity filters)
- Master transcript export
- Database management tools

**Missing Analytics:**
- Usage patterns by time of day/week
- Email generation metrics and trends
- Template effectiveness analysis
- Most asked questions
- Feature adoption rates
- User feedback collection and analysis
- Performance monitoring
- Improvement opportunities dashboard

---

## PHASE 2: ANALYTICS SCHEMA DESIGN

### New Tables Required

#### 1. analytics_events (Master event log)
```sql
CREATE TABLE analytics_events (
  id SERIAL PRIMARY KEY,
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
  created_at TIMESTAMP DEFAULT NOW(),

  -- Indexes
  INDEX idx_events_type (event_type),
  INDEX idx_events_category (event_category),
  INDEX idx_events_rep (rep_name),
  INDEX idx_events_session (session_id),
  INDEX idx_events_created (created_at)
);
```

**Event Types:**
- `chat_message_sent`
- `chat_response_received`
- `email_generation_requested`
- `email_generated_success`
- `email_generation_failed`
- `email_copied_to_clipboard`
- `email_regenerated`
- `template_selected`
- `template_recommended`
- `argument_selected`
- `pdf_uploaded`
- `pdf_extraction_failed`
- `document_analyzed`
- `feature_used`
- `feedback_provided`
- `error_occurred`
- `mode_changed`
- `provider_failover`

#### 2. email_generation_analytics (Enhanced email tracking)
```sql
CREATE TABLE email_generation_analytics (
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
  sent_at TIMESTAMP,

  -- Indexes
  INDEX idx_email_gen_rep (rep_name),
  INDEX idx_email_gen_template (template_name),
  INDEX idx_email_gen_created (created_at),
  INDEX idx_email_gen_success (was_copied, was_sent)
);
```

#### 3. template_analytics (Template performance)
```sql
CREATE TABLE template_analytics (
  id SERIAL PRIMARY KEY,

  template_id VARCHAR(100) NOT NULL,
  template_name VARCHAR(255) NOT NULL,

  -- Usage stats (updated via triggers/functions)
  times_recommended INTEGER DEFAULT 0,
  times_selected INTEGER DEFAULT 0,
  times_generated INTEGER DEFAULT 0,
  times_copied INTEGER DEFAULT 0,
  times_sent INTEGER DEFAULT 0,

  -- Success rates (calculated fields)
  acceptance_rate DECIMAL(5,2), -- selected/recommended ratio
  copy_rate DECIMAL(5,2), -- copied/generated ratio
  success_rate DECIMAL(5,2), -- (copied + sent) / generated

  -- Feedback
  positive_feedback_count INTEGER DEFAULT 0,
  negative_feedback_count INTEGER DEFAULT 0,

  -- Last update
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(template_id),
  INDEX idx_template_stats_name (template_name)
);
```

#### 4. argument_analytics (Argument library performance)
```sql
CREATE TABLE argument_analytics (
  id SERIAL PRIMARY KEY,

  argument_id VARCHAR(100) NOT NULL,
  argument_text TEXT NOT NULL,
  argument_category VARCHAR(100),

  -- Usage stats
  times_suggested INTEGER DEFAULT 0,
  times_selected INTEGER DEFAULT 0,
  times_used_in_successful_email INTEGER DEFAULT 0,

  -- Success rate
  success_rate DECIMAL(5,2),

  -- Co-occurrence tracking (which arguments work well together)
  commonly_paired_with TEXT[], -- Array of argument IDs

  -- Last update
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(argument_id),
  INDEX idx_argument_stats_category (argument_category)
);
```

#### 5. question_analytics (Question tracking)
```sql
CREATE TABLE question_analytics (
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
  asked_at TIMESTAMP DEFAULT NOW(),

  -- Indexes
  INDEX idx_question_hash (question_hash),
  INDEX idx_question_category (question_category),
  INDEX idx_question_rep (rep_name),
  INDEX idx_question_asked (asked_at)
);
```

#### 6. user_feedback (Feedback collection)
```sql
CREATE TABLE user_feedback (
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
  reviewed_at TIMESTAMP,

  -- Indexes
  INDEX idx_feedback_type (feedback_type),
  INDEX idx_feedback_rep (rep_name),
  INDEX idx_feedback_reviewed (reviewed),
  INDEX idx_feedback_created (created_at)
);
```

#### 7. feature_usage_analytics (Feature adoption tracking)
```sql
CREATE TABLE feature_usage_analytics (
  id SERIAL PRIMARY KEY,

  feature_name VARCHAR(100) NOT NULL,
  feature_category VARCHAR(50), -- 'email_generation', 'document_analysis', 'storm_data', etc.

  -- Usage by rep
  rep_name VARCHAR(255),

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

  UNIQUE(feature_name, rep_name),
  INDEX idx_feature_usage_name (feature_name),
  INDEX idx_feature_usage_rep (rep_name)
);
```

#### 8. performance_metrics (System performance)
```sql
CREATE TABLE performance_metrics (
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
  measured_at TIMESTAMP DEFAULT NOW(),

  -- Indexes
  INDEX idx_perf_type (metric_type),
  INDEX idx_perf_provider (provider_used),
  INDEX idx_perf_measured (measured_at)
);
```

### Enhanced Existing Tables

#### Extend chat_sessions:
```sql
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS session_duration_seconds INTEGER;
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS emails_generated INTEGER DEFAULT 0;
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS errors_encountered INTEGER DEFAULT 0;
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS features_used TEXT[];
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS education_mode_active BOOLEAN DEFAULT FALSE;
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS hands_free_mode_active BOOLEAN DEFAULT FALSE;
```

---

## PHASE 3: EVENT TRACKING IMPLEMENTATION

### Events to Track

#### Chat Events
1. **chat_message_sent**
   - Location: `/app/api/chat/route.ts`
   - Data: message_length, has_attachments, mode (voice/text/education)

2. **chat_response_received**
   - Location: `/app/api/chat/route.ts`
   - Data: response_time_ms, provider_used, response_length, model_name

3. **provider_failover**
   - Location: `/lib/ai-provider-failover.ts`
   - Data: failed_provider, fallback_provider, error_reason

#### Email Generation Events
1. **email_generation_requested**
   - Location: `EmailGenerator.tsx` - handleGenerate
   - Data: email_type, has_pdf, template_id, arguments_count

2. **email_generated_success**
   - Location: `EmailGenerator.tsx` - handleGenerate
   - Data: template_used, generation_time_ms, character_count, arguments_selected

3. **email_generation_failed**
   - Location: `EmailGenerator.tsx` - catch block
   - Data: error_message, template_attempted

4. **email_copied_to_clipboard**
   - Location: `EmailGenerator.tsx` - copyToClipboard
   - Data: template_used, was_regenerated

5. **email_regenerated**
   - Location: `EmailGenerator.tsx` - regenerate handler
   - Data: regeneration_count, original_template, dissatisfaction_indicator

6. **template_selected**
   - Location: `EmailGenerator.tsx` - template selector
   - Data: template_id, was_recommended, user_override

7. **template_recommended**
   - Location: `EmailGenerator.tsx` - PDF upload analysis
   - Data: recommended_template, confidence_score, document_type

8. **argument_selected**
   - Location: `EmailGenerator.tsx` - argument selector
   - Data: argument_ids, total_selected, category_distribution

#### Document Analysis Events
1. **pdf_uploaded**
   - Location: `EmailGenerator.tsx` - handleFileUpload
   - Data: file_size, page_count, extraction_success

2. **pdf_extraction_failed**
   - Location: `EmailGenerator.tsx` - handleFileUpload catch
   - Data: error_type, file_size

3. **document_analyzed**
   - Location: `EmailGenerator.tsx` - analyzeDocument
   - Data: document_type, issues_found, recommendations_made

#### Feature Usage Events
1. **feature_used**
   - Location: Multiple components
   - Data: feature_name, duration_ms, success

#### Feedback Events
1. **feedback_provided**
   - Location: New feedback buttons in chat
   - Data: feedback_type (helpful/not_helpful/wrong), message_id

2. **susan_was_wrong**
   - Location: New feedback component
   - Data: original_question, response, user_correction

#### Mode Change Events
1. **mode_changed**
   - Location: `/app/api/chat/route.ts`
   - Data: mode_from, mode_to (normal/education/hands_free)

---

## PHASE 4: ANALYTICS API ENDPOINTS

### Required Endpoints

1. **POST /api/analytics/track**
   - Purpose: Generic event tracking
   - Body: { event_type, event_category, event_data }
   - Response: { success, event_id }

2. **GET /api/analytics/dashboard**
   - Purpose: Main dashboard overview
   - Response: Overview statistics for all metrics

3. **GET /api/analytics/emails**
   - Purpose: Email generation analytics
   - Query: ?start_date, ?end_date, ?rep_name
   - Response: Email generation stats and trends

4. **GET /api/analytics/templates**
   - Purpose: Template performance analysis
   - Response: Template usage and success rates

5. **GET /api/analytics/questions**
   - Purpose: Question analytics
   - Response: Top questions, categories, unanswered questions

6. **GET /api/analytics/feedback**
   - Purpose: User feedback and corrections
   - Response: Feedback summary and actionable items

7. **GET /api/analytics/performance**
   - Purpose: System performance metrics
   - Response: Response times, error rates, provider stats

8. **GET /api/analytics/usage-patterns**
   - Purpose: Time-based usage analysis
   - Response: Usage by hour/day/week

9. **GET /api/analytics/users/:repName**
   - Purpose: Per-user analytics
   - Response: Detailed stats for specific rep

10. **GET /api/analytics/features**
    - Purpose: Feature adoption and usage
    - Response: Feature usage statistics

---

## PHASE 5: ADMIN DASHBOARD DESIGN

### New Dashboard Page: `/app/admin/analytics/page.tsx`

#### Dashboard Sections:

##### 1. Overview (Hero Stats)
- Total users (all time)
- Active users (today/week/month)
- Total messages (today/week/month)
- Total emails generated (today/week/month)
- Success rate (emails copied/sent vs generated)
- Average response time
- Current error rate

##### 2. Usage Patterns
**Visualizations:**
- Heatmap: Usage by hour of day
- Bar chart: Usage by day of week
- Line chart: Active users over time (7/30/90 days)
- Histogram: Session duration distribution
- Pie chart: Education mode vs Normal mode usage

##### 3. Email Generation Analytics
**Metrics:**
- Total emails generated (with trend)
- Templates used (bar chart - top 10)
- Rep-sent vs Customer-sent ratio
- Insurance vs Homeowner emails
- Average generation time
- Copy-to-clipboard rate (success indicator)
- Regeneration rate (dissatisfaction indicator)
- Template recommendation acceptance rate

**Table: Template Performance**
- Template name
- Times recommended
- Times selected
- Acceptance rate
- Copy rate
- Success rate

##### 4. Question Analytics
**Top Questions Table:**
- Question text (truncated)
- Frequency count
- Category
- Average response time
- Helpfulness rating

**Visualizations:**
- Pie chart: Question categories
- Bar chart: Questions by category
- List: Questions flagged as "Susan was wrong"

##### 5. Feedback & Errors
**Critical Metrics:**
- "Susan was wrong" count (by day/week)
- Negative feedback count
- Error rate (chart over time)
- Most common error types

**Feedback Table:**
- Date/time
- Rep name
- Feedback type
- Original question
- Response
- User correction
- Status (reviewed/unreviewed)

##### 6. Feature Usage
**Feature Adoption Table:**
- Feature name
- Total uses
- Unique users
- Success rate
- Average duration
- Last used

**Visualizations:**
- Bar chart: Most used features
- Line chart: Feature adoption over time

##### 7. User-Level Analytics
**User Table:**
- Rep name
- Total sessions
- Total messages
- Emails generated
- Success rate
- Error rate
- Most used templates
- Last active

**Per-User Drill-down:**
- Click on user to see detailed stats
- Usage timeline
- Email generation history
- Questions asked
- Feedback provided

##### 8. Improvement Opportunities
**AI-Powered Insights:**
- Most corrected answers (need training)
- Frequently asked questions without good answers
- Templates rarely used (consider removing)
- Arguments rarely selected (consider removing)
- Common error patterns (need fixing)
- Users with high error rates (need training)
- Questions that lead to "Susan was wrong"

##### 9. Performance Monitoring
**System Health:**
- Average response time (trend)
- Error rate (trend)
- Provider failover events
- Database query performance
- API endpoint response times

**Provider Stats:**
- Abacus.AI: requests, success rate, avg response time
- HuggingFace: requests, success rate, avg response time
- Ollama: requests, success rate, avg response time
- Static Knowledge: requests (fallback indicator)

---

## PHASE 6: IMPLEMENTATION PLAN

### Step 1: Database Setup
1. Create migration SQL file with all new tables
2. Create indexes for performance
3. Add migration endpoint to admin panel
4. Test database schema

### Step 2: Analytics Library
1. Create `/lib/analytics.ts` with tracking functions
2. Implement event batching for performance
3. Add error handling and retry logic

### Step 3: Integrate Tracking
1. Add tracking to `/app/api/chat/route.ts`
2. Add tracking to `EmailGenerator.tsx`
3. Add tracking to PDF upload handlers
4. Add feedback buttons to chat interface

### Step 4: API Endpoints
1. Create `/app/api/analytics/track/route.ts`
2. Create analytics query endpoints
3. Add data aggregation functions
4. Test all endpoints

### Step 5: Dashboard UI
1. Create analytics page component
2. Build visualization components (charts)
3. Implement data fetching and refresh
4. Add export functionality

### Step 6: Testing & Validation
1. Generate test data
2. Verify tracking accuracy
3. Test dashboard performance
4. User acceptance testing

---

## DELIVERABLES CHECKLIST

- [ ] Database migration SQL file
- [ ] Analytics library (`/lib/analytics.ts`)
- [ ] Updated chat route with tracking
- [ ] Updated EmailGenerator with tracking
- [ ] Feedback component for chat interface
- [ ] 10 analytics API endpoints
- [ ] Admin analytics dashboard page
- [ ] Chart visualization components
- [ ] Documentation (this file)
- [ ] Test suite for analytics
- [ ] Sample data for testing

---

## SUCCESS METRICS

The analytics system will be considered successful when:

1. **Complete Visibility**: All user interactions are tracked and visible
2. **Actionable Insights**: Admins can identify problems and opportunities
3. **Performance Impact**: < 50ms overhead for tracking
4. **Data Accuracy**: 99%+ tracking accuracy
5. **User Adoption**: Used daily by admin team
6. **System Improvement**: Leads to measurable improvements in:
   - Email generation success rate
   - Template effectiveness
   - User satisfaction
   - Error reduction
   - Response time optimization

---

## NEXT STEPS

1. Review and approve this design
2. Create database migration
3. Implement tracking library
4. Integrate tracking into components
5. Build API endpoints
6. Create dashboard UI
7. Deploy and test

---

**Document Status:** Complete ✅
**Ready for Implementation:** Yes ✅
