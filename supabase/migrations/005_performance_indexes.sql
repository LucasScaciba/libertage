-- Additional performance indexes for optimized queries

-- Composite index for catalog queries with filters
-- Helps with queries filtering by status + category + city + region
CREATE INDEX IF NOT EXISTS idx_profiles_catalog_filters 
ON profiles(status, category, city, region) 
WHERE status = 'published';

-- Composite index for boost queries
-- Helps with finding active boosts by context and time range
CREATE INDEX IF NOT EXISTS idx_boosts_active_context 
ON boosts(boost_context, status, start_time, end_time) 
WHERE status IN ('scheduled', 'active');

-- Composite index for analytics aggregation by profile and event type
-- Helps with counting visits and clicks per profile
CREATE INDEX IF NOT EXISTS idx_analytics_profile_type_created 
ON analytics_events(profile_id, event_type, created_at DESC);

-- Index for subscription status queries
-- Helps with finding active subscriptions per user
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status 
ON subscriptions(user_id, status) 
WHERE status = 'active';

-- Index for reports by status
-- Helps admin queries filtering by report status
CREATE INDEX IF NOT EXISTS idx_reports_status_created 
ON reports(status, created_at DESC);

-- Partial index for published profiles updated recently
-- Helps with catalog "recently updated" sorting
CREATE INDEX IF NOT EXISTS idx_profiles_published_updated 
ON profiles(updated_at DESC) 
WHERE status = 'published';

-- Comment explaining the indexes
COMMENT ON INDEX idx_profiles_catalog_filters IS 'Optimizes catalog search with multiple filters';
COMMENT ON INDEX idx_boosts_active_context IS 'Optimizes boost capacity checks and active boost queries';
COMMENT ON INDEX idx_analytics_profile_type_created IS 'Optimizes analytics aggregation queries';
COMMENT ON INDEX idx_subscriptions_user_status IS 'Optimizes active subscription lookups';
COMMENT ON INDEX idx_reports_status_created IS 'Optimizes admin report filtering';
COMMENT ON INDEX idx_profiles_published_updated IS 'Optimizes catalog sorting by recent updates';
