-- ============================================================================
-- FIX MESSAGES RLS POLICIES AFTER MULTI-PROFILE MIGRATION
-- ============================================================================
-- This migration fixes the RLS policies for messages that were
-- still using auth.uid() for profile_id comparisons after the migration
-- ============================================================================

BEGIN;

-- ============================================================================
-- FIX MESSAGES RLS POLICIES
-- ============================================================================

-- Drop existing policies that use incorrect auth.uid() comparisons
DROP POLICY IF EXISTS "Allow network members to read messages" ON messages;
DROP POLICY IF EXISTS "Allow network members to send messages" ON messages;
DROP POLICY IF EXISTS "Users can view replies to messages in their network" ON messages;

-- Create new SELECT policy for network members to read messages
CREATE POLICY "Allow network members to read messages" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.network_id = messages.network_id
        )
    );

-- Create new INSERT policy for network members to send messages
CREATE POLICY "Allow network members to send messages" ON messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.network_id = messages.network_id
        )
    );

-- Create new SELECT policy for viewing replies (duplicate with above, but keeping for compatibility)
CREATE POLICY "Users can view replies to messages in their network" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.network_id = messages.network_id
        )
    );

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Add to migration log (if table exists)
INSERT INTO migration_log (migration_name, status, notes) 
VALUES (
    'fix_messages_rls', 
    'completed', 
    'Fixed RLS policies for messages to use profile relationships instead of direct auth.uid() comparisons after multi-profile migration'
) ON CONFLICT DO NOTHING;

COMMIT;

-- ============================================================================
-- POST-MIGRATION NOTES
-- ============================================================================
-- 
-- This migration fixes the RLS policies for network chat messages after the multi-profile migration.
-- 
-- Key changes:
-- - Network member checks now use: profiles.user_id = auth.uid() AND profiles.network_id = messages.network_id
-- 
-- Instead of the old:
-- - profiles.id = auth.uid() (which compared profile IDs to auth user IDs)
-- 
-- This maintains security while supporting the new multi-profile architecture.
-- ============================================================================