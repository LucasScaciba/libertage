-- Add profile-related fields to media_processing table
-- This allows media to be linked to profiles and marked as cover photos

-- Add profile_id column (nullable for backward compatibility)
ALTER TABLE media_processing
ADD COLUMN profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- Add is_cover column (default false)
ALTER TABLE media_processing
ADD COLUMN is_cover BOOLEAN DEFAULT false;

-- Add sort_order column for display ordering
ALTER TABLE media_processing
ADD COLUMN sort_order INTEGER DEFAULT 0;

-- Create index on profile_id for faster queries
CREATE INDEX IF NOT EXISTS idx_media_processing_profile_id ON media_processing(profile_id);

-- Create index on is_cover for faster cover photo queries
CREATE INDEX IF NOT EXISTS idx_media_processing_is_cover ON media_processing(profile_id, is_cover) WHERE is_cover = true;

-- Create index on sort_order for ordered queries
CREATE INDEX IF NOT EXISTS idx_media_processing_sort_order ON media_processing(profile_id, sort_order);

-- Update RLS policies to include profile_id
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own media" ON media_processing;
DROP POLICY IF EXISTS "Users can insert their own media" ON media_processing;
DROP POLICY IF EXISTS "Users can update their own media" ON media_processing;
DROP POLICY IF EXISTS "Users can delete their own media" ON media_processing;

-- Recreate policies with profile_id support
CREATE POLICY "Users can view their own media"
  ON media_processing
  FOR SELECT
  USING (
    auth.uid() = user_id
  );

CREATE POLICY "Users can insert their own media"
  ON media_processing
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
  );

CREATE POLICY "Users can update their own media"
  ON media_processing
  FOR UPDATE
  USING (
    auth.uid() = user_id
  )
  WITH CHECK (
    auth.uid() = user_id
  );

CREATE POLICY "Users can delete their own media"
  ON media_processing
  FOR DELETE
  USING (
    auth.uid() = user_id
  );

-- Add comment
COMMENT ON COLUMN media_processing.profile_id IS 'Links media to a specific profile for gallery display';
COMMENT ON COLUMN media_processing.is_cover IS 'Marks this media as the cover photo/video for the profile';
COMMENT ON COLUMN media_processing.sort_order IS 'Display order in the gallery (lower numbers first)';
