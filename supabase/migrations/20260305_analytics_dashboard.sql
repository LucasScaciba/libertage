-- ============================================================================
-- Analytics Dashboard Migration
-- ============================================================================
-- This migration extends the analytics system to support the dashboard with
-- 7 integrated indicators.
--
-- Changes:
-- 1. Extend analytics_events table with metadata JSONB field
-- 2. Add new event types to CHECK constraint
-- 3. Create ip_geolocation_cache table
-- 4. Add performance indexes
-- 5. Create data retention policy
-- ============================================================================

-- Step 1: Add metadata column to analytics_events (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'analytics_events' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE analytics_events ADD COLUMN metadata JSONB DEFAULT '{}';
  END IF;
END $$;

-- Step 2: Update event_type CHECK constraint to include new types
ALTER TABLE analytics_events DROP CONSTRAINT IF EXISTS analytics_events_event_type_check;

ALTER TABLE analytics_events ADD CONSTRAINT analytics_events_event_type_check
  CHECK (event_type IN (
    'profile_view',
    'media_view',
    'social_link_click',
    'story_view',
    'contact_click'
  ));

-- Step 3: Create ip_geolocation_cache table
CREATE TABLE IF NOT EXISTS ip_geolocation_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL UNIQUE,
  state TEXT NOT NULL,
  country TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 4: Create indexes for performance

-- Composite index for dashboard queries
CREATE INDEX IF NOT EXISTS idx_analytics_profile_event_created 
  ON analytics_events(profile_id, event_type, created_at DESC);

-- GIN indexes for JSONB metadata queries
CREATE INDEX IF NOT EXISTS idx_analytics_metadata_media_id 
  ON analytics_events USING GIN ((metadata->'media_id'));

CREATE INDEX IF NOT EXISTS idx_analytics_metadata_story_id 
  ON analytics_events USING GIN ((metadata->'story_id'));

CREATE INDEX IF NOT EXISTS idx_analytics_metadata_social_network 
  ON analytics_events USING GIN ((metadata->'social_network'));

CREATE INDEX IF NOT EXISTS idx_analytics_metadata_state 
  ON analytics_events USING GIN ((metadata->'state'));

CREATE INDEX IF NOT EXISTS idx_analytics_metadata_contact_channel 
  ON analytics_events USING GIN ((metadata->'contact_channel'));

-- Index for IP cache lookups
CREATE INDEX IF NOT EXISTS idx_ip_cache_ip 
  ON ip_geolocation_cache(ip_address);

CREATE INDEX IF NOT EXISTS idx_ip_cache_created 
  ON ip_geolocation_cache(created_at DESC);

-- Step 5: Create function for data retention policy
CREATE OR REPLACE FUNCTION cleanup_old_analytics_events()
RETURNS void AS $$
BEGIN
  -- Delete analytics events older than 12 months
  DELETE FROM analytics_events 
  WHERE created_at < NOW() - INTERVAL '12 months';
  
  -- Delete IP cache entries older than 30 days
  DELETE FROM ip_geolocation_cache 
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Step 6: Add comment documentation
COMMENT ON TABLE analytics_events IS 'Unified analytics events table for all tracking across the platform';
COMMENT ON COLUMN analytics_events.metadata IS 'JSONB field containing event-specific data (media_id, story_id, social_network, contact_channel, state, etc.)';
COMMENT ON TABLE ip_geolocation_cache IS 'Cache for IP to state geolocation lookups to reduce external API calls';

-- Step 7: Grant permissions and RLS policies
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ip_geolocation_cache ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own analytics
DROP POLICY IF EXISTS "Users can read own analytics" ON analytics_events;
CREATE POLICY "Users can read own analytics" ON analytics_events
  FOR SELECT
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Policy: Service role can insert analytics events
DROP POLICY IF EXISTS "Service role can insert analytics" ON analytics_events;
CREATE POLICY "Service role can insert analytics" ON analytics_events
  FOR INSERT
  WITH CHECK (true);

-- Policy: Service role can manage IP cache
DROP POLICY IF EXISTS "Service role can manage IP cache" ON ip_geolocation_cache;
CREATE POLICY "Service role can manage IP cache" ON ip_geolocation_cache
  FOR ALL
  USING (true);

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- ============================================================================
-- Step 8: Create RPC Functions for Dashboard Queries
-- ============================================================================

-- Function: Get Media Views
CREATE OR REPLACE FUNCTION get_media_views(p_profile_id UUID)
RETURNS TABLE (
  media_id UUID,
  thumbnail_url TEXT,
  filename TEXT,
  media_type TEXT,
  view_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id as media_id,
    m.public_url as thumbnail_url,
    m.storage_path as filename,
    m.type as media_type,
    COUNT(ae.id) as view_count
  FROM media m
  LEFT JOIN analytics_events ae ON 
    ae.event_type = 'media_view' 
    AND ae.metadata->>'media_id' = m.id::text
    AND ae.profile_id = p_profile_id
  WHERE m.profile_id = p_profile_id
  GROUP BY m.id, m.public_url, m.storage_path, m.type
  ORDER BY view_count DESC
  LIMIT 3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get Social Clicks
CREATE OR REPLACE FUNCTION get_social_clicks(p_profile_id UUID)
RETURNS TABLE (
  social_network TEXT,
  click_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ae.metadata->>'social_network' as social_network,
    COUNT(ae.id) as click_count
  FROM analytics_events ae
  WHERE ae.profile_id = p_profile_id
    AND ae.event_type = 'social_link_click'
  GROUP BY ae.metadata->>'social_network'
  ORDER BY click_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get Story Views
CREATE OR REPLACE FUNCTION get_story_views(p_profile_id UUID)
RETURNS TABLE (
  story_id UUID,
  thumbnail_url TEXT,
  video_url TEXT,
  view_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as story_id,
    s.thumbnail_url,
    s.video_url,
    COUNT(ae.id) as view_count
  FROM stories s
  LEFT JOIN analytics_events ae ON 
    ae.event_type = 'story_view' 
    AND ae.metadata->>'story_id' = s.id::text
    AND ae.profile_id = p_profile_id
  WHERE s.user_id = (SELECT user_id FROM profiles WHERE id = p_profile_id)
  GROUP BY s.id, s.thumbnail_url, s.video_url
  ORDER BY view_count DESC
  LIMIT 3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get Visits by Day of Week
CREATE OR REPLACE FUNCTION get_visits_by_day(p_profile_id UUID)
RETURNS TABLE (
  day_of_week INTEGER,
  visit_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXTRACT(DOW FROM created_at)::INTEGER as day_of_week,
    COUNT(*) as visit_count
  FROM analytics_events
  WHERE profile_id = p_profile_id
    AND event_type = 'visit'
    AND created_at >= NOW() - INTERVAL '90 days'
  GROUP BY day_of_week
  ORDER BY day_of_week;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get Visits by State
CREATE OR REPLACE FUNCTION get_visits_by_state(p_profile_id UUID)
RETURNS TABLE (
  state TEXT,
  visit_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    metadata->>'state' as state,
    COUNT(*) as visit_count
  FROM analytics_events
  WHERE profile_id = p_profile_id
    AND event_type = 'visit'
    AND created_at >= NOW() - INTERVAL '90 days'
    AND metadata->>'state' IS NOT NULL
  GROUP BY metadata->>'state'
  ORDER BY visit_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get Visibility Rank
CREATE OR REPLACE FUNCTION get_visibility_rank(p_profile_id UUID)
RETURNS TABLE (
  percentile NUMERIC,
  category TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH profile_visits AS (
    SELECT 
      profile_id,
      COUNT(*) as visit_count
    FROM analytics_events
    WHERE event_type = 'profile_view'
      AND created_at >= NOW() - INTERVAL '30 days'
    GROUP BY profile_id
  ),
  ranked_profiles AS (
    SELECT 
      profile_id,
      visit_count,
      PERCENT_RANK() OVER (ORDER BY visit_count DESC) * 100 as percentile
    FROM profile_visits
  )
  SELECT 
    rp.percentile,
    CASE 
      WHEN rp.percentile <= 10 THEN 'top_10'
      WHEN rp.percentile <= 20 THEN 'top_20'
      WHEN rp.percentile <= 30 THEN 'top_30'
      ELSE 'below_30'
    END as category
  FROM ranked_profiles rp
  WHERE rp.profile_id = p_profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get Contact Channels
CREATE OR REPLACE FUNCTION get_contact_channels(p_profile_id UUID)
RETURNS TABLE (
  channel TEXT,
  contact_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    contact_method as channel,
    COUNT(*) as contact_count
  FROM analytics_events
  WHERE profile_id = p_profile_id
    AND event_type = 'contact_click'
    AND contact_method IS NOT NULL
  GROUP BY contact_method
  ORDER BY contact_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_media_views(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_social_clicks(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_story_views(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_visits_by_day(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_visits_by_state(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_visibility_rank(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_contact_channels(UUID) TO authenticated;

-- ============================================================================
-- RPC Functions Complete
-- ============================================================================
