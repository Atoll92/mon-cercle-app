-- Add performance indexes for common query patterns

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_network_id ON profiles(network_id);
CREATE INDEX IF NOT EXISTS idx_profiles_network_id_role ON profiles(network_id, role);

-- Network news indexes  
CREATE INDEX IF NOT EXISTS idx_network_news_network_id_created_at ON network_news(network_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_network_news_created_by ON network_news(created_by);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_network_id_created_at ON messages(network_id, created_at DESC);

-- Direct messages indexes
CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation_id_created_at ON direct_messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation_id_read_at ON direct_messages(conversation_id, read_at);
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender_id ON direct_messages(sender_id);

-- Direct conversations indexes
CREATE INDEX IF NOT EXISTS idx_direct_conversations_participants ON direct_conversations USING GIN(participants);

-- Event participations indexes
CREATE INDEX IF NOT EXISTS idx_event_participations_event_id_status ON event_participations(event_id, status);
CREATE INDEX IF NOT EXISTS idx_event_participations_profile_id ON event_participations(profile_id);

-- Network events indexes
CREATE INDEX IF NOT EXISTS idx_network_events_network_id_date ON network_events(network_id, date DESC);

-- Portfolio items indexes
CREATE INDEX IF NOT EXISTS idx_portfolio_items_profile_id ON portfolio_items(profile_id);

-- Network files indexes
CREATE INDEX IF NOT EXISTS idx_network_files_network_id_created_at ON network_files(network_id, created_at DESC);

-- Wiki pages indexes
CREATE INDEX IF NOT EXISTS idx_wiki_pages_network_id_slug ON wiki_pages(network_id, slug);
CREATE INDEX IF NOT EXISTS idx_wiki_pages_network_id_category ON wiki_pages(network_id, category);

-- Moodboards indexes
CREATE INDEX IF NOT EXISTS idx_moodboards_created_by ON moodboards(created_by);
CREATE INDEX IF NOT EXISTS idx_moodboard_items_moodboard_id ON moodboard_items(moodboard_id);

-- Network polls indexes
CREATE INDEX IF NOT EXISTS idx_network_polls_network_id_created_at ON network_polls(network_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_network_poll_votes_poll_id ON network_poll_votes(poll_id);

-- Notification queue indexes
CREATE INDEX IF NOT EXISTS idx_notification_queue_status_created_at ON notification_queue(status, created_at);

-- Moderation logs indexes
CREATE INDEX IF NOT EXISTS idx_moderation_logs_network_id_created_at ON moderation_logs(network_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_target_user_id ON moderation_logs(target_user_id);

-- Media uploads indexes
CREATE INDEX IF NOT EXISTS idx_media_uploads_uploaded_by ON media_uploads(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_media_uploads_entity_type_entity_id ON media_uploads(entity_type, entity_id);