-- Create support tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  network_id UUID REFERENCES networks(id) ON DELETE CASCADE,
  submitted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) CHECK (category IN ('technical', 'billing', 'feature', 'bug', 'other')),
  priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  status VARCHAR(20) CHECK (status IN ('open', 'in_progress', 'waiting_response', 'resolved', 'closed')) DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT title_length CHECK (char_length(title) >= 5 AND char_length(title) <= 255),
  CONSTRAINT description_length CHECK (char_length(description) >= 10)
);

-- Create ticket messages table for ticket conversation
CREATE TABLE IF NOT EXISTS ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE, -- For internal notes between super admins
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT message_length CHECK (char_length(message) >= 1)
);

-- Create indexes for performance
CREATE INDEX idx_support_tickets_network_id ON support_tickets(network_id);
CREATE INDEX idx_support_tickets_submitted_by ON support_tickets(submitted_by);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_created_at ON support_tickets(created_at DESC);
CREATE INDEX idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);
CREATE INDEX idx_ticket_messages_created_at ON ticket_messages(created_at);

-- Enable RLS
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for support_tickets

-- Network admins can view their own network's tickets
CREATE POLICY "Network admins can view their network tickets"
  ON support_tickets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.network_id = support_tickets.network_id
      AND profiles.role = 'admin'
    )
  );

-- Super admins can view all tickets
CREATE POLICY "Super admins can view all tickets"
  ON support_tickets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email IN ('arthur.fevrier1@gmail.com', 'vincentfevrier9@gmail.com')
    )
  );

-- Network admins can create tickets for their network
CREATE POLICY "Network admins can create tickets"
  ON support_tickets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.network_id = network_id
      AND profiles.role = 'admin'
    )
  );

-- Super admins can update any ticket
CREATE POLICY "Super admins can update tickets"
  ON support_tickets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email IN ('arthur.fevrier1@gmail.com', 'vincentfevrier9@gmail.com')
    )
  );

-- Network admins can update their own tickets
CREATE POLICY "Network admins can update own tickets"
  ON support_tickets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.network_id = support_tickets.network_id
      AND profiles.role = 'admin'
    )
  );

-- RLS policies for ticket_messages

-- Network admins can view messages for their tickets (excluding internal notes)
CREATE POLICY "Network admins can view ticket messages"
  ON ticket_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM support_tickets st
      JOIN profiles p ON p.id = auth.uid()
      WHERE st.id = ticket_messages.ticket_id
      AND st.network_id = p.network_id
      AND p.role = 'admin'
      AND ticket_messages.is_internal = FALSE
    )
  );

-- Super admins can view all messages
CREATE POLICY "Super admins can view all messages"
  ON ticket_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email IN ('arthur.fevrier1@gmail.com', 'vincentfevrier9@gmail.com')
    )
  );

-- Network admins can send messages to their tickets
CREATE POLICY "Network admins can send messages"
  ON ticket_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_tickets st
      JOIN profiles p ON p.id = auth.uid()
      WHERE st.id = ticket_id
      AND st.network_id = p.network_id
      AND p.role = 'admin'
      AND is_internal = FALSE
    )
  );

-- Super admins can send any message
CREATE POLICY "Super admins can send messages"
  ON ticket_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email IN ('arthur.fevrier1@gmail.com', 'vincentfevrier9@gmail.com')
    )
  );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to get ticket statistics for super admin dashboard
CREATE OR REPLACE FUNCTION get_ticket_statistics()
RETURNS TABLE (
  total_tickets BIGINT,
  open_tickets BIGINT,
  in_progress_tickets BIGINT,
  urgent_tickets BIGINT,
  avg_resolution_time INTERVAL
) AS $$
BEGIN
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