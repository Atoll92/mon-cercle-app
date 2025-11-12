-- Fix the news activity trigger to use created_by instead of profile_id
-- network_news table uses created_by field, not profile_id

-- Drop and recreate the function with correct field references
CREATE OR REPLACE FUNCTION create_news_activity()
RETURNS trigger AS $$
BEGIN
    INSERT INTO activity_feed (network_id, profile_id, activity_type, entity_type, entity_id, activity_text, metadata)
    VALUES (
        NEW.network_id,
        NEW.created_by, -- Fixed: was NEW.profile_id, should be NEW.created_by
        'news_created',
        'news',
        NEW.id,
        (SELECT full_name FROM profiles WHERE id = NEW.created_by LIMIT 1) || ' posted an announcement: ' || NEW.title,
        jsonb_build_object(
            'profile_name', (SELECT full_name FROM profiles WHERE id = NEW.created_by LIMIT 1),
            'news_title', NEW.title
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- The trigger is already created, just updating the function
