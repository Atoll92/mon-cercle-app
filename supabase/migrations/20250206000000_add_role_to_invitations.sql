-- Add role field to network_invitation_links table
ALTER TABLE network_invitation_links 
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'member' 
CHECK (role IN ('admin', 'member'));

-- Add role field to invitations table if not exists
ALTER TABLE invitations 
ALTER COLUMN role SET DEFAULT 'member';

-- Update the join network function to use role from invitation
CREATE OR REPLACE FUNCTION join_network_via_invitation_with_role(
  invitation_code VARCHAR,
  user_id UUID,
  invitee_email VARCHAR DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  network_id UUID,
  assigned_role VARCHAR
) AS $$
DECLARE
  v_invitation RECORD;
  v_network_id UUID;
  v_role VARCHAR;
BEGIN
  -- Get invitation details
  SELECT * INTO v_invitation
  FROM network_invitation_links
  WHERE code = invitation_code
    AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (max_uses IS NULL OR uses_count < max_uses);
  
  IF v_invitation IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::VARCHAR;
    RETURN;
  END IF;
  
  v_network_id := v_invitation.network_id;
  v_role := COALESCE(v_invitation.role, 'member');
  
  -- Update user profile with network and role
  UPDATE profiles
  SET network_id = v_network_id,
      role = v_role,
      updated_at = NOW()
  WHERE id = user_id;
  
  -- Increment usage count
  UPDATE network_invitation_links
  SET uses_count = uses_count + 1,
      updated_at = NOW()
  WHERE code = invitation_code;
  
  -- Update email invitation status if applicable
  IF invitee_email IS NOT NULL THEN
    UPDATE invitations
    SET status = 'accepted'
    WHERE email = invitee_email
      AND network_id = v_network_id
      AND status = 'pending';
  END IF;
  
  RETURN QUERY SELECT TRUE, v_network_id, v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;