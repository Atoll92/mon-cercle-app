-- Update delete_profile_cascade function to use unified comments table
-- This migration updates the function to reference the new unified comments table
-- instead of the old social_wall_comments table

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
  comments_count INTEGER := 0;
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

  -- Count and delete comments from unified comments table
  SELECT COUNT(*) INTO comments_count 
  FROM comments 
  WHERE profile_id = profile_id_param;
  
  IF comments_count > 0 THEN
    DELETE FROM comments WHERE profile_id = profile_id_param;
    result_message := result_message || comments_count || ' comments deleted. ';
  END IF;

  -- Delete from other tables that might reference this profile (with error handling)
  BEGIN
    DELETE FROM badges WHERE profile_id = profile_id_param;
  EXCEPTION
    WHEN undefined_column THEN
      -- Column doesn't exist, skip
      NULL;
  END;
  
  BEGIN
    DELETE FROM engagement_stats WHERE profile_id = profile_id_param;
  EXCEPTION
    WHEN undefined_column THEN
      NULL;
  END;
  
  BEGIN
    DELETE FROM event_participations WHERE profile_id = profile_id_param;
  EXCEPTION
    WHEN undefined_column THEN
      NULL;
  END;
  
  BEGIN
    DELETE FROM wiki_pages WHERE created_by = profile_id_param OR updated_by = profile_id_param;
  EXCEPTION
    WHEN undefined_column THEN
      NULL;
  END;
  
  BEGIN
    DELETE FROM moodboards WHERE created_by = profile_id_param;
  EXCEPTION
    WHEN undefined_column THEN
      NULL;
  END;
  
  BEGIN
    DELETE FROM network_poll_votes WHERE profile_id = profile_id_param;
  EXCEPTION
    WHEN undefined_column THEN
      NULL;
  END;

  -- Update tables where we want to preserve the data but remove the reference
  UPDATE network_news SET created_by = NULL WHERE created_by = profile_id_param;
  UPDATE network_events SET created_by = NULL WHERE created_by = profile_id_param;
  UPDATE invitations SET invited_by = NULL WHERE invited_by = profile_id_param;
  
  -- Update comments to remove hidden_by reference
  UPDATE comments SET hidden_by = NULL WHERE hidden_by = profile_id_param;

  -- Finally, delete the profile
  DELETE FROM profiles WHERE id = profile_id_param;

  result_message := result_message || 'Profile deleted successfully.';

  RETURN jsonb_build_object(
    'success', true,
    'message', result_message,
    'direct_messages_deleted', dm_count,
    'network_messages_deleted', messages_count,
    'portfolio_items_deleted', portfolio_count,
    'notifications_deleted', notifications_count,
    'comments_deleted', comments_count
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Error deleting profile: ' || SQLERRM
    );
END;
$$;