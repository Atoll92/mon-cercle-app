-- ============================================================================
-- IMMEDIATE FIX: Reaction Activity for Messages and DMs
-- Run this SQL directly in Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/etoxvocwsktguoddmgcu/sql/new
-- ============================================================================

-- This fixes the "case not found" error when adding reactions to:
-- - Network chat messages (content_type = 'message')
-- - Direct messages (content_type = 'dm')

DROP FUNCTION IF EXISTS create_reaction_activity() CASCADE;

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

        WHEN 'message' THEN
            -- For network chat messages
            SELECT m.network_id, prof.full_name, 'message'
            INTO v_network_id, v_content_owner_name, v_content_title
            FROM messages m
            JOIN profiles prof ON prof.user_id = m.user_id
            WHERE m.id = NEW.content_id;

        WHEN 'dm' THEN
            -- For direct messages - don't create activity feed entry
            -- DMs are private and shouldn't appear in network activity
            RETURN NEW;

        ELSE
            -- Unknown content type - log warning and skip gracefully
            RAISE WARNING 'Unknown content_type in create_reaction_activity: %', NEW.content_type;
            RETURN NEW;
    END CASE;

    -- Only create activity if we found the content (and network_id)
    IF v_network_id IS NOT NULL THEN
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

-- Recreate the trigger
DROP TRIGGER IF EXISTS trigger_reaction_activity ON reactions;

CREATE TRIGGER trigger_reaction_activity
    AFTER INSERT ON reactions
    FOR EACH ROW
    EXECUTE FUNCTION create_reaction_activity();

-- Add helpful comment
COMMENT ON FUNCTION create_reaction_activity IS 'Creates activity feed entries when users react to content. Supports: post, news, comment, event, wiki, message. Skips: dm (for privacy). Handles unknown types gracefully.';

-- Verify the function exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname = 'create_reaction_activity'
    ) THEN
        RAISE NOTICE '✅ Function create_reaction_activity successfully created/updated';
    ELSE
        RAISE EXCEPTION '❌ Function create_reaction_activity was not created';
    END IF;
END $$;

-- Verify the trigger exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'trigger_reaction_activity'
    ) THEN
        RAISE NOTICE '✅ Trigger trigger_reaction_activity successfully created';
    ELSE
        RAISE EXCEPTION '❌ Trigger trigger_reaction_activity was not created';
    END IF;
END $$;

-- ============================================================================
-- SUCCESS! You should see:
-- ✅ Function create_reaction_activity successfully created/updated
-- ✅ Trigger trigger_reaction_activity successfully created
--
-- Now try adding a reaction in your app - it should work!
-- ============================================================================
