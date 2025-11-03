-- Rename profiles.username to profiles.moodboard_slug for clarity
-- The field is only used for generating user-friendly moodboard URLs like /micro/:moodboard_slug

-- Step 1: Rename the column
ALTER TABLE profiles
  RENAME COLUMN username TO moodboard_slug;

-- Step 2: Rename the unique constraint
ALTER TABLE profiles
  RENAME CONSTRAINT profiles_username_key TO profiles_moodboard_slug_key;

-- Step 3: Rename the index
ALTER INDEX idx_profiles_username RENAME TO idx_profiles_moodboard_slug;

-- Step 4: Update the view that references this column
DROP VIEW IF EXISTS micro_conclav_pages;

CREATE VIEW micro_conclav_pages AS
SELECT
  p.id AS user_id,
  p.moodboard_slug,
  p.full_name,
  p.bio,
  p.profile_picture_url,
  m.id AS moodboard_id,
  m.title,
  m.description,
  m.background_color,
  m.created_at,
  m.updated_at
FROM profiles p
LEFT JOIN moodboards m ON m.created_by = p.id;

-- Step 5: Add comment to document the purpose
COMMENT ON COLUMN profiles.moodboard_slug IS 'URL-friendly slug for accessing user moodboards via /micro/:moodboard_slug';
