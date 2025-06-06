-- ============================================================================
-- FIX DONATIONS RLS POLICIES AFTER MULTI-PROFILE MIGRATION
-- ============================================================================
-- This migration fixes the RLS policies for donations that were
-- still using auth.uid() for profile_id comparisons after the migration
-- ============================================================================

BEGIN;

-- ============================================================================
-- FIX DONATIONS RLS POLICIES
-- ============================================================================

-- Drop existing policies that use incorrect auth.uid() comparisons
DROP POLICY IF EXISTS "donations_insertable_by_users" ON donations;
DROP POLICY IF EXISTS "donations_viewable_by_donor" ON donations;
DROP POLICY IF EXISTS "donations_viewable_by_network_admins" ON donations;

-- Create new INSERT policy for users
CREATE POLICY "donations_insertable_by_users" ON donations
    FOR INSERT WITH CHECK (
        donor_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    );

-- Create new SELECT policy for donors
CREATE POLICY "donations_viewable_by_donor" ON donations
    FOR SELECT USING (
        donor_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    );

-- Create new SELECT policy for network admins
CREATE POLICY "donations_viewable_by_network_admins" ON donations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.network_id = donations.network_id
            AND profiles.role = 'admin'
        )
    );

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Add to migration log (if table exists)
INSERT INTO migration_log (migration_name, status, notes) 
VALUES (
    'fix_donations_rls', 
    'completed', 
    'Fixed RLS policies for donations to use profile relationships instead of direct auth.uid() comparisons after multi-profile migration'
) ON CONFLICT DO NOTHING;

COMMIT;

-- ============================================================================
-- POST-MIGRATION NOTES
-- ============================================================================
-- 
-- This migration fixes the RLS policies for donations after the multi-profile migration.
-- 
-- Key changes:
-- - Donor checks now use: donor_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
-- - Admin checks now use: profiles.user_id = auth.uid() AND profiles.role = 'admin'
-- 
-- This maintains security while supporting the new multi-profile architecture.
-- ============================================================================