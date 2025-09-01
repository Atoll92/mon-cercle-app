-- Fix ambiguous column reference in delete_user_account function
-- The issue was that 'user_id' is both a parameter name and a column name in profiles table

-- Drop the existing function first (required to change parameter names)
DROP FUNCTION IF EXISTS delete_user_account(uuid);

-- Recreate the function with renamed parameter to avoid ambiguity
CREATE OR REPLACE FUNCTION delete_user_account(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Check if the calling user is the same as the user to be deleted
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'You can only delete your own account';
  END IF;

  -- Delete all profiles (cascade will handle related data)
  -- Fixed: Use table qualifier to avoid ambiguity
  DELETE FROM profiles WHERE profiles.user_id = p_user_id;

  -- Delete user from auth.users (this will sign them out)
  -- Note: Supabase will handle cleanup of auth-related data
  DELETE FROM auth.users WHERE id = p_user_id;

  -- If we reach here, the deletion was successful
  RETURN;
END;
$$;

-- Grant execute permission to authenticated users (already exists, but safe to re-grant)
GRANT EXECUTE ON FUNCTION delete_user_account(uuid) TO authenticated;

-- Update comment
COMMENT ON FUNCTION delete_user_account(uuid) IS 'Deletes a user account and all associated data. Can only be called by the user themselves. Fixed ambiguous column reference issue.';