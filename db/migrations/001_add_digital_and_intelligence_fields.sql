-- Migration: Add Digital Platform and Intelligence Fields to Insurance Companies
-- Created: 2025-10-03
-- Purpose: Add fields from digital platforms research and deep dive intelligence

-- Add Digital Platform Fields
ALTER TABLE insurance_companies
ADD COLUMN IF NOT EXISTS app_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS app_store_url TEXT,
ADD COLUMN IF NOT EXISTS client_login_url TEXT,
ADD COLUMN IF NOT EXISTS guest_login_url TEXT,
ADD COLUMN IF NOT EXISTS portal_notes TEXT;

-- Add Intelligence Fields (from deep dive research)
ALTER TABLE insurance_companies
ADD COLUMN IF NOT EXISTS best_call_times VARCHAR(255),
ADD COLUMN IF NOT EXISTS current_delays TEXT,
ADD COLUMN IF NOT EXISTS proven_workarounds TEXT,
ADD COLUMN IF NOT EXISTS regional_intel TEXT,
ADD COLUMN IF NOT EXISTS social_escalation VARCHAR(255),
ADD COLUMN IF NOT EXISTS complaints_pattern TEXT,
ADD COLUMN IF NOT EXISTS alternative_channels TEXT,
ADD COLUMN IF NOT EXISTS executive_escalation TEXT;

-- Add Rating/Performance Fields
ALTER TABLE insurance_companies
ADD COLUMN IF NOT EXISTS naic_complaint_index DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS bbb_rating VARCHAR(10),
ADD COLUMN IF NOT EXISTS avg_hold_time_minutes INTEGER,
ADD COLUMN IF NOT EXISTS responsiveness_score INTEGER; -- 1-10 scale

-- Add Metadata
ALTER TABLE insurance_companies
ADD COLUMN IF NOT EXISTS last_intelligence_update TIMESTAMP DEFAULT NOW();

-- Create indexes for new searchable fields
CREATE INDEX IF NOT EXISTS idx_insurance_app_name ON insurance_companies(app_name) WHERE app_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_insurance_responsiveness ON insurance_companies(responsiveness_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_insurance_naic ON insurance_companies(naic_complaint_index ASC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_insurance_hold_time ON insurance_companies(avg_hold_time_minutes ASC NULLS LAST);

-- Add comment to table
COMMENT ON COLUMN insurance_companies.app_name IS 'Mobile app name (iOS/Android)';
COMMENT ON COLUMN insurance_companies.client_login_url IS 'Policyholder login portal URL';
COMMENT ON COLUMN insurance_companies.guest_login_url IS 'Guest/quick pay portal URL';
COMMENT ON COLUMN insurance_companies.best_call_times IS 'Optimal days/times to call (e.g., "Wed-Thu 7am-noon")';
COMMENT ON COLUMN insurance_companies.current_delays IS 'Known delays, staffing issues, backlogs (2024-2025)';
COMMENT ON COLUMN insurance_companies.proven_workarounds IS 'Insider tips and alternative methods that work';
COMMENT ON COLUMN insurance_companies.social_escalation IS 'Twitter/LinkedIn handles for escalation';
COMMENT ON COLUMN insurance_companies.executive_escalation IS 'CEO/VP contact info for disputes';
COMMENT ON COLUMN insurance_companies.naic_complaint_index IS 'NAIC complaint index (lower is better)';
COMMENT ON COLUMN insurance_companies.bbb_rating IS 'Better Business Bureau rating (A+ to F)';
COMMENT ON COLUMN insurance_companies.avg_hold_time_minutes IS 'Average phone hold time in minutes';
COMMENT ON COLUMN insurance_companies.responsiveness_score IS 'Overall responsiveness rating (1-10, 10 is best)';
