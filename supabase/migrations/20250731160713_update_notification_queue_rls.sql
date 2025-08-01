-- Migration: Update RLS policies for notification_queue
-- Description: Restricts client access to notification_queue table - only server/service role can access
-- Date: 2025-07-31

-- First, check existing policies
DO $$
BEGIN
    -- Drop all existing policies on notification_queue
    DROP POLICY IF EXISTS "Enable read access for all users" ON notification_queue;
    DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON notification_queue;
    DROP POLICY IF EXISTS "Enable update for users based on user_id" ON notification_queue;
    DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON notification_queue;
    DROP POLICY IF EXISTS "Users can view their own notifications" ON notification_queue;
    DROP POLICY IF EXISTS "Service role can do everything" ON notification_queue;
    
    -- Drop any other policies that might exist
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'notification_queue'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON notification_queue', pol.policyname);
    END LOOP;
END $$;

-- Ensure RLS is enabled on the table
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

-- Create restrictive policies - NO client access allowed
-- Only service role (used by edge functions) can access the table

-- Policy 1: Service role has full access (this is implicit but we'll make it explicit)
CREATE POLICY "Service role full access" ON notification_queue
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Policy 2: Authenticated users can only view their notification stats (optional)
-- This allows the getNotificationStats function to work if needed
CREATE POLICY "Users can view their own notification stats" ON notification_queue
    FOR SELECT
    TO authenticated
    USING (recipient_id = auth.uid());

-- No INSERT, UPDATE, or DELETE permissions for authenticated users
-- All notification creation and processing must go through API functions

-- Add comments
COMMENT ON POLICY "Service role full access" ON notification_queue IS 
    'Only service role (edge functions) can fully access notification queue';
COMMENT ON POLICY "Users can view their own notification stats" ON notification_queue IS 
    'Users can only view their own notifications for statistics purposes';

-- Update RLS for notification_processing_log table
ALTER TABLE notification_processing_log ENABLE ROW LEVEL SECURITY;

-- Only service role can access processing logs
CREATE POLICY "Service role only" ON notification_processing_log
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Add comment
COMMENT ON POLICY "Service role only" ON notification_processing_log IS 
    'Only service role can access notification processing logs';

-- Create a secure view for users to check their notification preferences
-- This doesn't expose the queue itself
CREATE OR REPLACE VIEW user_notification_status AS
SELECT 
    p.id as profile_id,
    p.user_id,
    p.email_notifications_enabled,
    p.notify_on_news,
    p.notify_on_events,
    p.notify_on_mentions,
    p.notify_on_direct_messages,
    COUNT(CASE WHEN nq.is_sent = true THEN 1 END) as sent_count,
    COUNT(CASE WHEN nq.is_sent = false AND nq.error_message IS NULL THEN 1 END) as pending_count,
    COUNT(CASE WHEN nq.error_message IS NOT NULL THEN 1 END) as failed_count
FROM profiles p
LEFT JOIN notification_queue nq ON nq.recipient_id = p.id
WHERE p.user_id = auth.uid()
GROUP BY p.id, p.user_id, p.email_notifications_enabled, 
         p.notify_on_news, p.notify_on_events, p.notify_on_mentions, 
         p.notify_on_direct_messages;

-- Grant access to the view
GRANT SELECT ON user_notification_status TO authenticated;

-- Add comment
COMMENT ON VIEW user_notification_status IS 
    'Secure view for users to check their notification preferences and stats without accessing the queue directly';