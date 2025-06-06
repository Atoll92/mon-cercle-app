-- ============================================================================
-- FIX EVENT_PARTICIPATIONS RLS POLICIES AFTER MULTI-PROFILE MIGRATION
-- ============================================================================
-- This migration fixes the RLS policies for event_participations that were
-- still using auth.uid() for profile_id comparisons after the migration
-- ============================================================================

BEGIN;

-- ============================================================================
-- FIX EVENT_PARTICIPATIONS RLS POLICIES
-- ============================================================================

-- Drop existing policies that use incorrect auth.uid() comparisons
DROP POLICY IF EXISTS "Users can manage their own participations" ON event_participations;
DROP POLICY IF EXISTS "Network admins can view all participations in their network" ON event_participations;
DROP POLICY IF EXISTS "Participations are viewable by everyone" ON event_participations;

-- Create new ALL policy for managing own participations
CREATE POLICY "Users can manage their own participations" ON event_participations
    FOR ALL USING (
        -- The profile_id must be one of the user's profile IDs
        profile_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    ) WITH CHECK (
        -- The profile_id must be one of the user's profile IDs
        profile_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    );

-- Create new SELECT policy for admins to view participations in their network
CREATE POLICY "Network admins can view all participations in their network" ON event_participations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN network_events e ON p.network_id = e.network_id
            WHERE p.user_id = auth.uid()
            AND p.role = 'admin'
            AND e.id = event_participations.event_id
        )
    );

-- Create new SELECT policy for public viewing (keep this as is)
CREATE POLICY "Participations are viewable by everyone" ON event_participations
    FOR SELECT USING (true);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Add to migration log
INSERT INTO migration_log (migration_name, status, notes) 
VALUES (
    'fix_event_participations_rls', 
    'completed', 
    'Fixed RLS policies for event_participations to use profile IDs instead of direct auth.uid() comparisons after multi-profile migration'
);

COMMIT;

-- ============================================================================
-- POST-MIGRATION NOTES
-- ============================================================================
-- 
-- This migration fixes the RLS policies that were preventing users from
-- updating event participation status after the multi-profile migration.
-- 
-- The key change is that the management policy now checks:
-- - profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
-- 
-- Instead of the old:
-- - auth.uid() = profile_id
-- 
-- This maintains security while supporting the new multi-profile architecture
-- where profile_id contains profile IDs, not auth user IDs.
-- ============================================================================