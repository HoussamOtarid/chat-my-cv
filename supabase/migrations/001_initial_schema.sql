-- ============================================
-- Enable UUID extension
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Configuration table
-- ============================================
CREATE TABLE IF NOT EXISTS configuration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  encrypted BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add index for key lookups
CREATE INDEX idx_configuration_key ON configuration(key);

-- ============================================
-- Resume table
-- ============================================
CREATE TABLE IF NOT EXISTS resume (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  content TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT DEFAULT 'application/pdf' NOT NULL,
  file_url TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL
);

-- Add index for active resume lookup
CREATE INDEX idx_resume_active ON resume(is_active) WHERE is_active = true;

-- ============================================
-- Chat session table
-- ============================================
CREATE TABLE IF NOT EXISTS chat_session (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL,
  ip_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add indexes for session lookups
CREATE INDEX idx_chat_session_client_id ON chat_session(client_id);
CREATE INDEX idx_chat_session_created_at ON chat_session(created_at DESC);

-- ============================================
-- Chat message table
-- ============================================
CREATE TABLE IF NOT EXISTS chat_message (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES chat_session(id) ON DELETE CASCADE,
  client_message_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Ensure unique client_message_id per session for deduplication
  CONSTRAINT unique_session_client_message UNIQUE(session_id, client_message_id)
);

-- Add indexes for message queries
CREATE INDEX idx_chat_message_session_id ON chat_message(session_id);
CREATE INDEX idx_chat_message_created_at ON chat_message(created_at DESC);

-- ============================================
-- Updated at trigger function
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to configuration table
CREATE TRIGGER update_configuration_updated_at BEFORE UPDATE ON configuration
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (RLS) - Deny All by Default
-- ============================================

-- Enable RLS on all tables
ALTER TABLE configuration ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_session ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_message ENABLE ROW LEVEL SECURITY;

-- Create deny-all policies (no access except through service role)
-- Configuration table - admin only
CREATE POLICY "configuration_deny_all" ON configuration
  FOR ALL USING (false);

-- Resume table - admin only
CREATE POLICY "resume_deny_all" ON resume
  FOR ALL USING (false);

-- Chat session table - service role only
CREATE POLICY "chat_session_deny_all" ON chat_session
  FOR ALL USING (false);

-- Chat message table - service role only
CREATE POLICY "chat_message_deny_all" ON chat_message
  FOR ALL USING (false);

-- ============================================
-- Helper functions for admin operations
-- ============================================

-- Function to get active resume content
CREATE OR REPLACE FUNCTION get_active_resume_content()
RETURNS TEXT AS $$
DECLARE
  resume_content TEXT;
BEGIN
  SELECT content INTO resume_content
  FROM resume
  WHERE is_active = true
  ORDER BY uploaded_at DESC
  LIMIT 1;
  
  RETURN resume_content;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to upsert configuration
CREATE OR REPLACE FUNCTION upsert_configuration(
  p_key TEXT,
  p_value JSONB,
  p_encrypted BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
  config_id UUID;
BEGIN
  INSERT INTO configuration (key, value, encrypted)
  VALUES (p_key, p_value, p_encrypted)
  ON CONFLICT (key) 
  DO UPDATE SET 
    value = EXCLUDED.value,
    encrypted = EXCLUDED.encrypted,
    updated_at = NOW()
  RETURNING id INTO config_id;
  
  RETURN config_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Initial seed data (optional)
-- ============================================

-- Insert default configuration
INSERT INTO configuration (key, value, encrypted) VALUES
  ('app_settings', '{"name": "Chat My CV", "version": "1.0.0"}', false),
  ('rate_limit', '{"max_requests": 10, "window_ms": 60000}', false)
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- Comments for documentation
-- ============================================
COMMENT ON TABLE configuration IS 'Stores application configuration including encrypted API keys';
COMMENT ON TABLE resume IS 'Stores uploaded resume PDFs and their extracted content';
COMMENT ON TABLE chat_session IS 'Tracks chat sessions with client identification';
COMMENT ON TABLE chat_message IS 'Stores all chat messages with deduplication support';

COMMENT ON COLUMN configuration.encrypted IS 'Whether the value field contains encrypted data';
COMMENT ON COLUMN resume.is_active IS 'Only one resume should be active at a time';
COMMENT ON COLUMN chat_session.client_id IS 'Stable client identifier from localStorage';
COMMENT ON COLUMN chat_session.ip_hash IS 'Hashed IP address for privacy-preserving analytics';
COMMENT ON COLUMN chat_message.client_message_id IS 'Client-generated UUID for deduplication';