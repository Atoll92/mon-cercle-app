-- Migration: Add message reactions support
-- This migration extends the reactions system to support network chat messages and direct messages

-- Step 1: Alter the content_type CHECK constraint to include 'message' and 'dm'
ALTER TABLE reactions DROP CONSTRAINT IF EXISTS reactions_content_type_check;

ALTER TABLE reactions ADD CONSTRAINT reactions_content_type_check
CHECK (content_type IN ('post', 'news', 'comment', 'event', 'wiki', 'message', 'dm'));

-- Step 2: Add reaction_count column to messages table (network chat)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'messages' AND column_name = 'reaction_count'
    ) THEN
        ALTER TABLE messages ADD COLUMN reaction_count integer DEFAULT 0;
    END IF;
END $$;

-- Step 3: Add reaction_count column to direct_messages table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'direct_messages' AND column_name = 'reaction_count'
    ) THEN
        ALTER TABLE direct_messages ADD COLUMN reaction_count integer DEFAULT 0;
    END IF;
END $$;

-- Step 4: Update the reaction count trigger function to handle new content types
CREATE OR REPLACE FUNCTION update_reaction_count()
RETURNS TRIGGER AS $$
DECLARE
    target_table text;
    content_id_val uuid;
BEGIN
    -- Determine the target table based on content_type
    IF TG_OP = 'DELETE' THEN
        content_id_val := OLD.content_id;
        CASE OLD.content_type
            WHEN 'post' THEN target_table := 'portfolio_items';
            WHEN 'news' THEN target_table := 'network_news';
            WHEN 'comment' THEN target_table := 'comments';
            WHEN 'event' THEN target_table := 'network_events';
            WHEN 'wiki' THEN target_table := 'wiki_pages';
            WHEN 'message' THEN target_table := 'messages';
            WHEN 'dm' THEN target_table := 'direct_messages';
            ELSE target_table := NULL;
        END CASE;
    ELSE
        content_id_val := NEW.content_id;
        CASE NEW.content_type
            WHEN 'post' THEN target_table := 'portfolio_items';
            WHEN 'news' THEN target_table := 'network_news';
            WHEN 'comment' THEN target_table := 'comments';
            WHEN 'event' THEN target_table := 'network_events';
            WHEN 'wiki' THEN target_table := 'wiki_pages';
            WHEN 'message' THEN target_table := 'messages';
            WHEN 'dm' THEN target_table := 'direct_messages';
            ELSE target_table := NULL;
        END CASE;
    END IF;

    -- Skip if no target table (unknown content type)
    IF target_table IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

    -- Update the reaction count
    IF TG_OP = 'INSERT' THEN
        EXECUTE format('UPDATE %I SET reaction_count = COALESCE(reaction_count, 0) + 1 WHERE id = $1', target_table)
        USING content_id_val;
    ELSIF TG_OP = 'DELETE' THEN
        EXECUTE format('UPDATE %I SET reaction_count = GREATEST(COALESCE(reaction_count, 0) - 1, 0) WHERE id = $1', target_table)
        USING content_id_val;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Step 5: Recreate the trigger if it doesn't exist
DROP TRIGGER IF EXISTS update_reaction_count_trigger ON reactions;
CREATE TRIGGER update_reaction_count_trigger
AFTER INSERT OR DELETE ON reactions
FOR EACH ROW EXECUTE FUNCTION update_reaction_count();

-- Step 6: Update RLS policies for reactions to handle new content types
-- Users can view reactions for messages in their networks
DROP POLICY IF EXISTS "Users can view reactions in their networks" ON reactions;
CREATE POLICY "Users can view reactions in their networks" ON reactions
FOR SELECT USING (
    network_id IN (
        SELECT network_id FROM profiles WHERE user_id = auth.uid()
    )
);

-- Users can add reactions to content in their networks
DROP POLICY IF EXISTS "Users can add reactions in their networks" ON reactions;
CREATE POLICY "Users can add reactions in their networks" ON reactions
FOR INSERT WITH CHECK (
    -- Must be using their own profile
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    AND
    -- Must be in the network
    network_id IN (SELECT network_id FROM profiles WHERE user_id = auth.uid())
);

-- Users can remove their own reactions
DROP POLICY IF EXISTS "Users can remove their own reactions" ON reactions;
CREATE POLICY "Users can remove their own reactions" ON reactions
FOR DELETE USING (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- Users can update their own reactions (change emoji)
DROP POLICY IF EXISTS "Users can update their own reactions" ON reactions;
CREATE POLICY "Users can update their own reactions" ON reactions
FOR UPDATE USING (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- Step 7: Update the reaction_summaries view to include new content types
CREATE OR REPLACE VIEW reaction_summaries AS
SELECT
    content_type,
    content_id,
    emoji,
    COUNT(*) as count,
    array_agg(profile_id) as profile_ids
FROM reactions
GROUP BY content_type, content_id, emoji;

-- Grant access to the view
GRANT SELECT ON reaction_summaries TO authenticated;

-- Step 8: Add indexes for better performance on message reactions
CREATE INDEX IF NOT EXISTS idx_reactions_message ON reactions(content_id)
WHERE content_type = 'message';

CREATE INDEX IF NOT EXISTS idx_reactions_dm ON reactions(content_id)
WHERE content_type = 'dm';

-- Add comment for documentation
COMMENT ON COLUMN reactions.content_type IS 'Type of content: post, news, comment, event, wiki, message, dm';
