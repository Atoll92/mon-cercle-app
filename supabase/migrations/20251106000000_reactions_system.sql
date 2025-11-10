-- Migration: Reactions System
-- Add emoji reactions to all content types (posts, news, comments, events)
-- Created: 2025-11-06

-- Create reactions table
CREATE TABLE IF NOT EXISTS reactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    network_id uuid NOT NULL REFERENCES networks(id) ON DELETE CASCADE,

    -- Content reference (polymorphic)
    content_type text NOT NULL CHECK (content_type IN ('post', 'news', 'comment', 'event', 'wiki')),
    content_id uuid NOT NULL,

    -- Reaction data
    emoji text NOT NULL, -- Stores emoji character (e.g., '👍', '❤️', '🎉')

    created_at timestamp with time zone DEFAULT now() NOT NULL,

    -- Ensure one reaction per profile per content item (can change emoji by updating)
    UNIQUE(profile_id, content_type, content_id)
);

-- Create indexes for performance
CREATE INDEX idx_reactions_content ON reactions(content_type, content_id);
CREATE INDEX idx_reactions_profile ON reactions(profile_id);
CREATE INDEX idx_reactions_network ON reactions(network_id);
CREATE INDEX idx_reactions_created_at ON reactions(created_at DESC);

-- Add reaction counts to content tables (denormalized for performance)
ALTER TABLE portfolio_items ADD COLUMN IF NOT EXISTS reaction_count integer DEFAULT 0;
ALTER TABLE network_news ADD COLUMN IF NOT EXISTS reaction_count integer DEFAULT 0;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS reaction_count integer DEFAULT 0;
ALTER TABLE network_events ADD COLUMN IF NOT EXISTS reaction_count integer DEFAULT 0;
ALTER TABLE wiki_pages ADD COLUMN IF NOT EXISTS reaction_count integer DEFAULT 0;

-- Function to update reaction counts
CREATE OR REPLACE FUNCTION update_reaction_count()
RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment count
        CASE NEW.content_type
            WHEN 'post' THEN
                UPDATE portfolio_items SET reaction_count = reaction_count + 1 WHERE id = NEW.content_id;
            WHEN 'news' THEN
                UPDATE network_news SET reaction_count = reaction_count + 1 WHERE id = NEW.content_id;
            WHEN 'comment' THEN
                UPDATE comments SET reaction_count = reaction_count + 1 WHERE id = NEW.content_id;
            WHEN 'event' THEN
                UPDATE network_events SET reaction_count = reaction_count + 1 WHERE id = NEW.content_id;
            WHEN 'wiki' THEN
                UPDATE wiki_pages SET reaction_count = reaction_count + 1 WHERE id = NEW.content_id;
        END CASE;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement count
        CASE OLD.content_type
            WHEN 'post' THEN
                UPDATE portfolio_items SET reaction_count = GREATEST(reaction_count - 1, 0) WHERE id = OLD.content_id;
            WHEN 'news' THEN
                UPDATE network_news SET reaction_count = GREATEST(reaction_count - 1, 0) WHERE id = OLD.content_id;
            WHEN 'comment' THEN
                UPDATE comments SET reaction_count = GREATEST(reaction_count - 1, 0) WHERE id = OLD.content_id;
            WHEN 'event' THEN
                UPDATE network_events SET reaction_count = GREATEST(reaction_count - 1, 0) WHERE id = OLD.content_id;
            WHEN 'wiki' THEN
                UPDATE wiki_pages SET reaction_count = GREATEST(reaction_count - 1, 0) WHERE id = OLD.content_id;
        END CASE;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for reaction count updates
DROP TRIGGER IF EXISTS trigger_update_reaction_count ON reactions;
CREATE TRIGGER trigger_update_reaction_count
    AFTER INSERT OR DELETE ON reactions
    FOR EACH ROW EXECUTE FUNCTION update_reaction_count();

-- Row Level Security (RLS)
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view reactions in their networks
CREATE POLICY "Users can view reactions in their networks"
    ON reactions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = reactions.profile_id
            AND profiles.network_id = reactions.network_id
            AND profiles.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.network_id = reactions.network_id
            AND profiles.user_id = auth.uid()
        )
    );

-- Policy: Users can add reactions in their networks
CREATE POLICY "Users can add reactions in their networks"
    ON reactions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = reactions.profile_id
            AND profiles.network_id = reactions.network_id
            AND profiles.user_id = auth.uid()
        )
    );

-- Policy: Users can remove their own reactions
CREATE POLICY "Users can remove their own reactions"
    ON reactions FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = reactions.profile_id
            AND profiles.user_id = auth.uid()
        )
    );

-- Policy: Users can update their own reactions (change emoji)
CREATE POLICY "Users can update their own reactions"
    ON reactions FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = reactions.profile_id
            AND profiles.user_id = auth.uid()
        )
    );

-- Create view for reaction summaries (grouped by emoji)
CREATE OR REPLACE VIEW reaction_summaries AS
SELECT
    content_type,
    content_id,
    emoji,
    COUNT(*) as count,
    array_agg(profile_id) as profile_ids
FROM reactions
GROUP BY content_type, content_id, emoji;

-- Grant access to view
GRANT SELECT ON reaction_summaries TO authenticated;

-- Comments
COMMENT ON TABLE reactions IS 'Emoji reactions to content (posts, news, comments, events, wiki)';
COMMENT ON COLUMN reactions.content_type IS 'Type of content being reacted to';
COMMENT ON COLUMN reactions.content_id IS 'ID of the content being reacted to';
COMMENT ON COLUMN reactions.emoji IS 'Emoji character used for reaction';
