-- Add tagline field to profiles table
-- Migration file: 20250629212751_add_profile_tagline.sql

-- Add tagline column to profiles table
-- Tagline is a short, catchy phrase that describes the user (60 characters max)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tagline varchar(60);

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.tagline IS 'Short tagline or motto for the profile (max 60 characters)';