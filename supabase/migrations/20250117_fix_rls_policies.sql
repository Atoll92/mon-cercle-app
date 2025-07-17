-- Fix RLS policies to work with profile IDs instead of user IDs
-- This is a quick fix to be applied after the main migration

-- Drop existing policies
DROP POLICY IF EXISTS "Users can update own moodboard" ON moodboards;
DROP POLICY IF EXISTS "Users can create own moodboard" ON moodboards;
DROP POLICY IF EXISTS "Users can insert own moodboard items" ON moodboard_items;
DROP POLICY IF EXISTS "Users can update own moodboard items" ON moodboard_items;
DROP POLICY IF EXISTS "Users can delete own moodboard items" ON moodboard_items;

-- Recreate policies using profile ID matching
-- For moodboards table
CREATE POLICY "Users can update own moodboard" ON moodboards
    FOR UPDATE USING (
        created_by IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create own moodboard" ON moodboards
    FOR INSERT WITH CHECK (
        created_by IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    );

-- For moodboard_items table
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