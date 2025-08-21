-- ============================================================================
-- ADD DELETE POLICY FOR MESSAGES TABLE
-- ============================================================================
-- This migration adds the missing DELETE policy for the messages table
-- to allow users to delete their own messages and admins to delete any message
-- ============================================================================

BEGIN;

-- ============================================================================
-- ADD DELETE POLICY FOR MESSAGES
-- ============================================================================

-- Create DELETE policy for users to delete their own messages
CREATE POLICY "Users can delete their own messages" ON messages
    FOR DELETE USING (
        -- User can delete their own messages
        user_id IN (
            SELECT id FROM profiles
            WHERE profiles.user_id = auth.uid()
        )
    );

-- Create DELETE policy for network admins to delete any message
CREATE POLICY "Network admins can delete any message" ON messages
    FOR DELETE USING (
        -- Check if the user is an admin of the network
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.network_id = messages.network_id
            AND profiles.role = 'admin'
        )
    );

-- ============================================================================
-- ADD UPDATE POLICY FOR MESSAGE MODERATION
-- ============================================================================

-- Drop existing UPDATE policy if it exists
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
DROP POLICY IF EXISTS "Network admins can moderate messages" ON messages;

-- Create UPDATE policy for users to update their own messages
CREATE POLICY "Users can update their own messages" ON messages
    FOR UPDATE USING (
        -- User can update their own messages
        user_id IN (
            SELECT id FROM profiles
            WHERE profiles.user_id = auth.uid()
        )
    );

-- Create UPDATE policy for network admins to moderate messages (hide/flag)
CREATE POLICY "Network admins can moderate messages" ON messages
    FOR UPDATE USING (
        -- Check if the user is an admin of the network
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.network_id = messages.network_id
            AND profiles.role = 'admin'
        )
    );

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Add to migration log (if table exists)
INSERT INTO migration_log (migration_name, status, notes) 
VALUES (
    'add_messages_delete_policy', 
    'completed', 
    'Added DELETE and UPDATE policies for messages table to allow users to delete their own messages and admins to moderate'
) ON CONFLICT DO NOTHING;

COMMIT;

-- ============================================================================
-- POST-MIGRATION NOTES
-- ============================================================================
-- 
-- This migration adds the missing DELETE and UPDATE policies for the messages table.
-- 
-- DELETE policies:
-- - Users can delete their own messages
-- - Network admins can delete any message in their network
-- 
-- UPDATE policies:
-- - Users can update their own messages
-- - Network admins can moderate (hide/flag) any message in their network
-- 
-- These policies maintain security while allowing proper moderation capabilities.
-- ============================================================================