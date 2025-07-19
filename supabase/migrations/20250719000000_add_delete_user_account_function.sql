-- Add function to delete user account
-- This function handles the complete deletion of a user and all their associated data

CREATE OR REPLACE FUNCTION delete_user_account(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Check if the calling user is the same as the user to be deleted
  IF auth.uid() != user_id THEN
    RAISE EXCEPTION 'You can only delete your own account';
  END IF;

  -- Delete all profiles (cascade will handle related data)
  DELETE FROM profiles WHERE profiles.user_id = user_id;

  -- Delete user from auth.users (this will sign them out)
  -- Note: Supabase will handle cleanup of auth-related data
  DELETE FROM auth.users WHERE id = user_id;

  -- If we reach here, the deletion was successful
  RETURN;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user_account(uuid) TO authenticated;

-- Add comment
COMMENT ON FUNCTION delete_user_account(uuid) IS 'Deletes a user account and all associated data. Can only be called by the user themselves.';