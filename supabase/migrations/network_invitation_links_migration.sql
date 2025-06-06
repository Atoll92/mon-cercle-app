-- Create network invitation links table
CREATE TABLE IF NOT EXISTS network_invitation_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  network_id UUID NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255), -- Optional name for the link (e.g., "Main invite", "Event 2024")
  description TEXT,
  max_uses INTEGER, -- NULL means unlimited
  uses_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE, -- NULL means never expires
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_invitation_links_network_id ON network_invitation_links(network_id);
CREATE INDEX idx_invitation_links_code ON network_invitation_links(code);
CREATE INDEX idx_invitation_links_active ON network_invitation_links(is_active);

-- Enable RLS
ALTER TABLE network_invitation_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- View invitation links: Network admins can view their network's links
CREATE POLICY "Network admins can view invitation links" ON network_invitation_links
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.network_id = network_invitation_links.network_id
      AND profiles.role = 'admin'
    )
  );

-- Create invitation links: Network admins can create links
CREATE POLICY "Network admins can create invitation links" ON network_invitation_links
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.network_id = network_invitation_links.network_id
      AND profiles.role = 'admin'
    )
  );

-- Update invitation links: Network admins can update their links
CREATE POLICY "Network admins can update invitation links" ON network_invitation_links
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.network_id = network_invitation_links.network_id
      AND profiles.role = 'admin'
    )
  );

-- Delete invitation links: Network admins can delete their links
CREATE POLICY "Network admins can delete invitation links" ON network_invitation_links
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.network_id = network_invitation_links.network_id
      AND profiles.role = 'admin'
    )
  );

-- Public can view active links by code (for joining)
CREATE POLICY "Public can view active invitation links by code" ON network_invitation_links
  FOR SELECT USING (
    is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (max_uses IS NULL OR uses_count < max_uses)
  );

-- Function to increment uses count
CREATE OR REPLACE FUNCTION increment_invitation_link_uses(link_code VARCHAR)
RETURNS VOID AS $$
BEGIN
  UPDATE network_invitation_links
  SET uses_count = uses_count + 1,
      updated_at = NOW()
  WHERE code = link_code;
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique invitation code
CREATE OR REPLACE FUNCTION generate_invitation_code()
RETURNS VARCHAR AS $$
DECLARE
  new_code VARCHAR;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 8-character code
    new_code := upper(substring(md5(random()::text) from 1 for 8));
    
    -- Check if code already exists
    SELECT EXISTS (
      SELECT 1 FROM network_invitation_links WHERE code = new_code
    ) INTO code_exists;
    
    -- If code doesn't exist, return it
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;