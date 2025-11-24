-- Migration: Add reaction activity to activity feed
-- Allow reactions to appear in the activity feed
-- Created: 2024-11-24

-- Step 1: Add 'reaction_added' to activity_type constraint
ALTER TABLE activity_feed DROP CONSTRAINT IF EXISTS activity_feed_activity_type_check;
ALTER TABLE activity_feed ADD CONSTRAINT activity_feed_activity_type_check
CHECK (activity_type IN (
    'member_joined',
    'post_created',
    'news_created',
    'event_created',
    'event_rsvp',
    'comment_added',
    'file_shared',
    'wiki_page_created',
    'badge_earned',
    'milestone_reached',
    'reaction_added'
));

-- Step 2: Add 'reaction' to entity_type constraint
ALTER TABLE activity_feed DROP CONSTRAINT IF EXISTS activity_feed_entity_type_check;
ALTER TABLE activity_feed ADD CONSTRAINT activity_feed_entity_type_check
CHECK (entity_type IN ('post', 'news', 'event', 'comment', 'file', 'wiki', 'badge', 'reaction'));

-- Step 3: Create function to create activity for reactions
CREATE OR REPLACE FUNCTION create_reaction_activity()
RETURNS trigger AS $$
DECLARE
    v_content_title text;
    v_reactor_name text;
    v_content_owner_name text;
    v_network_id uuid;
BEGIN
    -- Get reactor's name
    SELECT full_name INTO v_reactor_name FROM profiles WHERE id = NEW.profile_id;

    -- Get content owner's name and network_id based on content type
    CASE NEW.content_type
        WHEN 'post' THEN
            SELECT p.network_id, prof.full_name, pi.title
            INTO v_network_id, v_content_owner_name, v_content_title
            FROM portfolio_items pi
            JOIN profiles prof ON prof.id = pi.profile_id
            JOIN profiles p ON p.id = pi.profile_id
            WHERE pi.id = NEW.content_id;

        WHEN 'news' THEN
            SELECT nn.network_id, prof.full_name, nn.title
            INTO v_network_id, v_content_owner_name, v_content_title
            FROM network_news nn
            JOIN profiles prof ON prof.id = nn.created_by
            WHERE nn.id = NEW.content_id;

        WHEN 'comment' THEN
            -- For comments, get the parent content info
            SELECT c.network_id, prof.full_name, 'comment'
            INTO v_network_id, v_content_owner_name, v_content_title
            FROM comments c
            JOIN profiles prof ON prof.id = c.profile_id
            WHERE c.id = NEW.content_id;

        WHEN 'event' THEN
            SELECT ne.network_id, prof.full_name, ne.title
            INTO v_network_id, v_content_owner_name, v_content_title
            FROM network_events ne
            JOIN profiles prof ON prof.id = ne.created_by
            WHERE ne.id = NEW.content_id;

        WHEN 'wiki' THEN
            SELECT wp.network_id, prof.full_name, wp.title
            INTO v_network_id, v_content_owner_name, v_content_title
            FROM wiki_pages wp
            JOIN profiles prof ON prof.id = wp.created_by
            WHERE wp.id = NEW.content_id;
    END CASE;

    -- Only create activity if we found the content (and network_id)
    IF v_network_id IS NOT NULL THEN
        -- Create activity feed entry
        INSERT INTO activity_feed (
            network_id,
            profile_id,
            activity_type,
            entity_type,
            entity_id,
            activity_text,
            metadata
        )
        VALUES (
            v_network_id,
            NEW.profile_id,
            'reaction_added',
            NEW.content_type,
            NEW.content_id,
            v_reactor_name || ' reacted ' || NEW.emoji || ' to ' || COALESCE(v_content_title, 'a ' || NEW.content_type),
            jsonb_build_object(
                'reactor_name', v_reactor_name,
                'content_owner_name', v_content_owner_name,
                'content_title', v_content_title,
                'content_type', NEW.content_type,
                'emoji', NEW.emoji
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create trigger for reaction activity
DROP TRIGGER IF EXISTS trigger_reaction_activity ON reactions;
CREATE TRIGGER trigger_reaction_activity
    AFTER INSERT ON reactions
    FOR EACH ROW
    EXECUTE FUNCTION create_reaction_activity();

-- Step 5: Add comment
COMMENT ON FUNCTION create_reaction_activity IS 'Creates activity feed entries when users react to content';
