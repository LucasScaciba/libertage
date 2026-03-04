-- RLS Policies for Stories System

-- Enable RLS on stories tables
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_reports ENABLE ROW LEVEL SECURITY;

-- Stories policies
-- Anyone can view active stories
CREATE POLICY "Anyone can view active stories"
  ON stories FOR SELECT
  USING (status = 'active' AND expires_at > NOW());

-- Users can insert their own stories
CREATE POLICY "Users can create their own stories"
  ON stories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own stories (for deletion)
CREATE POLICY "Users can update their own stories"
  ON stories FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own stories
CREATE POLICY "Users can delete their own stories"
  ON stories FOR DELETE
  USING (auth.uid() = user_id);

-- Story views policies
-- Anyone can view story views (for analytics)
CREATE POLICY "Anyone can view story views"
  ON story_views FOR SELECT
  USING (true);

-- Anyone can insert story views
CREATE POLICY "Anyone can insert story views"
  ON story_views FOR INSERT
  WITH CHECK (true);

-- Story reports policies
-- Anyone can view reports (admins will filter in app logic)
CREATE POLICY "Anyone can view story reports"
  ON story_reports FOR SELECT
  USING (true);

-- Anyone can create reports
CREATE POLICY "Anyone can create story reports"
  ON story_reports FOR INSERT
  WITH CHECK (true);

-- Only admins can update reports (handled in app logic)
CREATE POLICY "Admins can update story reports"
  ON story_reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'moderator')
    )
  );
