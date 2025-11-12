-- Migration: Fix Activity Feed Triggers
-- Fix trigger functions to use correct field names (created_by vs profile_id)
-- Created: 2025-11-12

-- Fix create_news_activity to use created_by instead of profile_id
CREATE OR REPLACE FUNCTION create_news_activity()
RETURNS trigger AS $$
BEGIN
    INSERT INTO activity_feed (network_id, profile_id, activity_type, entity_type, entity_id, activity_text, metadata)
    VALUES (
        NEW.network_id,
        NEW.created_by,  -- Changed from NEW.profile_id
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

-- Fix create_event_activity to use created_by instead of profile_id
CREATE OR REPLACE FUNCTION create_event_activity()
RETURNS trigger AS $$
BEGIN
    INSERT INTO activity_feed (network_id, profile_id, activity_type, entity_type, entity_id, activity_text, metadata)
    VALUES (
        NEW.network_id,
        NEW.created_by,  -- Changed from NEW.profile_id
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

-- Fix create_milestone_activity to handle different field names across tables
CREATE OR REPLACE FUNCTION create_milestone_activity()
RETURNS trigger AS $$
DECLARE
    v_network_id uuid;
    v_profile_id uuid;
    v_profile_name text;
    v_milestone_text text;
    v_milestone_type text;
BEGIN
    -- Get profile_id based on table (some use profile_id, some use created_by)
    IF TG_TABLE_NAME = 'network_events' THEN
        v_profile_id := NEW.created_by;  -- network_events uses created_by
        v_network_id := NEW.network_id;
    ELSIF TG_TABLE_NAME = 'portfolio_items' THEN
        v_profile_id := NEW.profile_id;  -- portfolio_items uses profile_id
        -- Get network_id from profile
        SELECT network_id INTO v_network_id FROM profiles WHERE id = v_profile_id;
    ELSIF TG_TABLE_NAME = 'comments' THEN
        v_profile_id := NEW.profile_id;  -- comments uses profile_id
        -- Network ID will be determined from the entity being commented on
    END IF;

    -- Get profile name
    SELECT full_name INTO v_profile_name FROM profiles WHERE id = v_profile_id;

    -- Check for various milestones based on the updated table

    -- First post milestone (portfolio_items)
    IF TG_TABLE_NAME = 'portfolio_items' THEN
        -- Check if this is their first post
        IF (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = v_profile_id) = 1 THEN
            v_milestone_text := v_profile_name || ' created their first post!';
            v_milestone_type := 'first_post';

            INSERT INTO activity_feed (network_id, profile_id, activity_type, entity_type, entity_id, activity_text, metadata)
            VALUES (
                v_network_id,
                v_profile_id,
                'milestone_reached',
                'post',
                NEW.id,
                v_milestone_text,
                jsonb_build_object(
                    'profile_name', v_profile_name,
                    'milestone_type', v_milestone_type,
                    'count', 1
                )
            );
        END IF;
    END IF;

    -- First event milestone (network_events)
    IF TG_TABLE_NAME = 'network_events' THEN
        -- Check if this is their first event (using created_by)
        IF (SELECT COUNT(*) FROM network_events WHERE created_by = v_profile_id AND network_id = v_network_id) = 1 THEN
            v_milestone_text := v_profile_name || ' created their first event!';
            v_milestone_type := 'first_event';

            INSERT INTO activity_feed (network_id, profile_id, activity_type, entity_type, entity_id, activity_text, metadata)
            VALUES (
                v_network_id,
                v_profile_id,
                'milestone_reached',
                'event',
                NEW.id,
                v_milestone_text,
                jsonb_build_object(
                    'profile_name', v_profile_name,
                    'milestone_type', v_milestone_type,
                    'count', 1
                )
            );
        END IF;
    END IF;

    -- Milestone for 10 comments
    IF TG_TABLE_NAME = 'comments' THEN
        DECLARE
            v_comment_count int;
        BEGIN
            -- Get network_id from the entity being commented on
            IF NEW.news_id IS NOT NULL THEN
                SELECT network_id INTO v_network_id FROM network_news WHERE id = NEW.news_id;
            ELSIF NEW.post_id IS NOT NULL THEN
                SELECT p.network_id INTO v_network_id
                FROM portfolio_items pi
                JOIN profiles p ON pi.profile_id = p.id
                WHERE pi.id = NEW.post_id;
            ELSIF NEW.event_id IS NOT NULL THEN
                SELECT network_id INTO v_network_id FROM network_events WHERE id = NEW.event_id;
            ELSIF NEW.wiki_id IS NOT NULL THEN
                SELECT network_id INTO v_network_id FROM wiki_pages WHERE id = NEW.wiki_id;
            END IF;

            -- Count comments by this user in this network
            SELECT COUNT(*) INTO v_comment_count
            FROM comments c
            LEFT JOIN network_news nn ON c.news_id = nn.id
            LEFT JOIN portfolio_items pi ON c.post_id = pi.id
            LEFT JOIN network_events ne ON c.event_id = ne.id
            LEFT JOIN wiki_pages wp ON c.wiki_id = wp.id
            WHERE c.profile_id = v_profile_id
            AND (
                nn.network_id = v_network_id OR
                (SELECT network_id FROM profiles WHERE id = pi.profile_id) = v_network_id OR
                ne.network_id = v_network_id OR
                wp.network_id = v_network_id
            );

            -- Check for milestone at 10, 50, 100 comments
            IF v_comment_count IN (10, 50, 100) THEN
                v_milestone_text := v_profile_name || ' reached ' || v_comment_count || ' comments!';
                v_milestone_type := 'comments_' || v_comment_count;

                INSERT INTO activity_feed (network_id, profile_id, activity_type, entity_type, entity_id, activity_text, metadata)
                VALUES (
                    v_network_id,
                    v_profile_id,
                    'milestone_reached',
                    'comment',
                    NEW.id,
                    v_milestone_text,
                    jsonb_build_object(
                        'profile_name', v_profile_name,
                        'milestone_type', v_milestone_type,
                        'count', v_comment_count
                    )
                );
            END IF;
        END;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON FUNCTION create_news_activity() IS 'Fixed to use created_by field from network_news table';
COMMENT ON FUNCTION create_event_activity() IS 'Fixed to use created_by field from network_events table';
COMMENT ON FUNCTION create_milestone_activity() IS 'Fixed to handle different field names (created_by vs profile_id) across tables';
