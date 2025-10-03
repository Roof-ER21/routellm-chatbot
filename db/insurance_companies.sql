-- Insurance Companies Table Schema
-- Stores comprehensive insurance company information for roofing claims

CREATE TABLE IF NOT EXISTS insurance_companies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  claim_handler_type VARCHAR(50), -- 'Team' or 'Adjuster'
  phone VARCHAR(50) NOT NULL,
  phone_instructions TEXT, -- Extension/dialing instructions like "dial 1,1,1,1,2,2"
  email VARCHAR(255),
  additional_phone VARCHAR(50),
  additional_email VARCHAR(255),
  website VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive'
  notes TEXT,
  usage_count INTEGER DEFAULT 0, -- Track popularity
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_insurance_name ON insurance_companies(name);
CREATE INDEX IF NOT EXISTS idx_insurance_status ON insurance_companies(status);
CREATE INDEX IF NOT EXISTS idx_insurance_usage ON insurance_companies(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_insurance_search ON insurance_companies USING gin(to_tsvector('english', name));

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_insurance_companies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_insurance_companies_updated_at
  BEFORE UPDATE ON insurance_companies
  FOR EACH ROW
  EXECUTE FUNCTION update_insurance_companies_updated_at();

-- User Insurance Company Preferences (track which companies reps use most)
CREATE TABLE IF NOT EXISTS user_insurance_preferences (
  id SERIAL PRIMARY KEY,
  rep_id INTEGER REFERENCES reps(id),
  company_id INTEGER REFERENCES insurance_companies(id),
  last_used TIMESTAMP DEFAULT NOW(),
  use_count INTEGER DEFAULT 1,
  UNIQUE(rep_id, company_id)
);

CREATE INDEX IF NOT EXISTS idx_user_insurance_rep ON user_insurance_preferences(rep_id);
CREATE INDEX IF NOT EXISTS idx_user_insurance_company ON user_insurance_preferences(company_id);

-- Claim Insurance Company Association (track which companies are associated with which claims)
CREATE TABLE IF NOT EXISTS claim_insurance_associations (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES chat_sessions(id),
  company_id INTEGER REFERENCES insurance_companies(id),
  claim_number VARCHAR(255),
  adjuster_name VARCHAR(255),
  adjuster_phone VARCHAR(50),
  adjuster_email VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claim_insurance_session ON claim_insurance_associations(session_id);
CREATE INDEX IF NOT EXISTS idx_claim_insurance_company ON claim_insurance_associations(company_id);
