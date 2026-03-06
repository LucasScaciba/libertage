-- Add HEIC/HEIF support to media bucket
-- HEIC is the image format used by Apple devices (iPhone, iPad)

UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'video/webm',
  'application/vnd.apple.mpegurl',
  'video/mp2t'
]
WHERE id = 'media';
