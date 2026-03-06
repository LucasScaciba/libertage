-- Add public read access to media_processing for published profiles
-- This allows unauthenticated users to view media from published profiles

-- Drop existing public access policy if it exists
DROP POLICY IF EXISTS "Public can view media from published profiles" ON media_processing;

-- Create policy for public read access to media from published profiles
CREATE POLICY "Public can view media from published profiles"
  ON media_processing FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = media_processing.profile_id
      AND profiles.status = 'published'
    )
  );

-- Add comment
COMMENT ON POLICY "Public can view media from published profiles" ON media_processing IS 
'Allows anyone (including unauthenticated users) to view media from profiles with status = published';
