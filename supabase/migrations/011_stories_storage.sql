-- Storage bucket for stories
-- Note: This needs to be executed in Supabase dashboard or via API
-- as storage buckets are not created via SQL migrations

-- Create storage bucket (execute in Supabase dashboard)
-- Bucket name: stories
-- Public: true
-- File size limit: 18 MB
-- Allowed MIME types: video/mp4, video/quicktime, video/x-msvideo, image/jpeg, image/png

-- Storage policies for stories bucket
-- Allow authenticated users to upload
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'stories',
  'stories',
  true,
  18874368, -- 18 MB
  ARRAY['video/mp4', 'video/quicktime', 'video/x-msvideo', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Anyone can view files (public bucket)
CREATE POLICY "Anyone can view story files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'stories');

-- Policy: Authenticated users can upload their own files
CREATE POLICY "Users can upload their own story files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'stories' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can update their own files
CREATE POLICY "Users can update their own story files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'stories' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete their own story files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'stories' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
