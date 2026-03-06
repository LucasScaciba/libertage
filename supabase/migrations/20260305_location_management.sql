-- Migration: Add location management fields to profiles table
-- Feature: location-management
-- Date: 2026-03-05

-- Add location fields to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS has_no_location BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS address_cep VARCHAR(8),
ADD COLUMN IF NOT EXISTS address_street TEXT,
ADD COLUMN IF NOT EXISTS address_neighborhood TEXT,
ADD COLUMN IF NOT EXISTS address_city TEXT,
ADD COLUMN IF NOT EXISTS address_state VARCHAR(2),
ADD COLUMN IF NOT EXISTS address_number TEXT;

-- Add check constraint for valid Brazilian state codes in address_state
ALTER TABLE profiles
ADD CONSTRAINT check_address_state_valid 
CHECK (
  address_state IS NULL OR 
  address_state IN (
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 
    'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 
    'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  )
);

-- Add check constraint for city (Estado Base) - ensure it's never null or empty
-- Note: This constraint may fail if existing records have null/empty city values
-- In that case, update existing records first before adding the constraint
DO $$
BEGIN
  -- Try to add the constraint
  ALTER TABLE profiles
  ADD CONSTRAINT check_city_not_null 
  CHECK (city IS NOT NULL AND city != '');
EXCEPTION
  WHEN check_violation THEN
    -- If constraint fails, log a warning
    RAISE WARNING 'Cannot add check_city_not_null constraint - existing records have null/empty city values. Please update existing records first.';
END $$;

-- Add index for address_state for filtering performance
CREATE INDEX IF NOT EXISTS idx_profiles_address_state ON profiles(address_state);

-- Add comments for clarity
COMMENT ON COLUMN profiles.city IS 'Estado Base - used as fallback when address_state is not available';
COMMENT ON COLUMN profiles.address_state IS 'State from complete address - takes priority over city for filtering';
COMMENT ON COLUMN profiles.has_no_location IS 'Flag indicating user does not have a physical service location';
COMMENT ON COLUMN profiles.address_cep IS 'CEP (Brazilian postal code) - 8 digits';
COMMENT ON COLUMN profiles.address_street IS 'Street name from complete address';
COMMENT ON COLUMN profiles.address_neighborhood IS 'Neighborhood from complete address';
COMMENT ON COLUMN profiles.address_city IS 'City from complete address';
COMMENT ON COLUMN profiles.address_number IS 'Street number from complete address';
