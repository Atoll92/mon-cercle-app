-- ============================================================================
-- FIX WIKI_PAGES RLS POLICIES AFTER MULTI-PROFILE MIGRATION
-- ============================================================================
-- This migration fixes the RLS policies for wiki_pages that were
-- still using auth.uid() for profile_id comparisons after the migration
-- ============================================================================

BEGIN;

-- ============================================================================
-- FIX WIKI_PAGES RLS POLICIES
-- ============================================================================

-- Drop existing policies that use incorrect auth.uid() comparisons
DROP POLICY IF EXISTS "Network admins can insert wiki pages" ON wiki_pages;
DROP POLICY IF EXISTS "Network admins can update wiki pages" ON wiki_pages;
DROP POLICY IF EXISTS "Network admins can view all wiki pages" ON wiki_pages;
DROP POLICY IF EXISTS "Network members can insert wiki pages" ON wiki_pages;
DROP POLICY IF EXISTS "Page creators can update their own unpublished pages" ON wiki_pages;

-- Keep the public view policy as it doesn't involve profile IDs
-- "Anyone can view published wiki pages" should remain unchanged

-- Create new INSERT policy for network admins
CREATE POLICY "Network admins can insert wiki pages" ON wiki_pages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.network_id = wiki_pages.network_id
            AND profiles.role = 'admin'
        )
    );

-- Create new UPDATE policy for network admins
CREATE POLICY "Network admins can update wiki pages" ON wiki_pages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.network_id = wiki_pages.network_id
            AND profiles.role = 'admin'
        )
    );

-- Create new SELECT policy for network admins
CREATE POLICY "Network admins can view all wiki pages" ON wiki_pages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.network_id = wiki_pages.network_id
            AND profiles.role = 'admin'
        )
    );

-- Create new INSERT policy for network members
CREATE POLICY "Network members can insert wiki pages" ON wiki_pages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.network_id = wiki_pages.network_id
        )
    );

-- Create new UPDATE policy for page creators (own unpublished pages)
CREATE POLICY "Page creators can update their own unpublished pages" ON wiki_pages
    FOR UPDATE USING (
        created_by IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
        AND is_published = false
    );

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Add to migration log (if table exists)
INSERT INTO migration_log (migration_name, status, notes) 
VALUES (
    'fix_wiki_pages_rls', 
    'completed', 
    'Fixed RLS policies for wiki_pages to use profile relationships instead of direct auth.uid() comparisons after multi-profile migration'
) ON CONFLICT DO NOTHING;

COMMIT;

-- ============================================================================
-- POST-MIGRATION NOTES
-- ============================================================================
-- 
-- This migration fixes the RLS policies that were preventing users from
-- creating and editing wiki pages after the multi-profile migration.
-- 
-- The key changes are:
-- - Admin checks now use: profiles.user_id = auth.uid() AND profiles.network_id = wiki_pages.network_id
-- - Member checks now use: profiles.user_id = auth.uid() AND profiles.network_id = wiki_pages.network_id  
-- - Creator checks now use: created_by IN (SELECT id FROM profiles WHERE user_id = auth.uid())
-- 
-- Instead of the old:
-- - profiles.id = auth.uid() (which compared profile IDs to auth user IDs)
-- - created_by = auth.uid() (which compared profile IDs to auth user IDs)
-- 
-- This maintains security while supporting the new multi-profile architecture.
-- ============================================================================