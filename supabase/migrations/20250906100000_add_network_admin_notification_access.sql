-- Add RLS policy for network admins to view all notifications in their network
-- This allows the CRM tab to function properly for admins

-- Create a policy that allows network admins to view all notifications for their network
CREATE POLICY "Network admins can view network notifications" ON notification_queue
    FOR SELECT
    TO authenticated
    USING (
        -- Check if the user is an admin of the network
        EXISTS (
            SELECT 1 
            FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.network_id = notification_queue.network_id
            AND profiles.role = 'admin'
        )
    );

-- Add comment to document the policy
COMMENT ON POLICY "Network admins can view network notifications" ON notification_queue IS 
    'Network administrators can view all notifications sent within their network for CRM purposes';