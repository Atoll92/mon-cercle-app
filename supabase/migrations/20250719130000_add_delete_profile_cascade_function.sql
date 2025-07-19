-- Migration: Add function to handle cascading profile deletion
-- This function bypasses RLS policies and handles all foreign key constraints

CREATE OR REPLACE FUNCTION public.delete_profile_cascade(profile_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_message TEXT := '';
  dm_count INTEGER := 0;
  messages_count INTEGER := 0;
  portfolio_count INTEGER := 0;
  notifications_count INTEGER := 0;
BEGIN
  -- Check if profile exists
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = profile_id_param) THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Profile not found'
    );
  END IF;

  -- Count and delete direct messages where this profile is the sender
  SELECT COUNT(*) INTO dm_count 
  FROM direct_messages 
  WHERE sender_id = profile_id_param;
  
  IF dm_count > 0 THEN
    DELETE FROM direct_messages WHERE sender_id = profile_id_param;
    result_message := result_message || dm_count || ' direct messages deleted. ';
  END IF;

  -- Count and delete network messages
  SELECT COUNT(*) INTO messages_count 
  FROM messages 
  WHERE user_id = profile_id_param;
  
  IF messages_count > 0 THEN
    DELETE FROM messages WHERE user_id = profile_id_param;
    result_message := result_message || messages_count || ' network messages deleted. ';
  END IF;

  -- Count and delete portfolio items
  SELECT COUNT(*) INTO portfolio_count 
  FROM portfolio_items 
  WHERE profile_id = profile_id_param;
  
  IF portfolio_count > 0 THEN
    DELETE FROM portfolio_items WHERE profile_id = profile_id_param;
    result_message := result_message || portfolio_count || ' portfolio items deleted. ';
  END IF;

  -- Count and delete notification queue entries
  SELECT COUNT(*) INTO notifications_count 
  FROM notification_queue 
  WHERE recipient_id = profile_id_param;
  
  IF notifications_count > 0 THEN
    DELETE FROM notification_queue WHERE recipient_id = profile_id_param;
    result_message := result_message || notifications_count || ' notifications deleted. ';
  END IF;

  -- Delete from other tables that might reference this profile
  -- Only delete if the column exists to avoid errors
  
  -- Check and delete from badges
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'badges' AND column_name = 'profile_id') THEN
    DELETE FROM badges WHERE profile_id = profile_id_param;
  END IF;
  
  -- Check and delete from engagement_stats  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'engagement_stats' AND column_name = 'profile_id') THEN
    DELETE FROM engagement_stats WHERE profile_id = profile_id_param;
  END IF;
  
  -- Check and delete from event_participations
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_participations' AND column_name = 'profile_id') THEN
    DELETE FROM event_participations WHERE profile_id = profile_id_param;
  END IF;
  
  -- Check and delete from wiki_pages
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wiki_pages' AND column_name = 'created_by') THEN
    DELETE FROM wiki_pages WHERE created_by = profile_id_param;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wiki_pages' AND column_name = 'updated_by') THEN
    DELETE FROM wiki_pages WHERE updated_by = profile_id_param;
  END IF;
  
  -- Check and delete from moodboards
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'moodboards' AND column_name = 'created_by') THEN
    DELETE FROM moodboards WHERE created_by = profile_id_param;
  END IF;
  
  -- Check and delete from network_poll_votes
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'network_poll_votes' AND column_name = 'profile_id') THEN
    DELETE FROM network_poll_votes WHERE profile_id = profile_id_param;
  END IF;
  
  -- Check and delete from social_wall_comments
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_wall_comments' AND column_name = 'profile_id') THEN
    DELETE FROM social_wall_comments WHERE profile_id = profile_id_param;
  END IF;

  -- Update tables where we want to preserve the data but remove the reference
  UPDATE network_news SET created_by = NULL WHERE created_by = profile_id_param;
  UPDATE network_events SET created_by = NULL WHERE created_by = profile_id_param;
  UPDATE invitations SET invited_by = NULL WHERE invited_by = profile_id_param;

  -- Finally, delete the profile
  DELETE FROM profiles WHERE id = profile_id_param;

  result_message := result_message || 'Profile deleted successfully.';

  RETURN jsonb_build_object(
    'success', true,
    'message', result_message,
    'direct_messages_deleted', dm_count,
    'network_messages_deleted', messages_count,
    'portfolio_items_deleted', portfolio_count,
    'notifications_deleted', notifications_count
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Error deleting profile: ' || SQLERRM
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_profile_cascade(UUID) TO authenticated;

-- Add comment explaining the function
COMMENT ON FUNCTION public.delete_profile_cascade(UUID) IS 
'Safely delete a profile and all its related data, handling foreign key constraints. 
This function runs with SECURITY DEFINER to bypass RLS policies that may prevent 
client-side deletion of related records.';