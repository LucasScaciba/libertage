-- Add INSERT policy for boosts table
-- This allows authenticated users to create boosts for their own profiles

CREATE POLICY "Providers can create own boosts"
  ON boosts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = boosts.profile_id
      AND profiles.user_id = auth.uid()
    )
  );
