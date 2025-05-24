-- Create network_polls table
CREATE TABLE IF NOT EXISTS network_polls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  network_id UUID NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  poll_type VARCHAR(50) NOT NULL CHECK (poll_type IN ('multiple_choice', 'yes_no', 'date_picker')),
  options JSONB, -- For multiple choice options or date ranges
  allow_multiple_votes BOOLEAN DEFAULT FALSE, -- For multiple choice polls
  is_anonymous BOOLEAN DEFAULT TRUE,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'closed')),
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create network_poll_votes table
CREATE TABLE IF NOT EXISTS network_poll_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_id UUID NOT NULL REFERENCES network_polls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  selected_options JSONB NOT NULL, -- Array of selected option IDs or dates
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(poll_id, user_id) -- One vote per user per poll
);

-- Add indexes
CREATE INDEX idx_network_polls_network_id ON network_polls(network_id);
CREATE INDEX idx_network_polls_status ON network_polls(status);
CREATE INDEX idx_network_polls_created_at ON network_polls(created_at);
CREATE INDEX idx_network_poll_votes_poll_id ON network_poll_votes(poll_id);
CREATE INDEX idx_network_poll_votes_user_id ON network_poll_votes(user_id);

-- Enable RLS
ALTER TABLE network_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_poll_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for network_polls
-- View polls: Network members can view active polls in their network
CREATE POLICY "Network members can view polls" ON network_polls
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.network_id = network_polls.network_id
    )
  );

-- Create polls: Network admins can create polls
CREATE POLICY "Network admins can create polls" ON network_polls
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.network_id = network_polls.network_id
      AND profiles.role = 'admin'
    )
  );

-- Update polls: Poll creators and network admins can update polls
CREATE POLICY "Poll creators and admins can update polls" ON network_polls
  FOR UPDATE USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.network_id = network_polls.network_id
      AND profiles.role = 'admin'
    )
  );

-- Delete polls: Poll creators and network admins can delete polls
CREATE POLICY "Poll creators and admins can delete polls" ON network_polls
  FOR DELETE USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.network_id = network_polls.network_id
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for network_poll_votes
-- View votes: Users can view their own votes, admins can view all votes in their network
CREATE POLICY "Users can view their own votes" ON network_poll_votes
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN network_polls np ON np.network_id = p.network_id
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
      AND np.id = network_poll_votes.poll_id
    )
  );

-- Create votes: Network members can vote on polls in their network
CREATE POLICY "Network members can vote" ON network_poll_votes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN network_polls np ON np.network_id = p.network_id
      WHERE p.id = auth.uid()
      AND np.id = poll_id
      AND np.status = 'active'
      AND (np.starts_at IS NULL OR np.starts_at <= NOW())
      AND (np.ends_at IS NULL OR np.ends_at > NOW())
    )
  );

-- Update votes: Users can update their own votes
CREATE POLICY "Users can update their own votes" ON network_poll_votes
  FOR UPDATE USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM network_polls np
      WHERE np.id = poll_id
      AND np.status = 'active'
      AND (np.ends_at IS NULL OR np.ends_at > NOW())
    )
  );

-- Delete votes: Users can delete their own votes
CREATE POLICY "Users can delete their own votes" ON network_poll_votes
  FOR DELETE USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM network_polls np
      WHERE np.id = poll_id
      AND np.status = 'active'
      AND (np.ends_at IS NULL OR np.ends_at > NOW())
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_network_polls_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_network_polls_updated_at
  BEFORE UPDATE ON network_polls
  FOR EACH ROW
  EXECUTE FUNCTION update_network_polls_updated_at();