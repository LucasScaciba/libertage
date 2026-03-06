-- Allow service role to access all media files
-- This is needed for the worker to process uploaded media

-- Storage Policy: Service role can read all media
CREATE POLICY "Service role can read all media"
  ON storage.objects FOR SELECT
  TO service_role
  USING (bucket_id = 'media');

-- Storage Policy: Service role can insert all media
CREATE POLICY "Service role can insert all media"
  ON storage.objects FOR INSERT
  TO service_role
  WITH CHECK (bucket_id = 'media');

-- Storage Policy: Service role can update all media
CREATE POLICY "Service role can update all media"
  ON storage.objects FOR UPDATE
  TO service_role
  USING (bucket_id = 'media');

-- Storage Policy: Service role can delete all media
CREATE POLICY "Service role can delete all media"
  ON storage.objects FOR DELETE
  TO service_role
  USING (bucket_id = 'media');
