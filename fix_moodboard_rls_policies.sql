-- ============================================================================
-- FIX MOODBOARD RLS POLICIES AFTER MULTI-PROFILE MIGRATION
-- ============================================================================
-- This migration fixes the RLS policies for moodboards and moodboard_items
-- that were still using auth.uid() instead of profile IDs after the migration
-- ============================================================================

BEGIN;

-- ============================================================================
-- FIX MOODBOARD_ITEMS RLS POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "delete_moodboard_items_policy" ON moodboard_items;
DROP POLICY IF EXISTS "insert_moodboard_items_policy" ON moodboard_items;
DROP POLICY IF EXISTS "update_moodboard_items_policy" ON moodboard_items;
DROP POLICY IF EXISTS "view_moodboard_items_policy" ON moodboard_items;

-- Create new policies that properly check profile IDs

-- View policy: Can view if moodboard is public, you created it, you're admin, or it's collaborative
CREATE POLICY "view_moodboard_items_policy" ON moodboard_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM moodboards
            WHERE moodboards.id = moodboard_items.moodboard_id
            AND (
                -- Public moodboards
                moodboards.permissions = 'public' OR
                -- You created the moodboard
                moodboards.created_by IN (
                    SELECT id FROM profiles WHERE user_id = auth.uid()
                ) OR
                -- You're admin in the network
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE profiles.user_id = auth.uid()
                    AND profiles.role = 'admin'
                    AND profiles.network_id = moodboards.network_id
                ) OR
                -- Collaborative moodboard in your network
                (moodboards.permissions = 'collaborative' AND EXISTS (
                    SELECT 1 FROM profiles
                    WHERE profiles.user_id = auth.uid()
                    AND profiles.network_id = moodboards.network_id
                ))
            )
        )
    );

-- Insert policy: Can insert if you created the moodboard, you're admin, or it's collaborative
CREATE POLICY "insert_moodboard_items_policy" ON moodboard_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM moodboards
            WHERE moodboards.id = moodboard_items.moodboard_id
            AND (
                -- You created the moodboard
                moodboards.created_by IN (
                    SELECT id FROM profiles WHERE user_id = auth.uid()
                ) OR
                -- You're admin in the network
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE profiles.user_id = auth.uid()
                    AND profiles.role = 'admin'
                    AND profiles.network_id = moodboards.network_id
                ) OR
                -- Collaborative moodboard in your network
                (moodboards.permissions = 'collaborative' AND EXISTS (
                    SELECT 1 FROM profiles
                    WHERE profiles.user_id = auth.uid()
                    AND profiles.network_id = moodboards.network_id
                ))
            )
        )
    );

-- Update policy: Can update if you created the moodboard, the item, you're admin, or it's collaborative
CREATE POLICY "update_moodboard_items_policy" ON moodboard_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM moodboards
            WHERE moodboards.id = moodboard_items.moodboard_id
            AND (
                -- You created the moodboard
                moodboards.created_by IN (
                    SELECT id FROM profiles WHERE user_id = auth.uid()
                ) OR
                -- You created the item
                moodboard_items.created_by IN (
                    SELECT id FROM profiles WHERE user_id = auth.uid()
                ) OR
                -- You're admin in the network
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE profiles.user_id = auth.uid()
                    AND profiles.role = 'admin'
                    AND profiles.network_id = moodboards.network_id
                ) OR
                -- Collaborative moodboard in your network
                (moodboards.permissions = 'collaborative' AND EXISTS (
                    SELECT 1 FROM profiles
                    WHERE profiles.user_id = auth.uid()
                    AND profiles.network_id = moodboards.network_id
                ))
            )
        )
    );

-- Delete policy: Can delete if you created the moodboard, the item, you're admin, or it's collaborative
CREATE POLICY "delete_moodboard_items_policy" ON moodboard_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM moodboards
            WHERE moodboards.id = moodboard_items.moodboard_id
            AND (
                -- You created the moodboard
                moodboards.created_by IN (
                    SELECT id FROM profiles WHERE user_id = auth.uid()
                ) OR
                -- You created the item
                moodboard_items.created_by IN (
                    SELECT id FROM profiles WHERE user_id = auth.uid()
                ) OR
                -- You're admin in the network
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE profiles.user_id = auth.uid()
                    AND profiles.role = 'admin'
                    AND profiles.network_id = moodboards.network_id
                ) OR
                -- Collaborative moodboard in your network
                (moodboards.permissions = 'collaborative' AND EXISTS (
                    SELECT 1 FROM profiles
                    WHERE profiles.user_id = auth.uid()
                    AND profiles.network_id = moodboards.network_id
                ))
            )
        )
    );

-- ============================================================================
-- FIX MOODBOARDS RLS POLICIES
-- ============================================================================

-- Drop existing policies that might be using auth.uid() incorrectly
DROP POLICY IF EXISTS "admin_moodboards_policy" ON moodboards;
DROP POLICY IF EXISTS "delete_own_moodboards_policy" ON moodboards;

-- Create new policies that properly check profile IDs

-- Admin policy: Can do everything if you're admin or created it
CREATE POLICY "admin_moodboards_policy" ON moodboards
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND (
                profiles.role = 'admin' OR
                profiles.id = moodboards.created_by
            )
        )
    );

-- Delete policy: Can delete if you created it
CREATE POLICY "delete_own_moodboards_policy" ON moodboards
    FOR DELETE USING (
        created_by IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    );

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Add to migration log
INSERT INTO migration_log (migration_name, status, notes) 
VALUES (
    'fix_moodboard_rls_policies', 
    'completed', 
    'Fixed RLS policies for moodboards and moodboard_items to use profile IDs instead of auth.uid() after multi-profile migration'
);

COMMIT;

-- ============================================================================
-- POST-MIGRATION NOTES
-- ============================================================================
-- 
-- This migration fixes the RLS policies that were preventing users from
-- creating and managing moodboard items after the multi-profile migration.
-- 
-- The key change is that all policies now check:
-- - profiles.user_id = auth.uid() to find the user's profiles
-- - Then use those profile IDs to check against created_by fields
-- 
-- This maintains security while supporting the new multi-profile architecture.
-- ============================================================================