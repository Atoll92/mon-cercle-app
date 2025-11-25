-- Migration: Add Network Member Milestones
-- Track when networks reach member count milestones (10, 50, 100, etc.)
-- Created: 2025-11-25

-- ============================================================================
-- NETWORK MEMBER MILESTONE TRIGGER
-- ============================================================================

-- Function to check and create network member milestone activities
CREATE OR REPLACE FUNCTION create_network_member_milestone()
RETURNS trigger AS $$
DECLARE
    v_member_count int;
    v_milestone_text text;
    v_milestone_type text;
    v_network_name text;
BEGIN
    -- Get the network name
    SELECT name INTO v_network_name
    FROM networks WHERE id = NEW.network_id;

    -- Count total members in the network
    SELECT COUNT(*) INTO v_member_count
    FROM profiles
    WHERE network_id = NEW.network_id;

    -- Check for milestones at 10, 25, 50, 100, 250, 500, 1000 members
    IF v_member_count IN (10, 25, 50, 100, 250, 500, 1000) THEN
        v_milestone_type := 'members_' || v_member_count;
        v_milestone_text := v_network_name || ' reached ' || v_member_count || ' members!';

        -- Insert milestone activity
        -- Use the newly joined member's profile_id for the activity
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
            NEW.network_id,
            NEW.id, -- The profile that just joined
            'milestone_reached',
            NULL, -- Network milestone, not tied to specific entity
            NULL,
            v_milestone_text,
            jsonb_build_object(
                'milestone_type', v_milestone_type,
                'count', v_member_count,
                'network_name', v_network_name
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for network member milestone
-- This runs AFTER a profile is created (new member joins)
DROP TRIGGER IF EXISTS trigger_network_member_milestone ON profiles;
CREATE TRIGGER trigger_network_member_milestone
    AFTER INSERT ON profiles
    FOR EACH ROW EXECUTE FUNCTION create_network_member_milestone();

-- Comments
COMMENT ON FUNCTION create_network_member_milestone() IS 'Creates activity feed entry when network reaches member count milestones (10, 25, 50, 100, 250, 500, 1000)';
