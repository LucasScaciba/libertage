-- Create storage bucket for stories
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'stories',
  'stories',
  true,
  18874368, -- 18 MB
  ARRAY['video/mp4', 'video/quicktime', 'video/x-msvideo', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view stories (public bucket)
CREATE POLICY "Stories are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'stories');

-- Policy: Authenticated users can upload their own stories
CREATE POLICY "Users can upload their own stories"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'stories' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own stories
CREATE POLICY "Users can update their own stories"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'stories'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own stories
CREATE POLICY "Users can delete their own stories"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'stories'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
