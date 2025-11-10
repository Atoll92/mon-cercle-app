-- Migration: Smart Notification Digests System
-- Add digest preferences and grouping for notifications
-- Created: 2025-11-06

-- Add digest preferences to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notification_digest_frequency text DEFAULT 'instant' CHECK (notification_digest_frequency IN ('instant', 'hourly', 'daily', 'weekly'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS digest_last_sent_at timestamp with time zone;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS digest_preferred_time time DEFAULT '09:00:00'; -- Preferred time for daily/weekly digests

-- Add grouping fields to notification_queue
ALTER TABLE notification_queue ADD COLUMN IF NOT EXISTS digest_group_key text; -- Key for grouping similar notifications
ALTER TABLE notification_queue ADD COLUMN IF NOT EXISTS included_in_digest_id uuid; -- Reference to digest email if grouped
ALTER TABLE notification_queue ADD COLUMN IF NOT EXISTS is_digest boolean DEFAULT false; -- True if this is a digest email

-- Create index for digest processing
CREATE INDEX IF NOT EXISTS idx_notification_queue_digest ON notification_queue(recipient_id, digest_group_key, is_sent, created_at) WHERE is_sent = false;
CREATE INDEX IF NOT EXISTS idx_notification_queue_digest_frequency ON notification_queue(recipient_id, is_sent) WHERE is_sent = false;

-- Create notification_digests table to track sent digests
CREATE TABLE IF NOT EXISTS notification_digests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    network_id uuid NOT NULL REFERENCES networks(id) ON DELETE CASCADE,

    -- Digest info
    digest_type text NOT NULL CHECK (digest_type IN ('hourly', 'daily', 'weekly')),
    notification_count integer DEFAULT 0,
    notification_ids uuid[] DEFAULT ARRAY[]::uuid[],

    -- Digest content summary
    summary jsonb DEFAULT '{}'::jsonb, -- {"mentions": 3, "comments": 5, "events": 2}

    sent_at timestamp with time zone DEFAULT now() NOT NULL,
    email_sent boolean DEFAULT false,
    email_opened boolean DEFAULT false,
    email_clicked boolean DEFAULT false
);

-- Create indexes
CREATE INDEX idx_notification_digests_profile ON notification_digests(profile_id);
CREATE INDEX idx_notification_digests_sent_at ON notification_digests(sent_at DESC);
CREATE INDEX idx_notification_digests_network ON notification_digests(network_id);

-- Enable RLS
ALTER TABLE notification_digests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own digests
CREATE POLICY "Users can view their own digests"
    ON notification_digests FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = notification_digests.profile_id
            AND profiles.user_id = auth.uid()
        )
    );

-- Function to get pending notifications for digest
CREATE OR REPLACE FUNCTION get_pending_notifications_for_digest(
    p_profile_id uuid,
    p_since timestamp with time zone
)
RETURNS TABLE (
    id uuid,
    notification_type text,
    recipient_id uuid,
    created_at timestamp with time zone,
    metadata jsonb
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        nq.id,
        nq.notification_type,
        nq.recipient_id,
        nq.created_at,
        nq.metadata
    FROM notification_queue nq
    WHERE nq.recipient_id = p_profile_id
        AND nq.is_sent = false
        AND nq.included_in_digest_id IS NULL
        AND nq.created_at >= p_since
    ORDER BY nq.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notifications as included in digest
CREATE OR REPLACE FUNCTION mark_notifications_as_digested(
    p_notification_ids uuid[],
    p_digest_id uuid
)
RETURNS void AS $$
BEGIN
    UPDATE notification_queue
    SET included_in_digest_id = p_digest_id
    WHERE id = ANY(p_notification_ids);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create digest summary
CREATE OR REPLACE FUNCTION create_digest_summary(
    p_profile_id uuid,
    p_digest_type text,
    p_since timestamp with time zone
)
RETURNS jsonb AS $$
DECLARE
    v_summary jsonb;
    v_notification_ids uuid[];
BEGIN
    -- Get all pending notifications
    WITH pending_notifications AS (
        SELECT * FROM get_pending_notifications_for_digest(p_profile_id, p_since)
    ),
    grouped_counts AS (
        SELECT
            notification_type,
            COUNT(*) as count,
            array_agg(id) as ids
        FROM pending_notifications
        GROUP BY notification_type
    )
    SELECT
        jsonb_object_agg(notification_type, count) as summary,
        array_agg(id) as all_ids
    INTO v_summary, v_notification_ids
    FROM pending_notifications, grouped_counts;

    -- Create digest record
    INSERT INTO notification_digests (
        profile_id,
        network_id,
        digest_type,
        notification_count,
        notification_ids,
        summary
    )
    SELECT
        p_profile_id,
        (SELECT network_id FROM profiles WHERE id = p_profile_id LIMIT 1),
        p_digest_type,
        array_length(v_notification_ids, 1),
        v_notification_ids,
        v_summary
    WHERE v_notification_ids IS NOT NULL AND array_length(v_notification_ids, 1) > 0;

    -- Mark notifications as digested
    IF v_notification_ids IS NOT NULL THEN
        PERFORM mark_notifications_as_digested(
            v_notification_ids,
            (SELECT id FROM notification_digests WHERE profile_id = p_profile_id ORDER BY sent_at DESC LIMIT 1)
        );
    END IF;

    RETURN v_summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON COLUMN profiles.notification_digest_frequency IS 'Frequency of notification digests: instant, hourly, daily, weekly';
COMMENT ON COLUMN profiles.digest_preferred_time IS 'Preferred time of day for daily/weekly digests (24h format)';
COMMENT ON TABLE notification_digests IS 'Track sent notification digest emails';
COMMENT ON FUNCTION get_pending_notifications_for_digest IS 'Get pending notifications for a profile since a given time';
COMMENT ON FUNCTION create_digest_summary IS 'Create a digest summary and mark notifications as included';
