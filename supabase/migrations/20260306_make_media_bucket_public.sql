-- Make media bucket public to allow service_role access
-- This is necessary because when clients upload directly to storage,
-- the files get owner = user_id, and even service_role cannot access
-- them in a private bucket. Making it public allows the worker to
-- download and process the files.

UPDATE storage.buckets
SET public = true
WHERE name = 'media';
