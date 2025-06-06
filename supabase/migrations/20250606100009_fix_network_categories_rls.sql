-- ============================================================================
-- FIX NETWORK_CATEGORIES RLS POLICIES AFTER MULTI-PROFILE MIGRATION
-- ============================================================================
-- This migration fixes the RLS policies for network_categories that were
-- still using auth.uid() for profile_id comparisons after the migration
-- ============================================================================

BEGIN;

-- ============================================================================
-- FIX NETWORK_CATEGORIES RLS POLICIES
-- ============================================================================

-- Drop existing policies that use incorrect auth.uid() comparisons
DROP POLICY IF EXISTS "network_categories_deletable_by_admins" ON network_categories;
DROP POLICY IF EXISTS "network_categories_insertable_by_admins" ON network_categories;
DROP POLICY IF EXISTS "network_categories_updatable_by_admins" ON network_categories;
DROP POLICY IF EXISTS "network_categories_viewable_by_network_members" ON network_categories;

-- Create new DELETE policy for network admins
CREATE POLICY "network_categories_deletable_by_admins" ON network_categories
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.network_id = network_categories.network_id
            AND profiles.role = 'admin'
        )
    );

-- Create new INSERT policy for network admins
CREATE POLICY "network_categories_insertable_by_admins" ON network_categories
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.network_id = network_categories.network_id
            AND profiles.role = 'admin'
        )
    );

-- Create new UPDATE policy for network admins
CREATE POLICY "network_categories_updatable_by_admins" ON network_categories
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.network_id = network_categories.network_id
            AND profiles.role = 'admin'
        )
    );

-- Create new SELECT policy for network members
CREATE POLICY "network_categories_viewable_by_network_members" ON network_categories
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.network_id = network_categories.network_id
        )
    );

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Add to migration log (if table exists)
INSERT INTO migration_log (migration_name, status, notes) 
VALUES (
    'fix_network_categories_rls', 
    'completed', 
    'Fixed RLS policies for network_categories to use profile relationships instead of direct auth.uid() comparisons after multi-profile migration'
) ON CONFLICT DO NOTHING;

COMMIT;

-- ============================================================================
-- POST-MIGRATION NOTES
-- ============================================================================
-- 
-- This migration fixes the RLS policies that were preventing admins from
-- creating, updating, and deleting network categories after the multi-profile migration.
-- 
-- The key changes are:
-- - Admin checks now use: profiles.user_id = auth.uid() AND profiles.network_id = network_categories.network_id
-- - Member checks now use: profiles.user_id = auth.uid() AND profiles.network_id = network_categories.network_id
-- 
-- Instead of the old:
-- - profiles.id = auth.uid() (which compared profile IDs to auth user IDs)
-- 
-- This maintains security while supporting the new multi-profile architecture.
-- ============================================================================