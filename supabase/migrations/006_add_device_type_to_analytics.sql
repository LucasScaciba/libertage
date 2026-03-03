-- Add device_type column to analytics_events table
ALTER TABLE analytics_events 
ADD COLUMN device_type TEXT CHECK (device_type IN ('mobile', 'desktop', 'tablet'));

-- Create index for device_type queries
CREATE INDEX idx_analytics_device_type ON analytics_events(device_type);

-- Create composite index for common queries (profile + date + device)
CREATE INDEX idx_analytics_profile_date_device 
ON analytics_events(profile_id, created_at DESC, device_type);
