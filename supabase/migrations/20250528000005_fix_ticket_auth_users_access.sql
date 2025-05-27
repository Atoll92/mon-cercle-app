-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Network admins can view their network tickets" ON support_tickets;
DROP POLICY IF EXISTS "Network admins can create tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can view ticket messages" ON ticket_messages;
DROP POLICY IF EXISTS "Users can send messages to tickets" ON ticket_messages;
DROP POLICY IF EXISTS "Super admins can view all tickets" ON support_tickets;
DROP POLICY IF EXISTS "Super admins can update tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can update their own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Network admins can update their own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Network admins can update own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Super admins can update any ticket" ON support_tickets;
DROP POLICY IF EXISTS "Network admins can view their tickets" ON support_tickets;
DROP POLICY IF EXISTS "Network admins can view ticket messages" ON ticket_messages;
DROP POLICY IF EXISTS "Super admins can view all messages" ON ticket_messages;
DROP POLICY IF EXISTS "Network admins can send messages" ON ticket_messages;
DROP POLICY IF EXISTS "Super admins can send messages" ON ticket_messages;
DROP POLICY IF EXISTS "Users can view messages for accessible tickets" ON ticket_messages;
DROP POLICY IF EXISTS "Users can send messages to accessible tickets" ON ticket_messages;

-- Drop old functions if they exist
DROP FUNCTION IF EXISTS is_super_admin();
DROP FUNCTION IF EXISTS is_network_admin(UUID);

-- Create improved super admin check function that doesn't access auth.users
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Get the current user's email from the JWT claims
  user_email := current_setting('request.jwt.claims', true)::json->>'email';
  
  -- Check if the email matches super admin emails
  RETURN user_email IN ('arthur.fevrier1@gmail.com', 'vincentfevrier9@gmail.com', 'admin@conclav.com');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create network admin check function
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
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_network_admin(UUID) TO authenticated;

-- Policies for support_tickets table
CREATE POLICY "View tickets - network admins and super admins"
ON support_tickets FOR SELECT
TO authenticated
USING (
  is_network_admin(network_id) OR is_super_admin()
);

CREATE POLICY "Create tickets - network admins"
ON support_tickets FOR INSERT
TO authenticated
WITH CHECK (
  is_network_admin(network_id) 
  AND submitted_by = auth.uid()
);

CREATE POLICY "Update tickets - network admins their own"
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

CREATE POLICY "Update tickets - super admins any"
ON support_tickets FOR UPDATE
TO authenticated
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- Policies for ticket_messages table
CREATE POLICY "View messages - accessible tickets"
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

CREATE POLICY "Send messages - accessible tickets"
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

-- Add indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_support_tickets_network_id ON support_tickets(network_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_submitted_by ON support_tickets(submitted_by);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_sender_id ON ticket_messages(sender_id);

-- Ensure the get_ticket_statistics function exists and has proper permissions
CREATE OR REPLACE FUNCTION get_ticket_statistics()
RETURNS TABLE (
  total_tickets BIGINT,
  open_tickets BIGINT,
  in_progress_tickets BIGINT,
  urgent_tickets BIGINT,
  avg_resolution_time INTERVAL
) AS $$
BEGIN
  -- Only allow super admins to get statistics
  IF NOT is_super_admin() THEN
    RAISE EXCEPTION 'Access denied. Super admin privileges required.';
  END IF;

  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_tickets,
    COUNT(*) FILTER (WHERE status = 'open')::BIGINT as open_tickets,
    COUNT(*) FILTER (WHERE status = 'in_progress')::BIGINT as in_progress_tickets,
    COUNT(*) FILTER (WHERE priority = 'urgent' AND status NOT IN ('resolved', 'closed'))::BIGINT as urgent_tickets,
    AVG(resolved_at - created_at) FILTER (WHERE resolved_at IS NOT NULL) as avg_resolution_time
  FROM support_tickets;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_ticket_statistics() TO authenticated;