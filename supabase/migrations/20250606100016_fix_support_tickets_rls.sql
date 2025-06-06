-- ============================================================================
-- FIX SUPPORT_TICKETS RLS POLICIES AFTER MULTI-PROFILE MIGRATION
-- ============================================================================
-- This migration fixes the RLS policies for support_tickets and ticket_messages 
-- that were still using auth.uid() for profile_id comparisons after the migration
-- ============================================================================

BEGIN;

-- ============================================================================
-- FIX SUPPORT_TICKETS RLS POLICIES
-- ============================================================================

-- Drop existing policies that use incorrect auth.uid() comparisons
DROP POLICY IF EXISTS "Network admins can view tickets" ON support_tickets;
DROP POLICY IF EXISTS "Network admins can create tickets" ON support_tickets;
DROP POLICY IF EXISTS "Network admins can update tickets" ON support_tickets;
DROP POLICY IF EXISTS "Super admins can view all tickets" ON support_tickets;
DROP POLICY IF EXISTS "Super admins can update all tickets" ON support_tickets;

-- Create new SELECT policy for network admins and super admins
CREATE POLICY "Network admins can view tickets" ON support_tickets
    FOR SELECT USING (
        -- Network admins can view tickets from their networks
        (network_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.network_id = support_tickets.network_id
            AND profiles.role = 'admin'
        ))
        OR
        -- Super admins can view all tickets (including system tickets)
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'super_admin'
        )
        OR
        -- Users can view tickets they submitted
        (submitted_by IS NOT NULL AND submitted_by IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        ))
    );

-- Create new INSERT policy for network admins and system
CREATE POLICY "Network admins can create tickets" ON support_tickets
    FOR INSERT WITH CHECK (
        -- Network admins can create tickets for their networks
        (network_id IS NOT NULL AND submitted_by IS NOT NULL AND EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.network_id = support_tickets.network_id
            AND profiles.role = 'admin'
            AND profiles.id = support_tickets.submitted_by
        ))
        OR
        -- System can create tickets (network_id=NULL, submitted_by=NULL)
        (network_id IS NULL AND submitted_by IS NULL)
        OR
        -- Super admins can create any tickets
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

-- Create new UPDATE policy for network admins and super admins
CREATE POLICY "Network admins can update tickets" ON support_tickets
    FOR UPDATE USING (
        -- Network admins can update tickets from their networks
        (network_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.network_id = support_tickets.network_id
            AND profiles.role = 'admin'
        ))
        OR
        -- Super admins can update all tickets
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

-- ============================================================================
-- FIX TICKET_MESSAGES RLS POLICIES
-- ============================================================================

-- Drop existing policies that use incorrect auth.uid() comparisons
DROP POLICY IF EXISTS "Users can view ticket messages" ON ticket_messages;
DROP POLICY IF EXISTS "Users can send ticket messages" ON ticket_messages;

-- Create new SELECT policy for ticket messages
CREATE POLICY "Users can view ticket messages" ON ticket_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM support_tickets st
            WHERE st.id = ticket_messages.ticket_id
            AND (
                -- Network admins can view messages for their network tickets
                (st.network_id IS NOT NULL AND EXISTS (
                    SELECT 1 FROM profiles
                    WHERE profiles.user_id = auth.uid()
                    AND profiles.network_id = st.network_id
                    AND profiles.role = 'admin'
                ))
                OR
                -- Super admins can view all messages
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE profiles.user_id = auth.uid()
                    AND profiles.role = 'super_admin'
                )
                OR
                -- Users can view messages for tickets they submitted
                (st.submitted_by IS NOT NULL AND st.submitted_by IN (
                    SELECT id FROM profiles WHERE user_id = auth.uid()
                ))
            )
        )
    );

-- Create new INSERT policy for ticket messages
CREATE POLICY "Users can send ticket messages" ON ticket_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM support_tickets st
            WHERE st.id = ticket_messages.ticket_id
            AND (
                -- Network admins can send messages for their network tickets
                (st.network_id IS NOT NULL AND EXISTS (
                    SELECT 1 FROM profiles
                    WHERE profiles.user_id = auth.uid()
                    AND profiles.network_id = st.network_id
                    AND profiles.role = 'admin'
                ))
                OR
                -- Super admins can send messages to any tickets
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE profiles.user_id = auth.uid()
                    AND profiles.role = 'super_admin'
                )
                OR
                -- System can send messages (sender_id=NULL)
                sender_id IS NULL
            )
        )
    );

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Add to migration log (if table exists)
INSERT INTO migration_log (migration_name, status, notes) 
VALUES (
    'fix_support_tickets_rls', 
    'completed', 
    'Fixed RLS policies for support_tickets and ticket_messages to use profile relationships instead of direct auth.uid() comparisons after multi-profile migration'
) ON CONFLICT DO NOTHING;

COMMIT;

-- ============================================================================
-- POST-MIGRATION NOTES
-- ============================================================================
-- 
-- This migration fixes the RLS policies for support tickets after the multi-profile migration.
-- 
-- Key changes:
-- - support_tickets: Network admin checks now use profiles.user_id = auth.uid() AND profiles.network_id = support_tickets.network_id
-- - support_tickets: User submission checks now use submitted_by IN (SELECT id FROM profiles WHERE user_id = auth.uid())
-- - support_tickets: Super admin checks now use profiles.user_id = auth.uid() AND profiles.role = 'super_admin'
-- - ticket_messages: Access controlled through support_tickets relationship
-- 
-- This maintains security while supporting the new multi-profile architecture
-- where network admins can manage tickets across their different network profiles.
-- ============================================================================