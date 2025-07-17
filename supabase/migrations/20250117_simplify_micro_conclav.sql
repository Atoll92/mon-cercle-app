-- Migration: Simplify Micro Conclav/Moodboard System
-- Date: 2025-01-17
-- Description: Make moodboards and micro conclav the same thing, one per user, always public

-- Step 0: Drop any triggers and functions that depend on columns we're removing
-- Drop all triggers on moodboards table first
DROP TRIGGER IF EXISTS set_personal_moodboard_defaults_trigger ON moodboards;
DROP TRIGGER IF EXISTS before_insert_moodboard ON moodboards;
DROP TRIGGER IF EXISTS before_update_moodboard ON moodboards;

-- Drop related functions
DROP FUNCTION IF EXISTS set_personal_moodboard_defaults() CASCADE;
DROP FUNCTION IF EXISTS validate_moodboard_permissions() CASCADE;
DROP FUNCTION IF EXISTS check_moodboard_permissions() CASCADE;

-- Step 1: Drop all existing RLS policies that depend on permissions column
DROP POLICY IF EXISTS "view_public_moodboards_policy" ON moodboards;
DROP POLICY IF EXISTS "view_collaborative_moodboards_policy" ON moodboards;
DROP POLICY IF EXISTS "Users can manage their moodboards" ON moodboards;
DROP POLICY IF EXISTS "view_moodboard_items_policy" ON moodboard_items;
DROP POLICY IF EXISTS "insert_moodboard_items_policy" ON moodboard_items;
DROP POLICY IF EXISTS "update_moodboard_items_policy" ON moodboard_items;
DROP POLICY IF EXISTS "delete_moodboard_items_policy" ON moodboard_items;

-- Also drop any other policies that might exist
DROP POLICY IF EXISTS "Users can view any moodboard" ON moodboards;
DROP POLICY IF EXISTS "Users can create their own moodboards" ON moodboards;
DROP POLICY IF EXISTS "Users can update their own moodboards" ON moodboards;
DROP POLICY IF EXISTS "Users can delete their own moodboards" ON moodboards;
DROP POLICY IF EXISTS "Anyone can view moodboard items" ON moodboard_items;
DROP POLICY IF EXISTS "Users can manage their own moodboard items" ON moodboard_items;

-- Drop policies that depend on is_personal column
DROP POLICY IF EXISTS "view_personal_moodboards_policy" ON moodboards;
DROP POLICY IF EXISTS "update_personal_moodboards_policy" ON moodboards;
DROP POLICY IF EXISTS "delete_personal_moodboards_policy" ON moodboards;

-- Step 2: Now we can safely remove the permissions column from moodboards table
ALTER TABLE moodboards DROP COLUMN IF EXISTS permissions;

-- Step 3: Remove the is_personal column (all moodboards are now personal micro conclav pages)
ALTER TABLE moodboards DROP COLUMN IF EXISTS is_personal;

-- Step 4: Add username to profiles table if it doesn't exist (for cleaner URLs)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username text UNIQUE;

-- Step 5: Create an index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Step 6: Delete duplicate moodboards, keeping only the most recent one per user
-- First, let's identify and delete duplicates more carefully
WITH ranked_moodboards AS (
    SELECT id, created_by, created_at,
           ROW_NUMBER() OVER (PARTITION BY created_by ORDER BY created_at DESC) as rn
    FROM moodboards
)
DELETE FROM moodboards
WHERE id IN (
    SELECT id FROM ranked_moodboards WHERE rn > 1
);

-- Step 7: Now we can safely add a unique constraint to ensure one moodboard per user
ALTER TABLE moodboards ADD CONSTRAINT unique_user_moodboard UNIQUE (created_by);

-- Step 8: First, alter the network_id column to allow NULL values
ALTER TABLE moodboards ALTER COLUMN network_id DROP NOT NULL;

-- Step 9: Update all network_id to NULL since micro conclav pages don't belong to networks
UPDATE moodboards 
SET network_id = NULL 
WHERE network_id IS NOT NULL;

-- Step 10: Add a check constraint to ensure network_id is always NULL for micro conclav
ALTER TABLE moodboards ADD CONSTRAINT micro_conclav_no_network CHECK (network_id IS NULL);

-- Step 11: Create a function to automatically create a moodboard for new users
CREATE OR REPLACE FUNCTION create_user_micro_conclav()
RETURNS TRIGGER AS $$
BEGIN
    -- Create a default moodboard for the new profile
    -- NEW.id is the profile ID, NEW.user_id is the auth user ID
    INSERT INTO moodboards (
        id,
        created_by,
        title,
        description,
        background_color,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        NEW.id,  -- This is the profile ID
        'My Micro Conclav',
        'Welcome to my personal space',
        '#f5f5f5',
        NOW(),
        NOW()
    ) ON CONFLICT (created_by) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 12: Create trigger to auto-create moodboard for new profiles
DROP TRIGGER IF EXISTS create_micro_conclav_on_profile ON profiles;
CREATE TRIGGER create_micro_conclav_on_profile
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION create_user_micro_conclav();

-- Step 13: Create moodboards for existing users who don't have one
INSERT INTO moodboards (
    id,
    created_by,
    title,
    description,
    background_color,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    p.id,
    'My Micro Conclav',
    'Welcome to my personal space',
    '#f5f5f5',
    NOW(),
    NOW()
FROM profiles p
LEFT JOIN moodboards m ON m.created_by = p.id
WHERE m.id IS NULL;

-- Step 14: Update RLS policies for simplified access
DROP POLICY IF EXISTS "Users can view any moodboard" ON moodboards;
DROP POLICY IF EXISTS "Users can create their own moodboards" ON moodboards;
DROP POLICY IF EXISTS "Users can update their own moodboards" ON moodboards;
DROP POLICY IF EXISTS "Users can delete their own moodboards" ON moodboards;

-- All moodboards are public (micro conclav pages)
CREATE POLICY "Anyone can view moodboards" ON moodboards
    FOR SELECT USING (true);

-- Users can only update their own moodboard
CREATE POLICY "Users can update own moodboard" ON moodboards
    FOR UPDATE USING (
        created_by IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    );

-- Allow users to create their own moodboard if it doesn't exist
CREATE POLICY "Users can create own moodboard" ON moodboards
    FOR INSERT WITH CHECK (
        created_by IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    );

-- Prevent deletion of moodboards
CREATE POLICY "No moodboard deletion" ON moodboards
    FOR DELETE USING (false);

-- Step 15: Update RLS policies for moodboard_items
DROP POLICY IF EXISTS "Anyone can view moodboard items" ON moodboard_items;
DROP POLICY IF EXISTS "Users can manage their own moodboard items" ON moodboard_items;
DROP POLICY IF EXISTS "Users can manage own moodboard items" ON moodboard_items;

-- Anyone can view moodboard items (public micro conclav)
CREATE POLICY "Anyone can view moodboard items" ON moodboard_items
    FOR SELECT USING (true);

-- Users can insert items in their own moodboard
CREATE POLICY "Users can insert own moodboard items" ON moodboard_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM moodboards 
            WHERE moodboards.id = moodboard_items.moodboard_id 
            AND moodboards.created_by IN (
                SELECT id FROM profiles WHERE user_id = auth.uid()
            )
        )
    );

-- Users can update items in their own moodboard
CREATE POLICY "Users can update own moodboard items" ON moodboard_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM moodboards 
            WHERE moodboards.id = moodboard_items.moodboard_id 
            AND moodboards.created_by IN (
                SELECT id FROM profiles WHERE user_id = auth.uid()
            )
        )
    );

-- Users can delete items in their own moodboard
CREATE POLICY "Users can delete own moodboard items" ON moodboard_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM moodboards 
            WHERE moodboards.id = moodboard_items.moodboard_id 
            AND moodboards.created_by IN (
                SELECT id FROM profiles WHERE user_id = auth.uid()
            )
        )
    );

-- Step 16: Create a view for easier micro conclav lookups
CREATE OR REPLACE VIEW micro_conclav_pages AS
SELECT 
    p.id as user_id,
    p.username,
    p.full_name,
    p.bio,
    p.profile_picture_url,
    m.id as moodboard_id,
    m.title,
    m.description,
    m.background_color,
    m.created_at,
    m.updated_at
FROM profiles p
LEFT JOIN moodboards m ON m.created_by = p.id;

-- Step 17: Generate usernames for existing users based on their full name
-- First, create a temporary username for all users
UPDATE profiles
SET username = 'temp_' || id::text
WHERE username IS NULL;

-- Now generate proper usernames with duplicate handling
WITH username_generation AS (
    SELECT 
        id,
        LOWER(
            REGEXP_REPLACE(
                REGEXP_REPLACE(
                    COALESCE(full_name, 'user'),
                    '[^a-zA-Z0-9]',
                    '',
                    'g'
                ),
                '^$',
                'user'
            )
        ) as base_username,
        ROW_NUMBER() OVER (
            PARTITION BY LOWER(
                REGEXP_REPLACE(
                    REGEXP_REPLACE(
                        COALESCE(full_name, 'user'),
                        '[^a-zA-Z0-9]',
                        '',
                        'g'
                    ),
                    '^$',
                    'user'
                )
            )
            ORDER BY created_at
        ) as occurrence
    FROM profiles
)
UPDATE profiles p
SET username = CASE 
    WHEN ug.occurrence = 1 THEN ug.base_username
    ELSE ug.base_username || ug.occurrence
END
FROM username_generation ug
WHERE p.id = ug.id;

-- Step 18: Add comment explaining the new structure
COMMENT ON TABLE moodboards IS 'Single moodboard per user serving as their public Micro Conclav page';
COMMENT ON CONSTRAINT unique_user_moodboard ON moodboards IS 'Ensures each user has only one moodboard/micro conclav page';