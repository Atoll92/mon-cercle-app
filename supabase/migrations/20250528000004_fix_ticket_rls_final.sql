-- Drop all existing policies first
DROP POLICY IF EXISTS "Network admins can view their network tickets" ON support_tickets;
DROP POLICY IF EXISTS "Network admins can create tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can view ticket messages" ON ticket_messages;
DROP POLICY IF EXISTS "Users can send messages to tickets" ON ticket_messages;
DROP POLICY IF EXISTS "Super admins can view all tickets" ON support_tickets;
DROP POLICY IF EXISTS "Super admins can update tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can update their own tickets" ON support_tickets;

-- Create function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user email matches super admin email or has super_admin role
  RETURN (
    (SELECT auth.jwt() ->> 'email') = 'admin@conclav.com'
    OR 
    (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user is network admin
CREATE OR REPLACE FUNCTION is_network_admin(network_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.network_id = network_uuid
    AND profiles.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies for support_tickets table
CREATE POLICY "Network admins can view their network tickets"
ON support_tickets FOR SELECT
TO authenticated
USING (
  is_network_admin(network_id) OR is_super_admin()
);

CREATE POLICY "Network admins can create tickets"
ON support_tickets FOR INSERT
TO authenticated
WITH CHECK (
  is_network_admin(network_id) 
  AND submitted_by = auth.uid()
);

CREATE POLICY "Network admins can update their own tickets"
ON support_tickets FOR UPDATE
TO authenticated
USING (
  submitted_by = auth.uid() 
  AND is_network_admin(network_id)
)
WITH CHECK (
  submitted_by = auth.uid() 
  AND is_network_admin(network_id)
);

CREATE POLICY "Super admins can update any ticket"
ON support_tickets FOR UPDATE
TO authenticated
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- Policies for ticket_messages table
CREATE POLICY "Users can view messages for accessible tickets"
ON ticket_messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM support_tickets
    WHERE support_tickets.id = ticket_messages.ticket_id
    AND (
      is_network_admin(support_tickets.network_id) 
      OR is_super_admin()
    )
  )
);

CREATE POLICY "Users can send messages to accessible tickets"
ON ticket_messages FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM support_tickets
    WHERE support_tickets.id = ticket_id
    AND (
      is_network_admin(support_tickets.network_id) 
      OR is_super_admin()
    )
  )
);

-- Ensure RLS is enabled
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON support_tickets TO authenticated;
GRANT SELECT, INSERT ON ticket_messages TO authenticated;
GRANT EXECUTE ON FUNCTION is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_network_admin(UUID) TO authenticated;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_network_id ON support_tickets(network_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_submitted_by ON support_tickets(submitted_by);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_sender_id ON ticket_messages(sender_id);