-- Migration: Add Missing Activity Feed Triggers
-- Add triggers for comments, files, wiki pages, and milestones
-- Created: 2025-11-12

-- ============================================================================
-- 1. COMMENT ACTIVITY TRIGGER
-- ============================================================================

-- Function to create activity for new comments
CREATE OR REPLACE FUNCTION create_comment_activity()
RETURNS trigger AS $$
DECLARE
    v_network_id uuid;
    v_entity_type text;
    v_entity_title text;
BEGIN
    -- Get network_id and entity details based on comment type
    IF NEW.news_id IS NOT NULL THEN
        SELECT network_id, title INTO v_network_id, v_entity_title
        FROM network_news WHERE id = NEW.news_id;
        v_entity_type := 'news';
    ELSIF NEW.post_id IS NOT NULL THEN
        SELECT p.network_id, pi.title INTO v_network_id, v_entity_title
        FROM portfolio_items pi
        JOIN profiles p ON pi.profile_id = p.id
        WHERE pi.id = NEW.post_id;
        v_entity_type := 'post';
    ELSIF NEW.event_id IS NOT NULL THEN
        SELECT network_id, title INTO v_network_id, v_entity_title
        FROM network_events WHERE id = NEW.event_id;
        v_entity_type := 'event';
    ELSIF NEW.wiki_id IS NOT NULL THEN
        SELECT network_id, title INTO v_network_id, v_entity_title
        FROM wiki_pages WHERE id = NEW.wiki_id;
        v_entity_type := 'wiki';
    END IF;

    -- Only create activity if we found a network (not for deleted entities)
    IF v_network_id IS NOT NULL THEN
        INSERT INTO activity_feed (network_id, profile_id, activity_type, entity_type, entity_id, activity_text, metadata)
        VALUES (
            v_network_id,
            NEW.profile_id,
            'comment_added',
            'comment',
            NEW.id,
            (SELECT full_name FROM profiles WHERE id = NEW.profile_id LIMIT 1) || ' commented on ' || v_entity_type || ': ' || COALESCE(v_entity_title, 'Untitled'),
            jsonb_build_object(
                'profile_name', (SELECT full_name FROM profiles WHERE id = NEW.profile_id LIMIT 1),
                'entity_type', v_entity_type,
                'entity_title', v_entity_title,
                'is_reply', NEW.parent_comment_id IS NOT NULL
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for comment activity
DROP TRIGGER IF EXISTS trigger_comment_activity ON comments;
CREATE TRIGGER trigger_comment_activity
    AFTER INSERT ON comments
    FOR EACH ROW
    WHEN (NEW.is_hidden = false)
    EXECUTE FUNCTION create_comment_activity();

-- ============================================================================
-- 2. FILE SHARING ACTIVITY TRIGGER
-- ============================================================================

-- Function to create activity for file sharing
CREATE OR REPLACE FUNCTION create_file_shared_activity()
RETURNS trigger AS $$
BEGIN
    INSERT INTO activity_feed (network_id, profile_id, activity_type, entity_type, entity_id, activity_text, metadata)
    VALUES (
        NEW.network_id,
        NEW.uploaded_by,
        'file_shared',
        'file',
        NEW.id,
        (SELECT full_name FROM profiles WHERE id = NEW.uploaded_by LIMIT 1) || ' shared a file: ' || NEW.filename,
        jsonb_build_object(
            'profile_name', (SELECT full_name FROM profiles WHERE id = NEW.uploaded_by LIMIT 1),
            'filename', NEW.filename,
            'file_type', NEW.file_type,
            'file_size', NEW.file_size
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for file sharing activity
DROP TRIGGER IF EXISTS trigger_file_shared_activity ON network_files;
CREATE TRIGGER trigger_file_shared_activity
    AFTER INSERT ON network_files
    FOR EACH ROW EXECUTE FUNCTION create_file_shared_activity();

-- ============================================================================
-- 3. WIKI PAGE ACTIVITY TRIGGER
-- ============================================================================

-- Function to create activity for wiki page creation
CREATE OR REPLACE FUNCTION create_wiki_page_activity()
RETURNS trigger AS $$
BEGIN
    -- Only create activity when page is published
    IF NEW.is_published = true THEN
        INSERT INTO activity_feed (network_id, profile_id, activity_type, entity_type, entity_id, activity_text, metadata)
        VALUES (
            NEW.network_id,
            NEW.created_by,
            'wiki_page_created',
            'wiki',
            NEW.id,
            (SELECT full_name FROM profiles WHERE id = NEW.created_by LIMIT 1) || ' created a wiki page: ' || NEW.title,
            jsonb_build_object(
                'profile_name', (SELECT full_name FROM profiles WHERE id = NEW.created_by LIMIT 1),
                'wiki_title', NEW.title,
                'wiki_slug', NEW.slug
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for wiki page creation activity (on INSERT)
DROP TRIGGER IF EXISTS trigger_wiki_page_created_activity ON wiki_pages;
CREATE TRIGGER trigger_wiki_page_created_activity
    AFTER INSERT ON wiki_pages
    FOR EACH ROW EXECUTE FUNCTION create_wiki_page_activity();

-- Trigger for wiki page publication (on UPDATE from unpublished to published)
DROP TRIGGER IF EXISTS trigger_wiki_page_published_activity ON wiki_pages;
CREATE TRIGGER trigger_wiki_page_published_activity
    AFTER UPDATE ON wiki_pages
    FOR EACH ROW
    WHEN (OLD.is_published = false AND NEW.is_published = true)
    EXECUTE FUNCTION create_wiki_page_activity();

-- ============================================================================
-- 4. MILESTONE ACTIVITY TRIGGER
-- ============================================================================

-- Function to check and create milestone activities
CREATE OR REPLACE FUNCTION create_milestone_activity()
RETURNS trigger AS $$
DECLARE
    v_network_id uuid;
    v_profile_name text;
    v_milestone_text text;
    v_milestone_type text;
BEGIN
    -- Get network_id and profile name
    SELECT network_id, full_name INTO v_network_id, v_profile_name
    FROM profiles WHERE id = NEW.profile_id;

    -- Check for various milestones based on the updated table

    -- First post milestone (portfolio_items)
    IF TG_TABLE_NAME = 'portfolio_items' THEN
        -- Check if this is their first post
        IF (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = NEW.profile_id) = 1 THEN
            v_milestone_text := v_profile_name || ' created their first post!';
            v_milestone_type := 'first_post';

            INSERT INTO activity_feed (network_id, profile_id, activity_type, entity_type, entity_id, activity_text, metadata)
            VALUES (
                v_network_id,
                NEW.profile_id,
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
        -- Check if this is their first event
        IF (SELECT COUNT(*) FROM network_events WHERE created_by = NEW.created_by AND network_id = NEW.network_id) = 1 THEN
            v_milestone_text := v_profile_name || ' created their first event!';
            v_milestone_type := 'first_event';

            INSERT INTO activity_feed (network_id, profile_id, activity_type, entity_type, entity_id, activity_text, metadata)
            VALUES (
                NEW.network_id,
                NEW.created_by,
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
            -- Count comments by this user in this network
            SELECT COUNT(*) INTO v_comment_count
            FROM comments c
            LEFT JOIN network_news nn ON c.news_id = nn.id
            LEFT JOIN portfolio_items pi ON c.post_id = pi.id
            LEFT JOIN network_events ne ON c.event_id = ne.id
            LEFT JOIN wiki_pages wp ON c.wiki_id = wp.id
            WHERE c.profile_id = NEW.profile_id
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
                    NEW.profile_id,
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

-- Triggers for milestone activities
DROP TRIGGER IF EXISTS trigger_milestone_post ON portfolio_items;
CREATE TRIGGER trigger_milestone_post
    AFTER INSERT ON portfolio_items
    FOR EACH ROW EXECUTE FUNCTION create_milestone_activity();

DROP TRIGGER IF EXISTS trigger_milestone_event ON network_events;
CREATE TRIGGER trigger_milestone_event
    AFTER INSERT ON network_events
    FOR EACH ROW EXECUTE FUNCTION create_milestone_activity();

DROP TRIGGER IF EXISTS trigger_milestone_comment ON comments;
CREATE TRIGGER trigger_milestone_comment
    AFTER INSERT ON comments
    FOR EACH ROW
    WHEN (NEW.is_hidden = false)
    EXECUTE FUNCTION create_milestone_activity();

-- Comments
COMMENT ON FUNCTION create_comment_activity() IS 'Creates activity feed entry when a comment is added';
COMMENT ON FUNCTION create_file_shared_activity() IS 'Creates activity feed entry when a file is shared';
COMMENT ON FUNCTION create_wiki_page_activity() IS 'Creates activity feed entry when a wiki page is created or published';
COMMENT ON FUNCTION create_milestone_activity() IS 'Creates activity feed entry when user reaches a milestone';
