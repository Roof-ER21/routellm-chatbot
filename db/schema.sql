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
