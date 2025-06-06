-- ============================================================================
-- FIX NETWORK_INVITATION_LINKS RLS POLICIES AFTER MULTI-PROFILE MIGRATION
-- ============================================================================
-- This migration fixes the RLS policies for network_invitation_links that were
-- still using auth.uid() for profile_id comparisons after the migration
-- ============================================================================

BEGIN;

-- ============================================================================
-- FIX NETWORK_INVITATION_LINKS RLS POLICIES
-- ============================================================================

-- Drop existing policies that use incorrect auth.uid() comparisons
DROP POLICY IF EXISTS "Network admins can create invitation links" ON network_invitation_links;
DROP POLICY IF EXISTS "Network admins can delete invitation links" ON network_invitation_links;
DROP POLICY IF EXISTS "Network admins can update invitation links" ON network_invitation_links;
DROP POLICY IF EXISTS "Network admins can view invitation links" ON network_invitation_links;
-- Keep the public policy as it doesn't involve profile IDs
-- "Public can view active invitation links by code" should remain unchanged

-- Create new INSERT policy for network admins
CREATE POLICY "Network admins can create invitation links" ON network_invitation_links
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.network_id = network_invitation_links.network_id
            AND profiles.role = 'admin'
        )
    );

-- Create new DELETE policy for network admins
CREATE POLICY "Network admins can delete invitation links" ON network_invitation_links
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.network_id = network_invitation_links.network_id
            AND profiles.role = 'admin'
        )
    );

-- Create new UPDATE policy for network admins
CREATE POLICY "Network admins can update invitation links" ON network_invitation_links
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.network_id = network_invitation_links.network_id
            AND profiles.role = 'admin'
        )
    );

-- Create new SELECT policy for network admins
CREATE POLICY "Network admins can view invitation links" ON network_invitation_links
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.network_id = network_invitation_links.network_id
            AND profiles.role = 'admin'
        )
    );

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Add to migration log (if table exists)
INSERT INTO migration_log (migration_name, status, notes) 
VALUES (
    'fix_network_invitation_links_rls', 
    'completed', 
    'Fixed RLS policies for network_invitation_links to use profile relationships instead of direct auth.uid() comparisons after multi-profile migration'
) ON CONFLICT DO NOTHING;

COMMIT;

-- ============================================================================
-- POST-MIGRATION NOTES
-- ============================================================================
-- 
-- This migration fixes the RLS policies that were preventing admins from
-- creating, updating, and deleting network invitation links after the multi-profile migration.
-- 
-- The key changes are:
-- - Admin checks now use: profiles.user_id = auth.uid() AND profiles.network_id = network_invitation_links.network_id
-- 
-- Instead of the old:
-- - profiles.id = auth.uid() (which compared profile IDs to auth user IDs)
-- 
-- The public viewing policy for active invitation links by code remains unchanged
-- as it doesn't involve profile ID comparisons.
-- 
-- This maintains security while supporting the new multi-profile architecture
-- where invitation links are created/managed per profile, not per auth user.
-- ============================================================================