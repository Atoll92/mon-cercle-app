-- Add social links support to profiles table
-- Allows users to add up to 5 social media links

-- Add social_links jsonb column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '[]'::jsonb;

-- Add constraint to ensure social_links is an array with max 5 items
ALTER TABLE profiles ADD CONSTRAINT social_links_max_items CHECK (
  jsonb_array_length(COALESCE(social_links, '[]'::jsonb)) <= 5
);

-- Create index for better performance when searching by social links
CREATE INDEX IF NOT EXISTS idx_profiles_social_links ON profiles USING gin (social_links);

-- Update RLS policies (no changes needed as existing policies cover profile updates)

-- Comment for documentation
COMMENT ON COLUMN profiles.social_links IS 'Array of social media links (max 5). Each item should have: {platform: string, url: string, label?: string}';