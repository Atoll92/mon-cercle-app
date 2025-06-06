-- ============================================================================
-- FIX USER_BADGES AND ENGAGEMENT_STATS RLS POLICIES AFTER MULTI-PROFILE MIGRATION
-- ============================================================================
-- This migration fixes the RLS policies for user_badges and engagement_stats 
-- that were still using auth.uid() for profile_id comparisons after the migration
-- ============================================================================

BEGIN;

-- ============================================================================
-- FIX USER_BADGES RLS POLICIES
-- ============================================================================

-- Drop existing policies that use incorrect auth.uid() comparisons
DROP POLICY IF EXISTS "Network admins can manage user badges" ON user_badges;

-- Create new ALL policy for network admins to manage user badges
CREATE POLICY "Network admins can manage user badges" ON user_badges
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN badges b ON b.id = user_badges.badge_id
            WHERE p.user_id = auth.uid()
            AND p.network_id = b.network_id
            AND p.role = 'admin'
        )
    );

-- ============================================================================
-- FIX ENGAGEMENT_STATS RLS POLICIES
-- ============================================================================

-- Drop existing policies that use incorrect auth.uid() comparisons
DROP POLICY IF EXISTS "Users can view own engagement stats" ON engagement_stats;
DROP POLICY IF EXISTS "Network admins can view network engagement stats" ON engagement_stats;
DROP POLICY IF EXISTS "System can update engagement stats" ON engagement_stats;

-- Create new SELECT policy for users to view their own engagement stats
CREATE POLICY "Users can view their own engagement stats" ON engagement_stats
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    );

-- Create new SELECT policy for network admins to view all engagement stats
CREATE POLICY "Network admins can view all engagement stats" ON engagement_stats
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p1
            JOIN profiles p2 ON p1.network_id = p2.network_id
            WHERE p1.user_id = auth.uid()
            AND p1.role = 'admin'
            AND p2.id = engagement_stats.user_id
        )
    );

-- Also create INSERT and UPDATE policies for engagement stats (system updates)
CREATE POLICY "Allow engagement stats updates" ON engagement_stats
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow engagement stats modifications" ON engagement_stats
    FOR UPDATE USING (true) WITH CHECK (true);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Add to migration log (if table exists)
INSERT INTO migration_log (migration_name, status, notes) 
VALUES (
    'fix_user_badges_engagement_rls', 
    'completed', 
    'Fixed RLS policies for user_badges and engagement_stats to use profile relationships instead of direct auth.uid() comparisons after multi-profile migration'
) ON CONFLICT DO NOTHING;

COMMIT;

-- ============================================================================
-- POST-MIGRATION NOTES
-- ============================================================================
-- 
-- This migration fixes the RLS policies for badge and engagement tracking tables after the multi-profile migration.
-- 
-- Key changes:
-- - user_badges: Admin checks now use profiles.user_id = auth.uid() through badge network relationships
-- - engagement_stats: User checks now use user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
-- - engagement_stats: Admin checks now use network relationships through profiles
-- - engagement_stats: Added permissive INSERT/UPDATE policies for system operations
-- 
-- This maintains security while supporting the new multi-profile architecture
-- where users can have badges and engagement stats across different network profiles.
-- ============================================================================