-- Migration: Activity Feed System
-- Track and display network activity for engagement
-- Created: 2025-11-06

-- Create activity_feed table
CREATE TABLE IF NOT EXISTS activity_feed (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    network_id uuid NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
    profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Activity type
    activity_type text NOT NULL CHECK (activity_type IN (
        'member_joined',
        'post_created',
        'news_created',
        'event_created',
        'event_rsvp',
        'comment_added',
        'file_shared',
        'wiki_page_created',
        'badge_earned',
        'milestone_reached'
    )),

    -- Related entity (optional)
    entity_type text CHECK (entity_type IN ('post', 'news', 'event', 'comment', 'file', 'wiki', 'badge')),
    entity_id uuid,

    -- Activity metadata (JSON for flexibility)
    metadata jsonb DEFAULT '{}'::jsonb,

    -- Display text (pre-generated for performance)
    activity_text text NOT NULL,

    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_activity_feed_network ON activity_feed(network_id, created_at DESC);
CREATE INDEX idx_activity_feed_profile ON activity_feed(profile_id);
CREATE INDEX idx_activity_feed_type ON activity_feed(activity_type);
CREATE INDEX idx_activity_feed_entity ON activity_feed(entity_type, entity_id) WHERE entity_type IS NOT NULL;
CREATE INDEX idx_activity_feed_created_at ON activity_feed(created_at DESC);

-- Row Level Security (RLS)
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view activity in their networks
CREATE POLICY "Users can view activity in their networks"
    ON activity_feed FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.network_id = activity_feed.network_id
            AND profiles.user_id = auth.uid()
        )
    );

-- Policy: System can insert activity (through service role)
-- Note: Activity creation will be done server-side or through triggers

-- Function to create activity for new members
CREATE OR REPLACE FUNCTION create_member_joined_activity()
RETURNS trigger AS $$
BEGIN
    INSERT INTO activity_feed (network_id, profile_id, activity_type, activity_text, metadata)
    VALUES (
        NEW.network_id,
        NEW.id,
        'member_joined',
        (SELECT full_name FROM profiles WHERE id = NEW.id LIMIT 1) || ' joined the network',
        jsonb_build_object('profile_name', (SELECT full_name FROM profiles WHERE id = NEW.id LIMIT 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new member activity
DROP TRIGGER IF EXISTS trigger_member_joined_activity ON profiles;
CREATE TRIGGER trigger_member_joined_activity
    AFTER INSERT ON profiles
    FOR EACH ROW EXECUTE FUNCTION create_member_joined_activity();

-- Function to create activity for new posts
CREATE OR REPLACE FUNCTION create_post_activity()
RETURNS trigger AS $$
BEGIN
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

-- Trigger for new post activity
DROP TRIGGER IF EXISTS trigger_post_activity ON portfolio_items;
CREATE TRIGGER trigger_post_activity
    AFTER INSERT ON portfolio_items
    FOR EACH ROW EXECUTE FUNCTION create_post_activity();

-- Function to create activity for new news
CREATE OR REPLACE FUNCTION create_news_activity()
RETURNS trigger AS $$
BEGIN
    INSERT INTO activity_feed (network_id, profile_id, activity_type, entity_type, entity_id, activity_text, metadata)
    VALUES (
        NEW.network_id,
        NEW.profile_id,
        'news_created',
        'news',
        NEW.id,
        (SELECT full_name FROM profiles WHERE id = NEW.profile_id LIMIT 1) || ' posted an announcement: ' || NEW.title,
        jsonb_build_object(
            'profile_name', (SELECT full_name FROM profiles WHERE id = NEW.profile_id LIMIT 1),
            'news_title', NEW.title
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new news activity
DROP TRIGGER IF EXISTS trigger_news_activity ON network_news;
CREATE TRIGGER trigger_news_activity
    AFTER INSERT ON network_news
    FOR EACH ROW EXECUTE FUNCTION create_news_activity();

-- Function to create activity for new events
CREATE OR REPLACE FUNCTION create_event_activity()
RETURNS trigger AS $$
BEGIN
    INSERT INTO activity_feed (network_id, profile_id, activity_type, entity_type, entity_id, activity_text, metadata)
    VALUES (
        NEW.network_id,
        NEW.profile_id,
        'event_created',
        'event',
        NEW.id,
        (SELECT full_name FROM profiles WHERE id = NEW.profile_id LIMIT 1) || ' created an event: ' || NEW.title,
        jsonb_build_object(
            'profile_name', (SELECT full_name FROM profiles WHERE id = NEW.profile_id LIMIT 1),
            'event_title', NEW.title,
            'event_date', NEW.date
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new event activity
DROP TRIGGER IF EXISTS trigger_event_activity ON network_events;
CREATE TRIGGER trigger_event_activity
    AFTER INSERT ON network_events
    FOR EACH ROW EXECUTE FUNCTION create_event_activity();

-- Function to create activity for event RSVPs
CREATE OR REPLACE FUNCTION create_event_rsvp_activity()
RETURNS trigger AS $$
BEGIN
    -- Only create activity for "attending" status
    IF NEW.status = 'attending' THEN
        INSERT INTO activity_feed (network_id, profile_id, activity_type, entity_type, entity_id, activity_text, metadata)
        VALUES (
            (SELECT network_id FROM network_events WHERE id = NEW.event_id LIMIT 1),
            NEW.profile_id,
            'event_rsvp',
            'event',
            NEW.event_id,
            (SELECT full_name FROM profiles WHERE id = NEW.profile_id LIMIT 1) || ' is attending ' || (SELECT title FROM network_events WHERE id = NEW.event_id LIMIT 1),
            jsonb_build_object(
                'profile_name', (SELECT full_name FROM profiles WHERE id = NEW.profile_id LIMIT 1),
                'event_title', (SELECT title FROM network_events WHERE id = NEW.event_id LIMIT 1),
                'status', NEW.status
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for event RSVP activity
DROP TRIGGER IF EXISTS trigger_event_rsvp_activity ON event_participations;
CREATE TRIGGER trigger_event_rsvp_activity
    AFTER INSERT ON event_participations
    FOR EACH ROW EXECUTE FUNCTION create_event_rsvp_activity();

-- Function to create activity for badge awards
CREATE OR REPLACE FUNCTION create_badge_earned_activity()
RETURNS trigger AS $$
BEGIN
    INSERT INTO activity_feed (network_id, profile_id, activity_type, entity_type, entity_id, activity_text, metadata)
    VALUES (
        (SELECT network_id FROM profiles WHERE id = NEW.profile_id LIMIT 1),
        NEW.profile_id,
        'badge_earned',
        'badge',
        NEW.badge_id,
        (SELECT full_name FROM profiles WHERE id = NEW.profile_id LIMIT 1) || ' earned the "' || (SELECT name FROM badges WHERE id = NEW.badge_id LIMIT 1) || '" badge',
        jsonb_build_object(
            'profile_name', (SELECT full_name FROM profiles WHERE id = NEW.profile_id LIMIT 1),
            'badge_name', (SELECT name FROM badges WHERE id = NEW.badge_id LIMIT 1),
            'badge_icon', (SELECT icon FROM badges WHERE id = NEW.badge_id LIMIT 1)
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for badge earned activity
DROP TRIGGER IF EXISTS trigger_badge_earned_activity ON user_badges;
CREATE TRIGGER trigger_badge_earned_activity
    AFTER INSERT ON user_badges
    FOR EACH ROW EXECUTE FUNCTION create_badge_earned_activity();

-- Comments
COMMENT ON TABLE activity_feed IS 'Activity feed for network engagement and pulse visibility';
COMMENT ON COLUMN activity_feed.activity_type IS 'Type of activity that occurred';
COMMENT ON COLUMN activity_feed.entity_type IS 'Type of related entity (if applicable)';
COMMENT ON COLUMN activity_feed.entity_id IS 'ID of related entity (if applicable)';
COMMENT ON COLUMN activity_feed.metadata IS 'Flexible JSON metadata for activity details';
COMMENT ON COLUMN activity_feed.activity_text IS 'Pre-generated display text for performance';
