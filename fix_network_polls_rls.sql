-- ============================================================================
-- FIX NETWORK_POLLS RLS POLICIES AFTER MULTI-PROFILE MIGRATION
-- ============================================================================
-- This migration fixes the RLS policies for network_polls that were
-- still using auth.uid() for profile_id comparisons after the migration
-- ============================================================================

BEGIN;

-- ============================================================================
-- FIX NETWORK_POLLS RLS POLICIES
-- ============================================================================

-- Drop existing policies that use incorrect auth.uid() comparisons
DROP POLICY IF EXISTS "Network admins can create polls" ON network_polls;
DROP POLICY IF EXISTS "Network members can view polls" ON network_polls;
DROP POLICY IF EXISTS "Poll creators and admins can delete polls" ON network_polls;
DROP POLICY IF EXISTS "Poll creators and admins can update polls" ON network_polls;

-- Create new INSERT policy for network admins
CREATE POLICY "Network admins can create polls" ON network_polls
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.network_id = network_polls.network_id
            AND profiles.role = 'admin'
        )
    );

-- Create new SELECT policy for network members
CREATE POLICY "Network members can view polls" ON network_polls
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.network_id = network_polls.network_id
        )
    );

-- Create new DELETE policy for poll creators and admins
CREATE POLICY "Poll creators and admins can delete polls" ON network_polls
    FOR DELETE USING (
        -- Creator can delete (created_by is now a profile ID)
        created_by IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
        OR
        -- Network admins can delete
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.network_id = network_polls.network_id
            AND profiles.role = 'admin'
        )
    );

-- Create new UPDATE policy for poll creators and admins
CREATE POLICY "Poll creators and admins can update polls" ON network_polls
    FOR UPDATE USING (
        -- Creator can update (created_by is now a profile ID)
        created_by IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
        OR
        -- Network admins can update
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.network_id = network_polls.network_id
            AND profiles.role = 'admin'
        )
    );

-- ============================================================================
-- FIX NETWORK_POLL_VOTES RLS POLICIES (also affected)
-- ============================================================================

-- Drop existing policies that use incorrect auth.uid() comparisons
DROP POLICY IF EXISTS "Network members can vote" ON network_poll_votes;
DROP POLICY IF EXISTS "Users can delete their own votes" ON network_poll_votes;
DROP POLICY IF EXISTS "Users can update their own votes" ON network_poll_votes;
DROP POLICY IF EXISTS "Users can view their own votes" ON network_poll_votes;

-- Create new INSERT policy for network members to vote
CREATE POLICY "Network members can vote" ON network_poll_votes
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
        AND
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN network_polls np ON np.network_id = p.network_id
            WHERE p.user_id = auth.uid()
            AND np.id = network_poll_votes.poll_id
            AND np.status = 'active'
            AND (np.starts_at IS NULL OR np.starts_at <= now())
            AND (np.ends_at IS NULL OR np.ends_at > now())
        )
    );

-- Create new DELETE policy for users to delete their own votes
CREATE POLICY "Users can delete their own votes" ON network_poll_votes
    FOR DELETE USING (
        user_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
        AND
        EXISTS (
            SELECT 1 FROM network_polls np
            WHERE np.id = network_poll_votes.poll_id
            AND np.status = 'active'
            AND (np.ends_at IS NULL OR np.ends_at > now())
        )
    );

-- Create new UPDATE policy for users to update their own votes
CREATE POLICY "Users can update their own votes" ON network_poll_votes
    FOR UPDATE USING (
        user_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
        AND
        EXISTS (
            SELECT 1 FROM network_polls np
            WHERE np.id = network_poll_votes.poll_id
            AND np.status = 'active'
            AND (np.ends_at IS NULL OR np.ends_at > now())
        )
    );

-- Create new SELECT policy for users to view votes
CREATE POLICY "Users can view their own votes" ON network_poll_votes
    FOR SELECT USING (
        -- Users can view their own votes
        user_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
        OR
        -- Network admins can view all votes in their network
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN network_polls np ON np.network_id = p.network_id
            WHERE p.user_id = auth.uid()
            AND p.role = 'admin'
            AND np.id = network_poll_votes.poll_id
        )
    );

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Add to migration log (if table exists)
INSERT INTO migration_log (migration_name, status, notes) 
VALUES (
    'fix_network_polls_rls', 
    'completed', 
    'Fixed RLS policies for network_polls and network_poll_votes to use profile relationships instead of direct auth.uid() comparisons after multi-profile migration'
) ON CONFLICT DO NOTHING;

COMMIT;

-- ============================================================================
-- POST-MIGRATION NOTES
-- ============================================================================
-- 
-- This migration fixes the RLS policies that were preventing admins from
-- creating, updating, and deleting network polls after the multi-profile migration.
-- 
-- Key changes for network_polls:
-- - Admin checks now use: profiles.user_id = auth.uid() AND profiles.network_id = network_polls.network_id
-- - Creator checks now use: created_by IN (SELECT id FROM profiles WHERE user_id = auth.uid())
-- 
-- Key changes for network_poll_votes:
-- - Vote ownership checks now use: user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
-- - Admin checks now use: profiles.user_id = auth.uid() AND profiles.role = 'admin'
-- 
-- This maintains security while supporting the new multi-profile architecture
-- where polls are created/managed per profile, not per auth user.
-- ============================================================================