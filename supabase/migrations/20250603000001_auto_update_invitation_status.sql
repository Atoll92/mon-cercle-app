-- Create a trigger function to automatically update invitation status when a user joins a network
CREATE OR REPLACE FUNCTION update_invitation_status_on_join()
RETURNS TRIGGER AS $$
BEGIN
  -- When a user's network_id is updated (joins a network)
  IF NEW.network_id IS NOT NULL AND (OLD.network_id IS NULL OR OLD.network_id != NEW.network_id) THEN
    -- Update any pending invitations for this user's email to 'accepted'
    UPDATE invitations
    SET status = 'accepted',
        updated_at = NOW()
    WHERE LOWER(email) = LOWER(NEW.contact_email)
      AND network_id = NEW.network_id
      AND status = 'pending';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS update_invitation_status_trigger ON profiles;
CREATE TRIGGER update_invitation_status_trigger
  AFTER UPDATE OF network_id ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_invitation_status_on_join();

-- Add updated_at column to invitations table if it doesn't exist
ALTER TABLE invitations 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add index on email and network_id for better performance
CREATE INDEX IF NOT EXISTS idx_invitations_email_network 
ON invitations(LOWER(email), network_id, status);