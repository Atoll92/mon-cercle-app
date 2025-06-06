-- ============================================================================
-- FIX NOTIFICATION_QUEUE RLS POLICIES AFTER MULTI-PROFILE MIGRATION
-- ============================================================================
-- This migration fixes the RLS policies for notification_queue that were
-- still using auth.uid() for profile_id comparisons after the migration
-- ============================================================================

BEGIN;

-- ============================================================================
-- FIX NOTIFICATION_QUEUE RLS POLICIES
-- ============================================================================

-- Drop existing policies that use incorrect auth.uid() comparisons
DROP POLICY IF EXISTS "Authenticated users can delete notifications" ON notification_queue;
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON notification_queue;
DROP POLICY IF EXISTS "Authenticated users can update notifications" ON notification_queue;
DROP POLICY IF EXISTS "Network admins can view all network notifications" ON notification_queue;
DROP POLICY IF EXISTS "Users can view relevant notifications" ON notification_queue;

-- Create new DELETE policy for notification recipients and network members
CREATE POLICY "Authenticated users can delete notifications" ON notification_queue
    FOR DELETE USING (
        -- Direct recipient can delete
        recipient_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
        OR
        -- Network members can delete notifications from their network
        network_id IN (
            SELECT profiles.network_id
            FROM profiles
            WHERE profiles.user_id = auth.uid()
        )
    );

-- Create new INSERT policy (keep permissive for system notifications)
CREATE POLICY "Authenticated users can insert notifications" ON notification_queue
    FOR INSERT WITH CHECK (true);

-- Create new UPDATE policy (keep permissive for system updates)
CREATE POLICY "Authenticated users can update notifications" ON notification_queue
    FOR UPDATE USING (true) WITH CHECK (true);

-- Create new ALL policy for network admins
CREATE POLICY "Network admins can view all network notifications" ON notification_queue
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
            AND profiles.network_id = notification_queue.network_id
        )
    );

-- Create new SELECT policy for relevant notifications
CREATE POLICY "Users can view relevant notifications" ON notification_queue
    FOR SELECT USING (
        -- Direct recipient can view
        recipient_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
        OR
        -- Network members can view notifications from their network
        network_id IN (
            SELECT profiles.network_id
            FROM profiles
            WHERE profiles.user_id = auth.uid()
        )
    );

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Add to migration log (if table exists)
INSERT INTO migration_log (migration_name, status, notes) 
VALUES (
    'fix_notification_queue_rls', 
    'completed', 
    'Fixed RLS policies for notification_queue to use profile relationships instead of direct auth.uid() comparisons after multi-profile migration'
) ON CONFLICT DO NOTHING;

COMMIT;

-- ============================================================================
-- POST-MIGRATION NOTES
-- ============================================================================
-- 
-- This migration fixes the RLS policies for notification queue after the multi-profile migration.
-- 
-- Key changes:
-- - Recipient checks now use: recipient_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
-- - Network member checks now use: profiles.user_id = auth.uid()
-- - Admin checks now use: profiles.user_id = auth.uid() AND profiles.role = 'admin'
-- 
-- This maintains security while supporting the new multi-profile architecture
-- where notifications are sent to profile IDs, not auth user IDs.
-- ============================================================================