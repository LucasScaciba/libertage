-- ============================================
-- EXECUTE ESTE SQL NO SUPABASE DASHBOARD
-- SQL Editor > New Query > Cole e Execute
-- ============================================

-- Step 1: Add new columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birthdate DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS service_categories JSONB DEFAULT '[]';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS buttocks_type TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS buttocks_size TEXT;

-- Step 2: Migrate existing age_attribute to birthdate
-- Calculate approximate birthdate from age (use January 1st of birth year)
UPDATE profiles
SET birthdate = DATE(CONCAT((EXTRACT(YEAR FROM NOW()) - age_attribute)::TEXT, '-01-01'))
WHERE age_attribute IS NOT NULL AND birthdate IS NULL;

-- Step 3: Migrate existing services from selected_features to service_categories
-- Extract service categories from selected_features array
UPDATE profiles
SET service_categories = (
  SELECT jsonb_agg(feature)
  FROM jsonb_array_elements_text(selected_features) AS feature
  WHERE feature IN ('Massagem', 'Acompanhante', 'Chamada de vídeo')
)
WHERE selected_features IS NOT NULL 
  AND jsonb_array_length(selected_features) > 0
  AND service_categories = '[]';

-- Step 4: Remove service categories from selected_features
UPDATE profiles
SET selected_features = (
  SELECT COALESCE(jsonb_agg(feature), '[]'::jsonb)
  FROM jsonb_array_elements_text(selected_features) AS feature
  WHERE feature NOT IN ('Massagem', 'Acompanhante', 'Chamada de vídeo')
)
WHERE selected_features IS NOT NULL;

-- Step 5: Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_profiles_birthdate ON profiles(birthdate);
CREATE INDEX IF NOT EXISTS idx_profiles_service_categories ON profiles USING GIN(service_categories);

-- Step 6: Add check constraint for birthdate age range (18-60 years)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS check_birthdate_age;
ALTER TABLE profiles ADD CONSTRAINT check_birthdate_age 
  CHECK (
    birthdate IS NULL OR (
      EXTRACT(YEAR FROM AGE(birthdate)) >= 18 AND 
      EXTRACT(YEAR FROM AGE(birthdate)) <= 60
    )
  );

-- Step 7: Add comments for documentation
COMMENT ON COLUMN profiles.birthdate IS 'User birthdate for age calculation (replaces age_attribute)';
COMMENT ON COLUMN profiles.service_categories IS 'Array of service categories (Massagem, Acompanhante, Chamada de vídeo)';
COMMENT ON COLUMN profiles.buttocks_type IS 'Buttocks type characteristic (Natural, Com Silicone)';
COMMENT ON COLUMN profiles.buttocks_size IS 'Buttocks size characteristic (Pequeno, Médio, Grande)';

-- Verification query (run this after to confirm)
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles' AND column_name IN ('birthdate', 'service_categories', 'buttocks_type', 'buttocks_size');
