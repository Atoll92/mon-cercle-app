-- ============================================================================
-- FIX DIRECT CONVERSATIONS COMPLETELY AFTER MULTI-PROFILE MIGRATION
-- ============================================================================
-- This migration fixes the direct conversations system that was partially
-- broken after the multi-profile migration. It updates participants arrays
-- and fixes RLS policies.
-- ============================================================================

BEGIN;

-- ============================================================================
-- PHASE 1: UPDATE PARTICIPANTS ARRAYS TO USE PROFILE IDs
-- ============================================================================

-- Create a function to update participants arrays
CREATE OR REPLACE FUNCTION update_conversation_participants()
RETURNS void AS $$
DECLARE
    conv_record RECORD;
    old_user_id UUID;
    new_profile_id UUID;
    updated_participants UUID[];
BEGIN
    -- Loop through all conversations
    FOR conv_record IN 
        SELECT id, participants FROM direct_conversations
    LOOP
        updated_participants := ARRAY[]::UUID[];
        
        -- For each participant (auth user ID), find their profile ID
        FOREACH old_user_id IN ARRAY conv_record.participants
        LOOP
            -- Find the profile ID for this auth user ID
            SELECT p.id INTO new_profile_id
            FROM profiles p
            WHERE p.user_id = old_user_id
            LIMIT 1; -- Get the first profile for this user
            
            IF new_profile_id IS NOT NULL THEN
                updated_participants := array_append(updated_participants, new_profile_id);
            ELSE
                -- If no profile found, keep the original ID (shouldn't happen)
                RAISE WARNING 'No profile found for user_id: %', old_user_id;
                updated_participants := array_append(updated_participants, old_user_id);
            END IF;
        END LOOP;
        
        -- Update the conversation with new participants array
        UPDATE direct_conversations 
        SET participants = updated_participants
        WHERE id = conv_record.id;
        
        RAISE NOTICE 'Updated conversation % participants from % to %', 
            conv_record.id, conv_record.participants, updated_participants;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Run the function to update all participants
SELECT update_conversation_participants();

-- Drop the function as it's no longer needed
DROP FUNCTION update_conversation_participants();

-- ============================================================================
-- PHASE 2: FIX DIRECT_CONVERSATIONS RLS POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create conversations they're part of" ON direct_conversations;
DROP POLICY IF EXISTS "Users can delete conversations they're part of" ON direct_conversations;
DROP POLICY IF EXISTS "Users can update conversations they're part of" ON direct_conversations;
DROP POLICY IF EXISTS "Users can view their own conversations" ON direct_conversations;

-- Create new policies that work with profile IDs in participants array
CREATE POLICY "Users can create conversations they're part of" ON direct_conversations
    FOR INSERT WITH CHECK (
        -- Check that at least one participant is a profile owned by the current user
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid()
            AND p.id = ANY(participants)
        )
    );

CREATE POLICY "Users can delete conversations they're part of" ON direct_conversations
    FOR DELETE USING (
        -- Check that at least one participant is a profile owned by the current user
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid()
            AND p.id = ANY(participants)
        )
    );

CREATE POLICY "Users can update conversations they're part of" ON direct_conversations
    FOR UPDATE USING (
        -- Check that at least one participant is a profile owned by the current user
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid()
            AND p.id = ANY(participants)
        )
    );

CREATE POLICY "Users can view their own conversations" ON direct_conversations
    FOR SELECT USING (
        -- Check that at least one participant is a profile owned by the current user
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid()
            AND p.id = ANY(participants)
        )
    );

-- ============================================================================
-- PHASE 3: FIX DIRECT_MESSAGES RLS POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Participants can update read_at" ON direct_messages;
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON direct_messages;
DROP POLICY IF EXISTS "Users can view messages from their conversations" ON direct_messages;

-- Create new policies that work with profile IDs
CREATE POLICY "Participants can update read_at" ON direct_messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM direct_conversations dc
            JOIN profiles p ON p.id = ANY(dc.participants)
            WHERE dc.id = direct_messages.conversation_id
            AND p.user_id = auth.uid()
        )
    ) WITH CHECK (true);

CREATE POLICY "Users can send messages to their conversations" ON direct_messages
    FOR INSERT WITH CHECK (
        -- Sender must be a profile owned by the current user
        sender_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
        AND
        -- Conversation must include a profile owned by the current user
        EXISTS (
            SELECT 1 FROM direct_conversations dc
            JOIN profiles p ON p.id = ANY(dc.participants)
            WHERE dc.id = direct_messages.conversation_id
            AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view messages from their conversations" ON direct_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM direct_conversations dc
            JOIN profiles p ON p.id = ANY(dc.participants)
            WHERE dc.id = direct_messages.conversation_id
            AND p.user_id = auth.uid()
        )
    );

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Add to migration log (if table exists)
INSERT INTO migration_log (migration_name, status, notes) 
VALUES (
    'fix_direct_conversations_complete', 
    'completed', 
    'Updated direct_conversations participants arrays to use profile IDs and fixed all RLS policies for direct messaging system after multi-profile migration'
) ON CONFLICT DO NOTHING;

COMMIT;

-- ============================================================================
-- POST-MIGRATION NOTES
-- ============================================================================
-- 
-- This migration completely fixes the direct messaging system after the 
-- multi-profile migration by:
-- 
-- 1. Converting participants arrays from auth user IDs to profile IDs
-- 2. Updating all RLS policies to work with the new profile-based system
-- 
-- Key changes:
-- - direct_conversations.participants now contains profile IDs
-- - RLS policies check: profiles.user_id = auth.uid() AND profiles.id = ANY(participants)
-- - Maintains security while supporting multi-profile architecture
-- - Direct messages are now per-profile, not per-auth-user
-- 
-- This enables proper profile-to-profile messaging within the new architecture.
-- ============================================================================