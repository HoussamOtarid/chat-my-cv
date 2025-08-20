-- ============================================
-- Migration: Add model column to chat_message table
-- Description: Adds column for tracking which LLM model was used
-- Date: 2025-01-08
-- ============================================

-- Add model column to chat_message table
ALTER TABLE chat_message 
ADD COLUMN IF NOT EXISTS model TEXT;

-- Add comment documentation for new column
COMMENT ON COLUMN chat_message.model IS 'LLM model used to generate assistant responses';