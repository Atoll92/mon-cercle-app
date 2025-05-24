-- Fix Row Level Security policies for notification_queue table

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own notifications" ON notification_queue;
DROP POLICY IF EXISTS "System can insert notifications" ON notification_queue;
DROP POLICY IF EXISTS "System can update notification status" ON notification_queue;

-- Create more permissive policies for debugging and proper functionality

-- Policy: Users can view notifications intended for them OR notifications they created (for admins/senders)
CREATE POLICY "Users can view relevant notifications"
    ON notification_queue FOR SELECT
    USING (
        recipient_id = auth.uid() OR
        (
            -- Allow users to see notifications in their own network
            network_id IN (
                SELECT network_id 
                FROM profiles 
                WHERE id = auth.uid()
            )
        )
    );

-- Policy: Allow authenticated users to insert notifications (needed for the queueing system)
CREATE POLICY "Authenticated users can insert notifications"
    ON notification_queue FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Policy: Allow authenticated users to update notification status
CREATE POLICY "Authenticated users can update notifications"
    ON notification_queue FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Policy: Allow authenticated users to delete notifications (for cleanup)
CREATE POLICY "Authenticated users can delete notifications"
    ON notification_queue FOR DELETE
    TO authenticated
    USING (
        recipient_id = auth.uid() OR
        (
            -- Allow deletion within user's network
            network_id IN (
                SELECT network_id 
                FROM profiles 
                WHERE id = auth.uid()
            )
        )
    );

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON notification_queue TO authenticated;

-- For debugging: Temporarily allow admins to see all notifications
-- (You can remove this in production)
CREATE POLICY "Network admins can view all network notifications"
    ON notification_queue FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
            AND network_id = notification_queue.network_id
        )
    );

-- Add a helpful comment
COMMENT ON TABLE notification_queue IS 'Queue for email notifications with RLS policies allowing users to view their own notifications and network-related notifications';