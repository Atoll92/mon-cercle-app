-- Add email notification preferences to profiles table
ALTER TABLE profiles 
ADD COLUMN email_notifications_enabled BOOLEAN DEFAULT true,
ADD COLUMN notify_on_news BOOLEAN DEFAULT true,
ADD COLUMN notify_on_events BOOLEAN DEFAULT true,
ADD COLUMN notify_on_mentions BOOLEAN DEFAULT true,
ADD COLUMN notify_on_direct_messages BOOLEAN DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN profiles.email_notifications_enabled IS 'Master toggle for all email notifications';
COMMENT ON COLUMN profiles.notify_on_news IS 'Receive email notifications when new news is posted in the network';
COMMENT ON COLUMN profiles.notify_on_events IS 'Receive email notifications for new events';
COMMENT ON COLUMN profiles.notify_on_mentions IS 'Receive email notifications when mentioned in posts or comments';
COMMENT ON COLUMN profiles.notify_on_direct_messages IS 'Receive email notifications for new direct messages';

-- Create notification_queue table for batching notifications
CREATE TABLE notification_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    network_id UUID NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('news', 'event', 'mention', 'direct_message')),
    subject_line VARCHAR(255) NOT NULL,
    content_preview TEXT,
    related_item_id UUID, -- ID of the news post, event, message, etc.
    is_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT
);

-- Add RLS policy for notification_queue
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own notifications
CREATE POLICY "Users can view their own notifications"
    ON notification_queue FOR SELECT
    USING (recipient_id = auth.uid());

-- Policy: System can insert notifications (no user restrictions)
CREATE POLICY "System can insert notifications"
    ON notification_queue FOR INSERT
    WITH CHECK (true);

-- Policy: System can update notification status
CREATE POLICY "System can update notification status"
    ON notification_queue FOR UPDATE
    USING (true);

-- Create index for efficient querying
CREATE INDEX idx_notification_queue_recipient_pending ON notification_queue (recipient_id, is_sent, created_at);
CREATE INDEX idx_notification_queue_unsent ON notification_queue (is_sent, created_at) WHERE is_sent = false;

-- Create a function to check if user wants notifications for a specific type
CREATE OR REPLACE FUNCTION should_notify_user(
    user_id UUID,
    notification_type VARCHAR(50)
) RETURNS BOOLEAN AS $$
DECLARE
    user_prefs RECORD;
BEGIN
    -- Get user's notification preferences
    SELECT 
        email_notifications_enabled,
        notify_on_news,
        notify_on_events,
        notify_on_mentions,
        notify_on_direct_messages
    INTO user_prefs
    FROM profiles 
    WHERE id = user_id;
    
    -- If user not found or master toggle is off, don't notify
    IF NOT FOUND OR NOT user_prefs.email_notifications_enabled THEN
        RETURN false;
    END IF;
    
    -- Check specific notification type preferences
    CASE notification_type
        WHEN 'news' THEN RETURN user_prefs.notify_on_news;
        WHEN 'event' THEN RETURN user_prefs.notify_on_events;
        WHEN 'mention' THEN RETURN user_prefs.notify_on_mentions;
        WHEN 'direct_message' THEN RETURN user_prefs.notify_on_direct_messages;
        ELSE RETURN false;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;