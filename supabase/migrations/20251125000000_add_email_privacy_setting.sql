-- Add email visibility privacy setting to profiles table
-- This allows users to control whether their contact email is visible to other members

-- Add email_public column to profiles table (default to false for privacy-first approach)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS email_public boolean DEFAULT false;

-- Add comment to describe the column
COMMENT ON COLUMN profiles.email_public IS 'Controls whether the contact_email is visible to other network members. Default is false (private).';

-- Update existing profiles to hide email by default (privacy-first)
UPDATE profiles
SET email_public = false
WHERE email_public IS NULL;

-- Make the column NOT NULL after setting defaults
ALTER TABLE profiles
ALTER COLUMN email_public SET NOT NULL;

-- Create an index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_email_public ON profiles(email_public);
