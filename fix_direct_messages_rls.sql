-- ============================================================================
-- FIX DIRECT_MESSAGES RLS POLICIES AFTER MULTI-PROFILE MIGRATION
-- ============================================================================
-- This migration fixes the RLS policies for direct_messages that were still
-- using auth.uid() for sender_id comparisons after the migration
-- ============================================================================

BEGIN;

-- ============================================================================
-- FIX DIRECT_MESSAGES RLS POLICIES
-- ============================================================================

-- Drop existing policies that use incorrect auth.uid() comparisons
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON direct_messages;
DROP POLICY IF EXISTS "Users can view messages from their conversations" ON direct_messages;
DROP POLICY IF EXISTS "Participants can update read_at" ON direct_messages;

-- Create new INSERT policy that properly checks profile IDs
CREATE POLICY "Users can send messages to their conversations" ON direct_messages
    FOR INSERT WITH CHECK (
        -- The sender_id must be one of the user's profile IDs
        sender_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        ) AND
        -- The user must be a participant in the conversation
        EXISTS (
            SELECT 1 FROM direct_conversations
            WHERE direct_conversations.id = direct_messages.conversation_id
            AND auth.uid() = ANY (direct_conversations.participants)
        )
    );

-- Create new SELECT policy for viewing messages
CREATE POLICY "Users can view messages from their conversations" ON direct_messages
    FOR SELECT USING (
        -- User must be a participant in the conversation
        EXISTS (
            SELECT 1 FROM direct_conversations
            WHERE direct_conversations.id = direct_messages.conversation_id
            AND auth.uid() = ANY (direct_conversations.participants)
        )
    );

-- Create new UPDATE policy for marking messages as read
CREATE POLICY "Participants can update read_at" ON direct_messages
    FOR UPDATE USING (
        -- User must be a participant in the conversation
        auth.uid() IN (
            SELECT unnest(direct_conversations.participants)
            FROM direct_conversations
            WHERE direct_conversations.id = direct_messages.conversation_id
        )
    ) WITH CHECK (true);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Add to migration log
INSERT INTO migration_log (migration_name, status, notes) 
VALUES (
    'fix_direct_messages_rls', 
    'completed', 
    'Fixed RLS policies for direct_messages to use profile IDs for sender_id checks instead of auth.uid() after multi-profile migration'
);

COMMIT;

-- ============================================================================
-- POST-MIGRATION NOTES
-- ============================================================================
-- 
-- This migration fixes the RLS policies that were preventing users from
-- sending direct messages after the multi-profile migration.
-- 
-- The key change is that the INSERT policy now checks:
-- - sender_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
-- 
-- Instead of the old:
-- - sender_id = auth.uid()
-- 
-- This maintains security while supporting the new multi-profile architecture
-- where sender_id contains profile IDs, not auth user IDs.
-- ============================================================================