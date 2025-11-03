-- Fix invitations.invited_by foreign key to reference profiles.id instead of auth.users.id
-- This aligns with the multi-profile architecture where invitations are network-specific

-- Step 1: Allow NULL values in invited_by column (required for ON DELETE SET NULL to work)
ALTER TABLE invitations
  ALTER COLUMN invited_by DROP NOT NULL;

-- Step 2: Set all existing invited_by values to NULL
-- (We can't reliably map user IDs to profile IDs without knowing network context)
UPDATE invitations SET invited_by = NULL;

-- Step 3: Drop the old foreign key constraint
ALTER TABLE invitations
  DROP CONSTRAINT IF EXISTS invitations_invited_by_fkey;

-- Step 4: Add new foreign key constraint referencing profiles.id
ALTER TABLE invitations
  ADD CONSTRAINT invitations_invited_by_fkey
  FOREIGN KEY (invited_by)
  REFERENCES profiles(id)
  ON DELETE SET NULL;

-- Update comment to reflect the change
COMMENT ON COLUMN invitations.invited_by IS 'Profile ID of the person who sent the invitation (network-specific).';
