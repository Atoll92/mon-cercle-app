-- ========================================
-- FIX: Post Activity Trigger
-- ========================================
-- Run this in the Supabase SQL Editor to fix the post creation error
-- Error: record "new" has no field "network_id"
-- Reason: portfolio_items table doesn't have network_id, we need to get it from profiles

-- Drop and recreate the function with correct logic
CREATE OR REPLACE FUNCTION create_post_activity()
RETURNS trigger AS $$
BEGIN
    INSERT INTO activity_feed (network_id, profile_id, activity_type, entity_type, entity_id, activity_text, metadata)
    VALUES (
        -- Get network_id from the profile, not from the post
        (SELECT network_id FROM profiles WHERE id = NEW.profile_id LIMIT 1),
        NEW.profile_id,
        'post_created',
        'post',
        NEW.id,
        (SELECT full_name FROM profiles WHERE id = NEW.profile_id LIMIT 1) || ' created a new post: ' || NEW.title,
        jsonb_build_object(
            'profile_name', (SELECT full_name FROM profiles WHERE id = NEW.profile_id LIMIT 1),
            'post_title', NEW.title
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- The trigger already exists, we just updated the function
-- Test by creating a post - it should now work!
