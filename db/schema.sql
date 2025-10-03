-- Reps table
CREATE TABLE IF NOT EXISTS reps (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  last_active TIMESTAMP DEFAULT NOW(),
  total_chats INTEGER DEFAULT 0
);

-- Chat sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id SERIAL PRIMARY KEY,
  rep_id INTEGER REFERENCES reps(id),
  rep_name VARCHAR(255) NOT NULL,
  started_at TIMESTAMP DEFAULT NOW(),
  last_message_at TIMESTAMP DEFAULT NOW(),
  message_count INTEGER DEFAULT 0
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES chat_sessions(id),
  rep_id INTEGER REFERENCES reps(id),
  rep_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL, -- 'user' or 'assistant'
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reps_name ON reps(name);
CREATE INDEX IF NOT EXISTS idx_sessions_rep ON chat_sessions(rep_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON chat_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_messages_session ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_rep ON chat_messages(rep_id);
CREATE INDEX IF NOT EXISTS idx_messages_date ON chat_messages(created_at);

-- NOAA Hail Events table for insurance claim verification
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
);

-- Indexes for hail events queries
CREATE INDEX IF NOT EXISTS idx_hail_date_state ON hail_events(event_date, state);
CREATE INDEX IF NOT EXISTS idx_hail_location ON hail_events(state, county, city);
CREATE INDEX IF NOT EXISTS idx_hail_zip ON hail_events(zip_code);
CREATE INDEX IF NOT EXISTS idx_hail_coordinates ON hail_events(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_hail_event_id ON hail_events(event_id);

-- Weather data sync log
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
);

CREATE INDEX IF NOT EXISTS idx_sync_log_date ON weather_sync_log(sync_date);
CREATE INDEX IF NOT EXISTS idx_sync_log_status ON weather_sync_log(sync_status);
