-- Stories RLS Policies Migration
-- Adds Row Level Security policies for stories, story_views, and story_reports tables

-- Enable RLS on stories tables
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_reports ENABLE ROW LEVEL SECURITY;

-- Stories table policies
-- Allow users to read their own stories
CREATE POLICY "Users can read their own stories"
  ON stories
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own stories
CREATE POLICY "Users can insert their own stories"
  ON stories
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own stories
CREATE POLICY "Users can update their own stories"
  ON stories
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own stories
CREATE POLICY "Users can delete their own stories"
  ON stories
  FOR DELETE
  USING (auth.uid() = user_id);

-- Allow public to read active stories (for catalog)
CREATE POLICY "Public can read active stories"
  ON stories
  FOR SELECT
  USING (status = 'active');

-- Story views policies
-- Allow authenticated users to insert views
CREATE POLICY "Authenticated users can insert story views"
  ON story_views
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to read views on their own stories
CREATE POLICY "Users can read views on their stories"
  ON story_views
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = story_views.story_id
      AND stories.user_id = auth.uid()
    )
  );

-- Story reports policies
-- Allow authenticated users to insert reports
CREATE POLICY "Authenticated users can insert story reports"
  ON story_reports
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to read reports on their own stories
CREATE POLICY "Users can read reports on their stories"
  ON story_reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = story_reports.story_id
      AND stories.user_id = auth.uid()
    )
  );

-- Comments
COMMENT ON POLICY "Users can read their own stories" ON stories IS 'Allows users to view their own stories';
COMMENT ON POLICY "Public can read active stories" ON stories IS 'Allows anyone to view active stories in the catalog';
