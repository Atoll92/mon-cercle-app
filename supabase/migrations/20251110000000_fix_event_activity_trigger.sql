-- Migration: Fix Event Activity Trigger
-- network_events uses 'created_by' not 'profile_id'
-- Created: 2025-11-10

-- Drop and recreate the function with correct column name
CREATE OR REPLACE FUNCTION create_event_activity()
RETURNS trigger AS $$
BEGIN
    INSERT INTO activity_feed (network_id, profile_id, activity_type, entity_type, entity_id, activity_text, metadata)
    VALUES (
        NEW.network_id,
        NEW.created_by, -- Fixed: was NEW.profile_id, should be NEW.created_by
        'event_created',
        'event',
        NEW.id,
        (SELECT full_name FROM profiles WHERE id = NEW.created_by LIMIT 1) || ' created an event: ' || NEW.title,
        jsonb_build_object(
            'profile_name', (SELECT full_name FROM profiles WHERE id = NEW.created_by LIMIT 1),
            'event_title', NEW.title,
            'event_date', NEW.date
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger already exists from previous migration (20251106000001_activity_feed_system.sql)
-- Just updating the function is sufficient
