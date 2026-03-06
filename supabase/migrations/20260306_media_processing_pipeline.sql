-- Media Processing Pipeline Migration
-- Creates the media table with all necessary fields, indexes, triggers, and RLS policies

-- Create media table
CREATE TABLE IF NOT EXISTS media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('image', 'video')),
  original_path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'ready', 'failed')),
  width INTEGER,
  height INTEGER,
  duration INTEGER, -- seconds, for videos only
  variants JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_media_user_id ON media(user_id);
CREATE INDEX IF NOT EXISTS idx_media_status ON media(status);
CREATE INDEX IF NOT EXISTS idx_media_created_at ON media(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_type ON media(type);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic updated_at
DROP TRIGGER IF EXISTS update_media_updated_at ON media;
CREATE TRIGGER update_media_updated_at
  BEFORE UPDATE ON media
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE media ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own media" ON media;
DROP POLICY IF EXISTS "Users can insert their own media" ON media;
DROP POLICY IF EXISTS "Users can update their own media" ON media;
DROP POLICY IF EXISTS "Users can delete their own media" ON media;

-- RLS Policy: Users can view their own media
CREATE POLICY "Users can view their own media"
  ON media FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own media
CREATE POLICY "Users can insert their own media"
  ON media FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own media
CREATE POLICY "Users can update their own media"
  ON media FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policy: Users can delete their own media
CREATE POLICY "Users can delete their own media"
  ON media FOR DELETE
  USING (auth.uid() = user_id);

-- Add comment to table
COMMENT ON TABLE media IS 'Stores metadata for uploaded media files (images and videos) with processing status and variant information';

-- Add comments to columns
COMMENT ON COLUMN media.id IS 'Unique identifier for the media record';
COMMENT ON COLUMN media.user_id IS 'Reference to the user who owns this media';
COMMENT ON COLUMN media.type IS 'Type of media: image or video';
COMMENT ON COLUMN media.original_path IS 'Storage path to the original uploaded file';
COMMENT ON COLUMN media.status IS 'Processing status: queued, processing, ready, or failed';
COMMENT ON COLUMN media.width IS 'Width in pixels (extracted from media metadata)';
COMMENT ON COLUMN media.height IS 'Height in pixels (extracted from media metadata)';
COMMENT ON COLUMN media.duration IS 'Duration in seconds (for videos only)';
COMMENT ON COLUMN media.variants IS 'JSONB object containing URLs and metadata for all generated variants';
COMMENT ON COLUMN media.error_message IS 'Error message if processing failed';
COMMENT ON COLUMN media.created_at IS 'Timestamp when the media record was created';
COMMENT ON COLUMN media.updated_at IS 'Timestamp when the media record was last updated (auto-updated by trigger)';
