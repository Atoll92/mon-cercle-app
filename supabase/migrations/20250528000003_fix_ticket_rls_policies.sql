-- Drop existing policies
DROP POLICY IF EXISTS "Network admins can view their network tickets" ON support_tickets;
DROP POLICY IF EXISTS "Network admins can create tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can view ticket messages" ON ticket_messages;
DROP POLICY IF EXISTS "Users can send messages to tickets" ON ticket_messages;
DROP POLICY IF EXISTS "Super admins can view all tickets" ON support_tickets;
DROP POLICY IF EXISTS "Super admins can update tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can update their own tickets" ON support_tickets;

-- Create fixed policies for support_tickets
CREATE POLICY "Network admins can view their network tickets"
ON support_tickets FOR SELECT
TO authenticated
USING (
  network_id IN (
    SELECT network_id FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Network admins can create tickets"
ON support_tickets FOR INSERT
TO authenticated
WITH CHECK (
  network_id IN (
    SELECT network_id FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
  AND submitted_by = auth.uid()
);

CREATE POLICY "Super admins can view all tickets"
ON support_tickets FOR SELECT
TO authenticated
USING (
  (SELECT auth.jwt() ->> 'email') = 'admin@conclav.com'
  OR (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
);

CREATE POLICY "Super admins can update tickets"
ON support_tickets FOR UPDATE
TO authenticated
USING (
  (SELECT auth.jwt() ->> 'email') = 'admin@conclav.com'
  OR (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
);

CREATE POLICY "Users can update their own tickets"
ON support_tickets FOR UPDATE
TO authenticated
USING (submitted_by = auth.uid())
WITH CHECK (submitted_by = auth.uid());

-- Create fixed policies for ticket_messages
CREATE POLICY "Users can view messages for their tickets"
ON ticket_messages FOR SELECT
TO authenticated
USING (
  ticket_id IN (
    SELECT id FROM support_tickets
    WHERE network_id IN (
      SELECT network_id FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
  OR
  (SELECT auth.jwt() ->> 'email') = 'admin@conclav.com'
  OR
  (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
);

CREATE POLICY "Users can send messages to their tickets"
ON ticket_messages FOR INSERT
TO authenticated
WITH CHECK (
  (
    ticket_id IN (
      SELECT id FROM support_tickets
      WHERE network_id IN (
        SELECT network_id FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
      )
    )
    OR
    (SELECT auth.jwt() ->> 'email') = 'admin@conclav.com'
    OR
    (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
  )
  AND sender_id = auth.uid()
);

-- Update the get_ticket_details function to avoid users table reference
CREATE OR REPLACE FUNCTION get_ticket_details(ticket_uuid UUID)
RETURNS TABLE (
  id UUID,
  network_id UUID,
  submitted_by UUID,
  assigned_to UUID,
  title TEXT,
  description TEXT,
  category TEXT,
  priority TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  messages JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH ticket_messages_agg AS (
    SELECT 
      tm.ticket_id,
      jsonb_agg(
        jsonb_build_object(
          'id', tm.id,
          'message', tm.message,
          'sender_id', tm.sender_id,
          'created_at', tm.created_at,
          'sender', jsonb_build_object(
            'id', p.id,
            'full_name', p.full_name,
            'profile_picture_url', p.profile_picture_url,
            'role', p.role
          )
        ) ORDER BY tm.created_at
      ) AS messages
    FROM ticket_messages tm
    LEFT JOIN profiles p ON tm.sender_id = p.id
    WHERE tm.ticket_id = ticket_uuid
    GROUP BY tm.ticket_id
  )
  SELECT 
    t.*,
    COALESCE(tma.messages, '[]'::jsonb) as messages
  FROM support_tickets t
  LEFT JOIN ticket_messages_agg tma ON t.id = tma.ticket_id
  WHERE t.id = ticket_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT ON profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON support_tickets TO authenticated;
GRANT SELECT, INSERT ON ticket_messages TO authenticated;