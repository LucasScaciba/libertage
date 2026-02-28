-- Migration: Rate Limits Table
-- Description: Create table for database-backed rate limiting
-- Validates: Requirements 22.1, 22.2, 22.3, 22.4, 22.5

-- Create rate_limits table
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient lookups
CREATE INDEX idx_rate_limits_key_created ON rate_limits(key, created_at DESC);

-- Add comment
COMMENT ON TABLE rate_limits IS 'Stores rate limiting records for API endpoints. For production, consider using Redis for better performance.';
