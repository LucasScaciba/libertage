-- ============================================================================
-- Update Analytics Functions for New Media Structure
-- ============================================================================
-- This migration updates the analytics RPC functions to work with the new
-- media_processing table instead of the old media table.
--
-- Changes:
-- 1. Update get_media_views() to use media_processing table
-- 2. Update get_story_views() to use new media structure
-- ============================================================================

-- Function: Get Media Views (Updated for media_processing table)
CREATE OR REPLACE FUNCTION get_media_views(p_profile_id UUID)
RETURNS TABLE (
  media_id UUID,
  thumbnail_url TEXT,
  filename TEXT,
  media_type TEXT,
  view_count BIGINT
) AS $func$
BEGIN
  RETURN QUERY
  SELECT 
    mp.id as media_id,
    COALESCE(
      mp.variants->'thumb_240'->>'url',
      mp.variants->'original'->>'url'
    ) as thumbnail_url,
    mp.original_path as filename,
    mp.type as media_type,
    COUNT(ae.id) as view_count
  FROM media_processing mp
  LEFT JOIN analytics_events ae ON 
    ae.event_type = 'media_view' 
    AND ae.metadata->>'media_id' = mp.id::text
    AND ae.profile_id = p_profile_id
  WHERE mp.profile_id = p_profile_id
    AND mp.status = 'ready'
  GROUP BY mp.id, mp.variants, mp.original_path, mp.type
  HAVING COUNT(ae.id) > 0
  ORDER BY view_count DESC
  LIMIT 10;
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get Story Views (Updated for new media structure)
CREATE OR REPLACE FUNCTION get_story_views(p_profile_id UUID)
RETURNS TABLE (
  story_id UUID,
  thumbnail_url TEXT,
  video_url TEXT,
  view_count BIGINT
) AS $func$
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
    AND s.expires_at > NOW()
    AND s.deleted_at IS NULL
  GROUP BY s.id, s.thumbnail_url, s.video_url
  HAVING COUNT(ae.id) > 0
  ORDER BY view_count DESC
  LIMIT 10;
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on updated functions
GRANT EXECUTE ON FUNCTION get_media_views(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_story_views(UUID) TO authenticated;

-- ============================================================================
-- Migration Complete
-- ============================================================================
