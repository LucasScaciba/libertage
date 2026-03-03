-- Update plan limits to match new requirements
-- Free: 4 photos, 0 videos
-- Premium: 8 photos, 2 videos  
-- Black: 12 photos, 4 videos

UPDATE plans 
SET max_photos = 4, max_videos = 0
WHERE code = 'free';

UPDATE plans
SET max_photos = 8, max_videos = 2
WHERE code = 'premium';

UPDATE plans
SET max_photos = 12, max_videos = 4
WHERE code = 'black';
