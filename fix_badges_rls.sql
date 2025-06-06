-- ============================================================================
-- FIX BADGES RLS POLICIES AFTER MULTI-PROFILE MIGRATION
-- ============================================================================
-- This migration fixes the RLS policies for badges that were
-- still using auth.uid() for profile_id comparisons after the migration
-- ============================================================================

BEGIN;

-- ============================================================================
-- FIX BADGES RLS POLICIES
-- ============================================================================

-- Drop existing policies that use incorrect auth.uid() comparisons
DROP POLICY IF EXISTS "Network creators and admins can manage badges" ON badges;
DROP POLICY IF EXISTS "Network members can view badges" ON badges;

-- Create new ALL policy for network creators and admins
CREATE POLICY "Network creators and admins can manage badges" ON badges
    FOR ALL USING (
        -- Network admins can manage badges
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.network_id = badges.network_id
            AND profiles.role = 'admin'
        )
        OR
        -- Network creators can manage badges (networks.created_by is still auth user ID)
        EXISTS (
            SELECT 1 FROM networks
            WHERE networks.id = badges.network_id
            AND networks.created_by = auth.uid()::text
        )
    );

-- Create new SELECT policy for network members to view badges
CREATE POLICY "Network members can view badges" ON badges
    FOR SELECT USING (
        is_active = true
        AND
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.network_id = badges.network_id
        )
    );

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Add to migration log (if table exists)
INSERT INTO migration_log (migration_name, status, notes) 
VALUES (
    'fix_badges_rls', 
    'completed', 
    'Fixed RLS policies for badges to use profile relationships instead of direct auth.uid() comparisons after multi-profile migration'
) ON CONFLICT DO NOTHING;

COMMIT;

-- ============================================================================
-- POST-MIGRATION NOTES
-- ============================================================================
-- 
-- This migration fixes the RLS policies for engagement badges after the multi-profile migration.
-- 
-- Key changes:
-- - Admin checks now use: profiles.user_id = auth.uid() AND profiles.network_id = badges.network_id
-- - Member checks now use: profiles.user_id = auth.uid() AND profiles.network_id = badges.network_id
-- - Network creator checks remain: networks.created_by = auth.uid()::text (unchanged)
-- 
-- This maintains security while supporting the new multi-profile architecture.
-- ============================================================================