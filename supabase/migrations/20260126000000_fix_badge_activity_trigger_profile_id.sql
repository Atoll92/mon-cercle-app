-- ============================================================================
-- FIX BADGE EARNED ACTIVITY TRIGGER - INCORRECT COLUMN REFERENCE
-- ============================================================================
-- This migration fixes the create_badge_earned_activity() function which was
-- referencing NEW.profile_id instead of NEW.user_id.
--
-- The user_badges table has a 'user_id' column (not 'profile_id'), which caused
-- the error: record "new" has no field "profile_id"
-- ============================================================================

BEGIN;

-- Recreate the function with the correct column name
CREATE OR REPLACE FUNCTION create_badge_earned_activity()
RETURNS trigger AS $$
BEGIN
    INSERT INTO activity_feed (network_id, profile_id, activity_type, entity_type, entity_id, activity_text, metadata)
    VALUES (
        (SELECT network_id FROM profiles WHERE id = NEW.user_id LIMIT 1),
        NEW.user_id,
        'badge_earned',
        'badge',
        NEW.badge_id,
        (SELECT full_name FROM profiles WHERE id = NEW.user_id LIMIT 1) || ' earned the "' || (SELECT name FROM badges WHERE id = NEW.badge_id LIMIT 1) || '" badge',
        jsonb_build_object(
            'profile_name', (SELECT full_name FROM profiles WHERE id = NEW.user_id LIMIT 1),
            'badge_name', (SELECT name FROM badges WHERE id = NEW.badge_id LIMIT 1),
            'badge_icon', (SELECT icon FROM badges WHERE id = NEW.badge_id LIMIT 1)
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add to migration log
INSERT INTO migration_log (migration_name, status, notes)
VALUES (
    'fix_badge_activity_trigger_profile_id',
    'completed',
    'Fixed create_badge_earned_activity() function to use NEW.user_id instead of NEW.profile_id - the user_badges table column is named user_id'
) ON CONFLICT DO NOTHING;

COMMIT;

-- ============================================================================
-- POST-MIGRATION NOTES
-- ============================================================================
--
-- This fixes the error: record "new" has no field "profile_id"
-- which occurred when manually awarding badges through the BadgesTab component.
--
-- The user_badges table schema:
--   - user_id (uuid) -> references profiles.id
--   - badge_id (uuid) -> references badges.id
--   - awarded_by (uuid) -> references profiles.id
--   - awarded_at (timestamp)
--   - reason (text)
--
-- The trigger was incorrectly using NEW.profile_id instead of NEW.user_id.
-- ============================================================================
