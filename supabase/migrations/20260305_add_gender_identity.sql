-- Add gender_identity column to profiles table
ALTER TABLE profiles
ADD COLUMN gender_identity TEXT NOT NULL DEFAULT 'Mulher'
CHECK (gender_identity IN ('Mulher', 'Homem', 'Trans', 'Casal'));

-- Update existing profiles to have 'Mulher' as default
UPDATE profiles
SET gender_identity = 'Mulher'
WHERE gender_identity IS NULL;

-- Add comment
COMMENT ON COLUMN profiles.gender_identity IS 'Gender identity for filtering (Mulher, Homem, Trans, Casal)';
