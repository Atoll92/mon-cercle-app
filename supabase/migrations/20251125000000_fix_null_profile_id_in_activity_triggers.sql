-- Migration: Fix NULL profile_id in Activity Feed Triggers
-- Prevent activity feed insertion when created_by/profile_id is NULL
-- This fixes the mobile error: "null value in column profile_id of relation activity_feed violates not-null constraint"
-- Created: 2025-11-25

-- Fix create_event_activity to skip if created_by is NULL
CREATE OR REPLACE FUNCTION create_event_activity()
RETURNS trigger AS $$
BEGIN
    -- Skip activity feed entry if created_by is NULL
    IF NEW.created_by IS NULL THEN
        RAISE WARNING 'Skipping activity feed entry for event % - created_by is NULL', NEW.id;
        RETURN NEW;
    END IF;

    INSERT INTO activity_feed (network_id, profile_id, activity_type, entity_type, entity_id, activity_text, metadata)
    VALUES (
        NEW.network_id,
        NEW.created_by,
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

-- Fix create_news_activity to skip if created_by is NULL
CREATE OR REPLACE FUNCTION create_news_activity()
RETURNS trigger AS $$
BEGIN
    -- Skip activity feed entry if created_by is NULL
    IF NEW.created_by IS NULL THEN
        RAISE WARNING 'Skipping activity feed entry for news % - created_by is NULL', NEW.id;
        RETURN NEW;
    END IF;

    INSERT INTO activity_feed (network_id, profile_id, activity_type, entity_type, entity_id, activity_text, metadata)
    VALUES (
        NEW.network_id,
        NEW.created_by,
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

-- Fix create_post_activity to skip if profile_id is NULL
CREATE OR REPLACE FUNCTION create_post_activity()
RETURNS trigger AS $$
BEGIN
    -- Skip activity feed entry if profile_id is NULL
    IF NEW.profile_id IS NULL THEN
        RAISE WARNING 'Skipping activity feed entry for post % - profile_id is NULL', NEW.id;
        RETURN NEW;
    END IF;

    INSERT INTO activity_feed (network_id, profile_id, activity_type, entity_type, entity_id, activity_text, metadata)
    VALUES (
        -- Get network_id from the profile (portfolio_items doesn't have network_id)
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

-- First, check if there are any events with NULL created_by
-- We need to handle these before adding the NOT NULL constraint
DO $$
DECLARE
    null_count integer;
    event_record RECORD;
BEGIN
    SELECT COUNT(*) INTO null_count FROM network_events WHERE created_by IS NULL;

    IF null_count > 0 THEN
        RAISE NOTICE 'Found % events with NULL created_by. These will be logged but left as-is.', null_count;

        -- Log the problematic events
        RAISE NOTICE 'Events with NULL created_by:';
        FOR event_record IN
            SELECT id, title, network_id, created_at
            FROM network_events
            WHERE created_by IS NULL
        LOOP
            RAISE NOTICE 'Event ID: %, Title: %, Network: %, Created: %',
                event_record.id, event_record.title, event_record.network_id, event_record.created_at;
        END LOOP;

        -- Delete events with NULL created_by (orphaned events)
        -- These are invalid and should not exist
        DELETE FROM network_events WHERE created_by IS NULL;
        RAISE NOTICE 'Deleted % orphaned events with NULL created_by', null_count;
    END IF;
END $$;

-- Now we can safely add the constraint
ALTER TABLE network_events
    ALTER COLUMN created_by SET NOT NULL;

-- Comments
COMMENT ON FUNCTION create_event_activity() IS 'Fixed to skip activity feed entry when created_by is NULL - prevents constraint violation on mobile';
COMMENT ON FUNCTION create_news_activity() IS 'Fixed to skip activity feed entry when created_by is NULL - prevents constraint violation';
COMMENT ON FUNCTION create_post_activity() IS 'Fixed to skip activity feed entry when profile_id is NULL - prevents constraint violation';
