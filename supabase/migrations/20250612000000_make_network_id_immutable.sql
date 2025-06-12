-- Make network_id NOT NULL and add constraint to prevent updates
-- This migration enforces that all profiles must belong to a network

-- First, delete any profiles that have null network_id (cleanup)
DELETE FROM profiles WHERE network_id IS NULL;

-- Make network_id NOT NULL
ALTER TABLE profiles 
ALTER COLUMN network_id SET NOT NULL;

-- Add a constraint to ensure network_id exists in networks table
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_network_id_fkey,
ADD CONSTRAINT profiles_network_id_fkey 
  FOREIGN KEY (network_id) 
  REFERENCES networks(id) 
  ON DELETE CASCADE; -- When a network is deleted, delete all its profiles

-- Create a function to prevent network_id updates
CREATE OR REPLACE FUNCTION prevent_network_id_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow INSERT operations
  IF TG_OP = 'INSERT' THEN
    RETURN NEW;
  END IF;
  
  -- For UPDATE operations, check if network_id is being changed
  IF TG_OP = 'UPDATE' AND OLD.network_id IS DISTINCT FROM NEW.network_id THEN
    RAISE EXCEPTION 'Cannot change network_id after profile creation. Delete and recreate the profile to change networks.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger to enforce network_id immutability
DROP TRIGGER IF EXISTS enforce_network_id_immutable ON profiles;
CREATE TRIGGER enforce_network_id_immutable
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_network_id_update();

-- Add helpful comments
COMMENT ON COLUMN profiles.network_id IS 'Network this profile belongs to. Cannot be changed after creation.';
COMMENT ON CONSTRAINT profiles_network_id_fkey ON profiles IS 'Ensures profiles are deleted when their network is deleted.';
COMMENT ON FUNCTION prevent_network_id_update() IS 'Prevents changing network_id after profile creation. Profiles are tied to their network.';

-- Update the unique constraint to ensure it includes network_id
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_user_id_network_id_key;

ALTER TABLE profiles
ADD CONSTRAINT profiles_user_id_network_id_key 
  UNIQUE (user_id, network_id);