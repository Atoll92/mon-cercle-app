-- Migration: Fix Post Activity Trigger
-- portfolio_items doesn't have network_id column, need to get it from profile
-- Created: 2025-11-06

-- Drop and recreate the function with correct logic
CREATE OR REPLACE FUNCTION create_post_activity()
RETURNS trigger AS $$
BEGIN
    INSERT INTO activity_feed (network_id, profile_id, activity_type, entity_type, entity_id, activity_text, metadata)
    VALUES (
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

-- Trigger already exists from previous migration, just need to update the function
