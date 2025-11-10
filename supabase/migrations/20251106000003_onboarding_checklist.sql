-- Migration: Onboarding Checklist System
-- Track new member onboarding progress
-- Created: 2025-11-06

-- Create onboarding_progress table
CREATE TABLE IF NOT EXISTS onboarding_progress (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    network_id uuid NOT NULL REFERENCES networks(id) ON DELETE CASCADE,

    -- Checklist items (boolean flags)
    completed_profile boolean DEFAULT false,
    uploaded_profile_picture boolean DEFAULT false,
    made_first_post boolean DEFAULT false,
    rsvp_first_event boolean DEFAULT false,
    sent_first_message boolean DEFAULT false,
    explored_wiki boolean DEFAULT false,
    joined_first_chat boolean DEFAULT false,

    -- Completion timestamps
    completed_profile_at timestamp with time zone,
    uploaded_profile_picture_at timestamp with time zone,
    made_first_post_at timestamp with time zone,
    rsvp_first_event_at timestamp with time zone,
    sent_first_message_at timestamp with time zone,
    explored_wiki_at timestamp with time zone,
    joined_first_chat_at timestamp with time zone,

    -- Overall progress
    is_completed boolean DEFAULT false,
    completed_at timestamp with time zone,
    progress_percentage integer DEFAULT 0,

    -- Checklist dismissed
    is_dismissed boolean DEFAULT false,
    dismissed_at timestamp with time zone,

    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,

    UNIQUE(profile_id, network_id)
);

-- Create indexes
CREATE INDEX idx_onboarding_progress_profile ON onboarding_progress(profile_id);
CREATE INDEX idx_onboarding_progress_network ON onboarding_progress(network_id);
CREATE INDEX idx_onboarding_progress_completed ON onboarding_progress(is_completed, is_dismissed);

-- Enable RLS
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own onboarding progress
CREATE POLICY "Users can view their own onboarding progress"
    ON onboarding_progress FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = onboarding_progress.profile_id
            AND profiles.user_id = auth.uid()
        )
    );

-- Policy: Users can update their own onboarding progress
CREATE POLICY "Users can update their own onboarding progress"
    ON onboarding_progress FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = onboarding_progress.profile_id
            AND profiles.user_id = auth.uid()
        )
    );

-- Policy: System can insert onboarding progress
CREATE POLICY "System can insert onboarding progress"
    ON onboarding_progress FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = onboarding_progress.profile_id
            AND profiles.user_id = auth.uid()
        )
    );

-- Function to create onboarding progress for new members
CREATE OR REPLACE FUNCTION create_onboarding_progress()
RETURNS trigger AS $$
BEGIN
    INSERT INTO onboarding_progress (profile_id, network_id)
    VALUES (NEW.id, NEW.network_id)
    ON CONFLICT (profile_id, network_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create onboarding progress for new profiles
DROP TRIGGER IF EXISTS trigger_create_onboarding_progress ON profiles;
CREATE TRIGGER trigger_create_onboarding_progress
    AFTER INSERT ON profiles
    FOR EACH ROW EXECUTE FUNCTION create_onboarding_progress();

-- Function to update onboarding progress percentage
CREATE OR REPLACE FUNCTION update_onboarding_progress_percentage()
RETURNS trigger AS $$
DECLARE
    total_items integer := 7; -- Total number of checklist items
    completed_items integer := 0;
    new_percentage integer;
BEGIN
    -- Count completed items
    IF NEW.completed_profile THEN completed_items := completed_items + 1; END IF;
    IF NEW.uploaded_profile_picture THEN completed_items := completed_items + 1; END IF;
    IF NEW.made_first_post THEN completed_items := completed_items + 1; END IF;
    IF NEW.rsvp_first_event THEN completed_items := completed_items + 1; END IF;
    IF NEW.sent_first_message THEN completed_items := completed_items + 1; END IF;
    IF NEW.explored_wiki THEN completed_items := completed_items + 1; END IF;
    IF NEW.joined_first_chat THEN completed_items := completed_items + 1; END IF;

    -- Calculate percentage
    new_percentage := (completed_items * 100) / total_items;
    NEW.progress_percentage := new_percentage;

    -- Check if completed
    IF completed_items = total_items AND NEW.is_completed = false THEN
        NEW.is_completed := true;
        NEW.completed_at := now();
    END IF;

    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update progress percentage
DROP TRIGGER IF EXISTS trigger_update_onboarding_progress ON onboarding_progress;
CREATE TRIGGER trigger_update_onboarding_progress
    BEFORE UPDATE ON onboarding_progress
    FOR EACH ROW EXECUTE FUNCTION update_onboarding_progress_percentage();

-- Function to mark checklist item complete
CREATE OR REPLACE FUNCTION mark_onboarding_item_complete(
    p_profile_id uuid,
    p_item_name text
)
RETURNS boolean AS $$
DECLARE
    v_column_name text;
    v_timestamp_column text;
BEGIN
    -- Map item name to column name
    v_column_name := p_item_name;
    v_timestamp_column := p_item_name || '_at';

    -- Update the specific item
    EXECUTE format('
        UPDATE onboarding_progress
        SET %I = true, %I = now()
        WHERE profile_id = $1
    ', v_column_name, v_timestamp_column)
    USING p_profile_id;

    RETURN true;
EXCEPTION WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-mark completed profile when user updates their profile
CREATE OR REPLACE FUNCTION check_profile_completed()
RETURNS trigger AS $$
BEGIN
    -- Check if profile has essential fields filled
    IF NEW.full_name IS NOT NULL AND NEW.full_name != ''
       AND (NEW.bio IS NOT NULL OR NEW.tagline IS NOT NULL) THEN
        -- Mark profile as completed in onboarding
        UPDATE onboarding_progress
        SET completed_profile = true,
            completed_profile_at = now()
        WHERE profile_id = NEW.id
          AND completed_profile = false;
    END IF;

    -- Check if profile picture uploaded
    IF NEW.profile_picture_url IS NOT NULL AND NEW.profile_picture_url != '' THEN
        UPDATE onboarding_progress
        SET uploaded_profile_picture = true,
            uploaded_profile_picture_at = now()
        WHERE profile_id = NEW.id
          AND uploaded_profile_picture = false;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to check profile completion
DROP TRIGGER IF EXISTS trigger_check_profile_completed ON profiles;
CREATE TRIGGER trigger_check_profile_completed
    AFTER UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION check_profile_completed();

-- Auto-mark first post
CREATE OR REPLACE FUNCTION check_first_post()
RETURNS trigger AS $$
BEGIN
    UPDATE onboarding_progress
    SET made_first_post = true,
        made_first_post_at = now()
    WHERE profile_id = NEW.profile_id
      AND made_first_post = false;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for first post
DROP TRIGGER IF EXISTS trigger_check_first_post ON portfolio_items;
CREATE TRIGGER trigger_check_first_post
    AFTER INSERT ON portfolio_items
    FOR EACH ROW EXECUTE FUNCTION check_first_post();

-- Auto-mark first event RSVP
CREATE OR REPLACE FUNCTION check_first_event_rsvp()
RETURNS trigger AS $$
BEGIN
    IF NEW.status = 'attending' THEN
        UPDATE onboarding_progress
        SET rsvp_first_event = true,
            rsvp_first_event_at = now()
        WHERE profile_id = NEW.profile_id
          AND rsvp_first_event = false;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for first event RSVP
DROP TRIGGER IF EXISTS trigger_check_first_event_rsvp ON event_participations;
CREATE TRIGGER trigger_check_first_event_rsvp
    AFTER INSERT ON event_participations
    FOR EACH ROW EXECUTE FUNCTION check_first_event_rsvp();

-- Auto-mark first message
CREATE OR REPLACE FUNCTION check_first_message()
RETURNS trigger AS $$
BEGIN
    UPDATE onboarding_progress
    SET sent_first_message = true,
        sent_first_message_at = now()
    WHERE profile_id = (SELECT id FROM profiles WHERE user_id = NEW.user_id AND network_id = NEW.network_id LIMIT 1)
      AND sent_first_message = false;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for first message
DROP TRIGGER IF EXISTS trigger_check_first_message ON messages;
CREATE TRIGGER trigger_check_first_message
    AFTER INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION check_first_message();

-- Comments
COMMENT ON TABLE onboarding_progress IS 'Track new member onboarding checklist progress';
COMMENT ON COLUMN onboarding_progress.progress_percentage IS 'Overall completion percentage (0-100)';
COMMENT ON COLUMN onboarding_progress.is_dismissed IS 'User dismissed the checklist';
