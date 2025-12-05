-- Migration: Add entity_owner_name to comment activity metadata for personalized activity text
-- This allows the activity feed to show "commented on your post" instead of generic text
-- Created: 2025-12-04

-- ============================================================================
-- UPDATE COMMENT ACTIVITY TRIGGER
-- ============================================================================

-- Update function to include entity_owner_name in metadata
CREATE OR REPLACE FUNCTION create_comment_activity()
RETURNS trigger AS $$
DECLARE
    v_network_id uuid;
    v_entity_type text;
    v_entity_title text;
    v_entity_owner_name text;
BEGIN
    -- Get network_id, entity details, and owner name based on comment type
    IF NEW.news_id IS NOT NULL THEN
        SELECT nn.network_id, nn.title, p.full_name
        INTO v_network_id, v_entity_title, v_entity_owner_name
        FROM network_news nn
        JOIN profiles p ON nn.created_by = p.id
        WHERE nn.id = NEW.news_id;
        v_entity_type := 'news';
    ELSIF NEW.post_id IS NOT NULL THEN
        SELECT p.network_id, pi.title, p.full_name
        INTO v_network_id, v_entity_title, v_entity_owner_name
        FROM portfolio_items pi
        JOIN profiles p ON pi.profile_id = p.id
        WHERE pi.id = NEW.post_id;
        v_entity_type := 'post';
    ELSIF NEW.event_id IS NOT NULL THEN
        SELECT ne.network_id, ne.title, p.full_name
        INTO v_network_id, v_entity_title, v_entity_owner_name
        FROM network_events ne
        JOIN profiles p ON ne.created_by = p.id
        WHERE ne.id = NEW.event_id;
        v_entity_type := 'event';
    ELSIF NEW.wiki_id IS NOT NULL THEN
        SELECT wp.network_id, wp.title, p.full_name
        INTO v_network_id, v_entity_title, v_entity_owner_name
        FROM wiki_pages wp
        JOIN profiles p ON wp.created_by = p.id
        WHERE wp.id = NEW.wiki_id;
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
                'entity_owner_name', v_entity_owner_name,
                'is_reply', NEW.parent_comment_id IS NOT NULL
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update comment
COMMENT ON FUNCTION create_comment_activity() IS 'Creates activity feed entry when a comment is added. Includes entity_owner_name for personalized activity text.';
