-- Stories System Migration
-- Creates tables for stories, views, and reports

-- Stories table
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INTEGER NOT NULL,
  file_size_bytes INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  deleted_at TIMESTAMPTZ,
  
  CONSTRAINT valid_status CHECK (status IN ('active', 'expired', 'deleted')),
  CONSTRAINT valid_duration CHECK (duration_seconds > 0 AND duration_seconds <= 60),
  CONSTRAINT valid_file_size CHECK (file_size_bytes > 0 AND file_size_bytes <= 18874368)
);

CREATE INDEX idx_stories_user_id ON stories(user_id);
CREATE INDEX idx_stories_status ON stories(status);
CREATE INDEX idx_stories_expires_at ON stories(expires_at) WHERE status = 'active';
CREATE INDEX idx_stories_created_at ON stories(created_at DESC);
CREATE INDEX idx_stories_user_status ON stories(user_id, status) WHERE status = 'active';

-- Story views table
CREATE TABLE story_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  viewer_ip VARCHAR(45),
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint: one view per user per story per day
CREATE UNIQUE INDEX idx_story_views_unique_user ON story_views(story_id, viewer_id, (viewed_at::DATE))
  WHERE viewer_id IS NOT NULL;

-- Unique constraint: one view per IP per story per day
CREATE UNIQUE INDEX idx_story_views_unique_ip ON story_views(story_id, viewer_ip, (viewed_at::DATE))
  WHERE viewer_ip IS NOT NULL AND viewer_id IS NULL;

CREATE INDEX idx_story_views_story_id ON story_views(story_id);
CREATE INDEX idx_story_views_viewed_at ON story_views(viewed_at);

-- Story reports table
CREATE TABLE story_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reporter_ip VARCHAR(45),
  reason TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  CONSTRAINT valid_report_status CHECK (status IN ('pending', 'reviewed', 'dismissed'))
);

CREATE INDEX idx_story_reports_story_id ON story_reports(story_id);
CREATE INDEX idx_story_reports_status ON story_reports(status);
CREATE INDEX idx_story_reports_created_at ON story_reports(created_at DESC);

-- Add story limits to plans table
ALTER TABLE plans ADD COLUMN IF NOT EXISTS max_stories INTEGER NOT NULL DEFAULT 0;

-- Update existing plans with story limits
UPDATE plans SET max_stories = 0 WHERE code = 'free';
UPDATE plans SET max_stories = 1 WHERE code = 'premium';
UPDATE plans SET max_stories = 5 WHERE code = 'black';

-- Comments for documentation
COMMENT ON TABLE stories IS 'Stores user stories (24-hour temporary videos)';
COMMENT ON TABLE story_views IS 'Tracks story views with daily uniqueness per viewer';
COMMENT ON TABLE story_reports IS 'Stores reports for inappropriate stories';
COMMENT ON COLUMN stories.expires_at IS 'Automatically set to created_at + 24 hours';
COMMENT ON COLUMN stories.status IS 'active: visible, expired: past 24h, deleted: removed by owner';
