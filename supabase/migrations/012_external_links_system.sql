-- Migration: External Links System (Linktree-style)
-- Description: Creates external_links table with RLS policies for managing social media and external links on profiles
-- Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8

-- Create external_links table
CREATE TABLE IF NOT EXISTS external_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  url TEXT NOT NULL,
  display_order INTEGER NOT NULL,
  icon_key VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_profile_display_order UNIQUE (profile_id, display_order),
  CONSTRAINT valid_url_length CHECK (LENGTH(url) <= 2048),
  CONSTRAINT valid_title_length CHECK (LENGTH(title) >= 1 AND LENGTH(title) <= 100)
);

-- Create index for efficient querying by profile and order
CREATE INDEX idx_external_links_profile_order ON external_links(profile_id, display_order);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_external_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_external_links_updated_at
  BEFORE UPDATE ON external_links
  FOR EACH ROW
  EXECUTE FUNCTION update_external_links_updated_at();

-- Enable Row Level Security
ALTER TABLE external_links ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Professionals can read their own external links
CREATE POLICY "Users can read their own external links"
  ON external_links
  FOR SELECT
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Professionals can insert external links for their own profile
CREATE POLICY "Users can insert external links for their own profile"
  ON external_links
  FOR INSERT
  WITH CHECK (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Professionals can update their own external links
CREATE POLICY "Users can update their own external links"
  ON external_links
  FOR UPDATE
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Professionals can delete their own external links
CREATE POLICY "Users can delete their own external links"
  ON external_links
  FOR DELETE
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Public read access for published profiles
CREATE POLICY "Public can read external links for published profiles"
  ON external_links
  FOR SELECT
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE status = 'published'
    )
  );

-- Add comment to table
COMMENT ON TABLE external_links IS 'Stores external links (social media, websites) for professional profiles with Linktree-style functionality';
COMMENT ON COLUMN external_links.profile_id IS 'Reference to the profile that owns this link';
COMMENT ON COLUMN external_links.title IS 'Display text for the link (1-100 characters)';
COMMENT ON COLUMN external_links.url IS 'Target URL (must be valid HTTP/HTTPS, max 2048 characters)';
COMMENT ON COLUMN external_links.display_order IS 'Position in the list (unique per profile)';
COMMENT ON COLUMN external_links.icon_key IS 'Icon identifier for rendering (instagram, whatsapp, linkedin, etc.)';
