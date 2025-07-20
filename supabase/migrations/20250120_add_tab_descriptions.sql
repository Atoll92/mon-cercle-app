-- Add tab_descriptions field to networks table for custom feature guidelines
ALTER TABLE public.networks 
ADD COLUMN IF NOT EXISTS tab_descriptions jsonb DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN public.networks.tab_descriptions IS 'Custom descriptions/guidelines for each network tab functionality. Key-value pairs where key is tab ID and value is description text.';

-- Example default structure (not applied, just for reference):
-- {
--   "news": "Share important updates and announcements with the community",
--   "members": "Browse and connect with other network members",
--   "events": "Discover and participate in upcoming events",
--   "chat": "Real-time conversations with your network",
--   "files": "Share and collaborate on documents",
--   "wiki": "Build and access collective knowledge",
--   "social": "Engage with the community through posts and interactions"
-- }