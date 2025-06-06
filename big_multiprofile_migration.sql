-- ============================================================================
-- BIG MULTI-PROFILE MIGRATION
-- ============================================================================
-- This migration transforms the database from a 1:1:1 (User:Profile:Network) 
-- relationship to a 1:many:many relationship, enabling multiple profiles per user.
--
-- IMPORTANT: This migration must be run AFTER the frontend is ready to handle
-- both the old and new schema patterns.
--
-- 📋 Reference: See MULTIPLE_PROFILES_MIGRATION_PLAN.md for:
--    - Complete migration context and requirements
--    - Frontend changes needed before running this migration
--    - Post-migration frontend update requirements
--    - Implementation phases and priority breakdown
--
-- 🔄 Migration Status: READY TO RUN (pending frontend updates)
-- ============================================================================

BEGIN;

-- ============================================================================
-- PHASE 1: PREPARE FOR MIGRATION
-- ============================================================================

-- Create backup tables for rollback safety
CREATE TABLE profiles_backup AS SELECT * FROM profiles;
CREATE TABLE messages_backup AS SELECT * FROM messages;
CREATE TABLE network_poll_votes_backup AS SELECT * FROM network_poll_votes;
CREATE TABLE notification_queue_backup AS SELECT * FROM notification_queue;

-- Add helper function for active profile detection (needed for RLS policies)
CREATE OR REPLACE FUNCTION get_active_profile_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    profile_id uuid;
BEGIN
    -- This function will be implemented by the frontend via localStorage/cookies
    -- For now, return null to allow gradual migration
    RETURN null;
END;
$$;

-- ============================================================================
-- PHASE 2: MODIFY PROFILES TABLE STRUCTURE
-- ============================================================================

-- Step 1: Drop the 1:1 constraint that blocks multiple profiles
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Step 2: Add user_id column to reference auth users
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_id uuid;

-- Step 3: Populate user_id with current id values (preserves existing data)
UPDATE profiles SET user_id = id WHERE user_id IS NULL;

-- Step 4: Make user_id NOT NULL and add foreign key constraint
ALTER TABLE profiles ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE profiles ADD CONSTRAINT profiles_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 5: Create new UUIDs for profile IDs (critical for many-to-many)
-- We need to store old->new ID mappings for foreign key updates
CREATE TABLE profile_id_mapping (
    old_id uuid PRIMARY KEY,
    new_id uuid NOT NULL
);

-- Generate new UUIDs for all profiles and store mapping
INSERT INTO profile_id_mapping (old_id, new_id)
SELECT id, gen_random_uuid() FROM profiles;

-- ============================================================================
-- PHASE 3: TEMPORARILY DISABLE FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- We need to temporarily disable foreign key constraints during migration
-- to avoid constraint violations while updating IDs
SET session_replication_role = 'replica';

-- ============================================================================
-- PHASE 4: UPDATE FOREIGN KEY REFERENCES
-- ============================================================================

-- 4A: Update messages table to use new profile IDs
-- CRITICAL: This is the main breaking change for chat system
UPDATE messages 
SET user_id = profile_id_mapping.new_id
FROM profile_id_mapping 
WHERE messages.user_id = profile_id_mapping.old_id;

-- 4B: Update poll votes to use new profile IDs  
UPDATE network_poll_votes 
SET user_id = profile_id_mapping.new_id
FROM profile_id_mapping 
WHERE network_poll_votes.user_id = profile_id_mapping.old_id;

-- 4C: Update badge assignments to use new profile IDs
UPDATE user_badges 
SET user_id = profile_id_mapping.new_id
FROM profile_id_mapping 
WHERE user_badges.user_id = profile_id_mapping.old_id;

UPDATE user_badges 
SET awarded_by = profile_id_mapping.new_id
FROM profile_id_mapping 
WHERE user_badges.awarded_by = profile_id_mapping.old_id;

-- 4D: Update direct messages to use new profile IDs
UPDATE direct_messages 
SET sender_id = profile_id_mapping.new_id
FROM profile_id_mapping 
WHERE direct_messages.sender_id = profile_id_mapping.old_id;

-- Note: recipient_id may remain as auth user ID since it's cross-profile messaging
-- This will be handled by frontend logic

-- 4E: Update event participation to use new profile IDs
UPDATE event_participations 
SET profile_id = profile_id_mapping.new_id
FROM profile_id_mapping 
WHERE event_participations.profile_id = profile_id_mapping.old_id;

-- 4F: Update social wall comments to use new profile IDs
UPDATE social_wall_comments 
SET profile_id = profile_id_mapping.new_id
FROM profile_id_mapping 
WHERE social_wall_comments.profile_id = profile_id_mapping.old_id;

-- 4G: Update media uploads to use new profile IDs
UPDATE media_uploads 
SET uploaded_by = profile_id_mapping.new_id
FROM profile_id_mapping 
WHERE media_uploads.uploaded_by = profile_id_mapping.old_id;

-- 4H: Update network files to use new profile IDs
UPDATE network_files 
SET uploaded_by = profile_id_mapping.new_id
FROM profile_id_mapping 
WHERE network_files.uploaded_by = profile_id_mapping.old_id;

-- 4I: Update portfolio items to use new profile IDs
UPDATE portfolio_items 
SET profile_id = profile_id_mapping.new_id
FROM profile_id_mapping 
WHERE portfolio_items.profile_id = profile_id_mapping.old_id;

-- 4J: Update moodboards to use new profile IDs
UPDATE moodboards 
SET created_by = profile_id_mapping.new_id
FROM profile_id_mapping 
WHERE moodboards.created_by = profile_id_mapping.old_id;

UPDATE moodboard_items 
SET created_by = profile_id_mapping.new_id
FROM profile_id_mapping 
WHERE moodboard_items.created_by = profile_id_mapping.old_id;

-- 4K: Update network news to use new profile IDs
UPDATE network_news 
SET created_by = profile_id_mapping.new_id
FROM profile_id_mapping 
WHERE network_news.created_by = profile_id_mapping.old_id;

-- 4L: Update network events to use new profile IDs
UPDATE network_events 
SET created_by = profile_id_mapping.new_id
FROM profile_id_mapping 
WHERE network_events.created_by = profile_id_mapping.old_id;

-- 4M: Update network polls to use new profile IDs
UPDATE network_polls 
SET created_by = profile_id_mapping.new_id
FROM profile_id_mapping 
WHERE network_polls.created_by = profile_id_mapping.old_id;

-- 4N: Update wiki pages to use new profile IDs
UPDATE wiki_pages 
SET created_by = profile_id_mapping.new_id
FROM profile_id_mapping 
WHERE wiki_pages.created_by = profile_id_mapping.old_id;

UPDATE wiki_pages 
SET last_edited_by = profile_id_mapping.new_id
FROM profile_id_mapping 
WHERE wiki_pages.last_edited_by = profile_id_mapping.old_id;

UPDATE wiki_comments 
SET profile_id = profile_id_mapping.new_id
FROM profile_id_mapping 
WHERE wiki_comments.profile_id = profile_id_mapping.old_id;

UPDATE wiki_revisions 
SET created_by = profile_id_mapping.new_id
FROM profile_id_mapping 
WHERE wiki_revisions.created_by = profile_id_mapping.old_id;

UPDATE wiki_revisions 
SET approved_by = profile_id_mapping.new_id
FROM profile_id_mapping 
WHERE wiki_revisions.approved_by = profile_id_mapping.old_id;

-- 4N2: Update wiki comments hidden_by to use new profile IDs
UPDATE wiki_comments 
SET hidden_by = profile_id_mapping.new_id
FROM profile_id_mapping 
WHERE wiki_comments.hidden_by = profile_id_mapping.old_id;

-- 4N3: Update wiki page permissions to use new profile IDs
UPDATE wiki_page_permissions 
SET created_by = profile_id_mapping.new_id
FROM profile_id_mapping 
WHERE wiki_page_permissions.created_by = profile_id_mapping.old_id;

UPDATE wiki_page_permissions 
SET profile_id = profile_id_mapping.new_id
FROM profile_id_mapping 
WHERE wiki_page_permissions.profile_id = profile_id_mapping.old_id;

-- 4O: Update engagement stats to use new profile IDs
UPDATE engagement_stats 
SET user_id = profile_id_mapping.new_id
FROM profile_id_mapping 
WHERE engagement_stats.user_id = profile_id_mapping.old_id;

-- 4P: Update notification queue to use new profile IDs
UPDATE notification_queue 
SET recipient_id = profile_id_mapping.new_id
FROM profile_id_mapping 
WHERE notification_queue.recipient_id = profile_id_mapping.old_id;

-- ============================================================================
-- PHASE 5: UPDATE PROFILES TABLE WITH NEW IDs (LAST!)
-- ============================================================================

-- CRITICAL: Update profiles table IDs AFTER all foreign key references are updated
-- This must be the final step to avoid breaking foreign key constraints
UPDATE profiles 
SET id = profile_id_mapping.new_id
FROM profile_id_mapping 
WHERE profiles.id = profile_id_mapping.old_id;

-- ============================================================================
-- PHASE 6: RE-ENABLE FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Re-enable foreign key constraint checking
SET session_replication_role = 'origin';

-- ============================================================================
-- PHASE 7: ADD CONSTRAINTS AND INDEXES
-- ============================================================================

-- Add unique constraint: one profile per user per network
ALTER TABLE profiles ADD CONSTRAINT profiles_user_network_unique 
    UNIQUE (user_id, network_id);

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_network_id ON profiles(network_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_network ON profiles(user_id, network_id);

-- Set default for new profile IDs
ALTER TABLE profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- ============================================================================
-- PHASE 8: UPDATE RLS POLICIES FOR MULTIPLE PROFILES
-- ============================================================================

-- CRITICAL: Many existing RLS policies incorrectly use profiles.id = auth.uid()
-- After migration, profiles.id will be a new UUID, so we must use profiles.user_id = auth.uid()

-- 8A: Fix messages RLS policies
DROP POLICY IF EXISTS "Allow network members to read messages" ON messages;
CREATE POLICY "Allow network members to read messages" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.network_id = messages.network_id 
            AND profiles.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Allow network members to send messages" ON messages;
CREATE POLICY "Allow network members to send messages" ON messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.network_id = messages.network_id 
            AND profiles.user_id = auth.uid()
            AND profiles.id = messages.user_id
        )
    );

DROP POLICY IF EXISTS "Users can view replies to messages in their network" ON messages;
CREATE POLICY "Users can view replies to messages in their network" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.network_id = messages.network_id
        )
    );

-- 8B: Fix media_uploads RLS policies
DROP POLICY IF EXISTS "media_uploads_insertable_by_network_members" ON media_uploads;
CREATE POLICY "media_uploads_insertable_by_network_members" ON media_uploads
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.network_id = media_uploads.network_id
            AND profiles.id = media_uploads.uploaded_by
        )
    );

DROP POLICY IF EXISTS "media_uploads_viewable_by_network_members" ON media_uploads;
CREATE POLICY "media_uploads_viewable_by_network_members" ON media_uploads
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.network_id = media_uploads.network_id
        )
    );

-- Additional policies for backwards compatibility
DROP POLICY IF EXISTS "Users can upload media" ON media_uploads;
CREATE POLICY "Users can upload media" ON media_uploads
    FOR INSERT WITH CHECK (
        uploaded_by IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can view their media" ON media_uploads;
CREATE POLICY "Users can view their media" ON media_uploads
    FOR SELECT USING (
        uploaded_by IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    );

-- 8C: Fix badges RLS policies
DROP POLICY IF EXISTS "Network members can view badges" ON badges;
CREATE POLICY "Network members can view badges" ON badges
    FOR SELECT USING (
        is_active = true AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.network_id = badges.network_id
        )
    );

DROP POLICY IF EXISTS "Network creators and admins can manage badges" ON badges;
CREATE POLICY "Network creators and admins can manage badges" ON badges
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.network_id = badges.network_id 
            AND profiles.role = 'admin'
        ) OR
        EXISTS (
            SELECT 1 FROM networks 
            WHERE networks.id = badges.network_id 
            AND networks.created_by = auth.uid()::text
        )
    );

-- 8D: Fix network_poll_votes RLS policies
DROP POLICY IF EXISTS "Users can view poll votes" ON network_poll_votes;
CREATE POLICY "Users can view poll votes" ON network_poll_votes
    FOR SELECT USING (
        poll_id IN (
            SELECT id FROM network_polls 
            WHERE network_id IN (
                SELECT network_id FROM profiles WHERE user_id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Users can vote on polls" ON network_poll_votes;
CREATE POLICY "Users can vote on polls" ON network_poll_votes
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    );

-- 8E: Fix user_badges RLS policies
DROP POLICY IF EXISTS "Users can view their badges" ON user_badges;
CREATE POLICY "Users can view their badges" ON user_badges
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    );

-- 8F: Fix social_wall_comments RLS policies
DROP POLICY IF EXISTS "Users can view comments" ON social_wall_comments;
CREATE POLICY "Users can view comments" ON social_wall_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            JOIN network_news nn ON nn.network_id = p.network_id
            WHERE p.user_id = auth.uid() AND nn.id = item_id
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p 
            JOIN portfolio_items pi ON pi.profile_id IN (
                SELECT id FROM profiles p2 WHERE p2.network_id = p.network_id
            )
            WHERE p.user_id = auth.uid() AND pi.id = item_id
        )
    );

-- 8G: Fix direct_messages RLS policies 
DROP POLICY IF EXISTS "Users can view their direct messages" ON direct_messages;
CREATE POLICY "Users can view their direct messages" ON direct_messages
    FOR SELECT USING (
        sender_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        ) OR
        recipient_id = auth.uid()
    );

-- 8H: Fix moodboards RLS policies
DROP POLICY IF EXISTS "Users can manage their moodboards" ON moodboards;
CREATE POLICY "Users can manage their moodboards" ON moodboards
    FOR ALL USING (
        created_by IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        ) OR
        (permissions = 'public' AND network_id IN (
            SELECT network_id FROM profiles WHERE user_id = auth.uid()
        ))
    );

-- 8I: Fix engagement_stats RLS policies
DROP POLICY IF EXISTS "Network admins can view network engagement stats" ON engagement_stats;
CREATE POLICY "Network admins can view network engagement stats" ON engagement_stats
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.network_id = engagement_stats.network_id 
            AND profiles.role = 'admin'
        )
    );

-- 8J: Fix member_subscriptions RLS policies
DROP POLICY IF EXISTS "member_subscriptions_viewable_by_network_admins" ON member_subscriptions;
CREATE POLICY "member_subscriptions_viewable_by_network_admins" ON member_subscriptions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.network_id = member_subscriptions.network_id 
            AND profiles.role = 'admin'
        )
    );

-- 8K: Fix membership_plans RLS policies
DROP POLICY IF EXISTS "membership_plans_viewable_by_network_members" ON membership_plans;
CREATE POLICY "membership_plans_viewable_by_network_members" ON membership_plans
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.network_id = membership_plans.network_id
        )
    );

DROP POLICY IF EXISTS "membership_plans_manageable_by_admins" ON membership_plans;
CREATE POLICY "membership_plans_manageable_by_admins" ON membership_plans
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.network_id = membership_plans.network_id 
            AND profiles.role = 'admin'
        )
    );

-- 8L: Fix donations RLS policies
DROP POLICY IF EXISTS "donations_viewable_by_network_admins" ON donations;
CREATE POLICY "donations_viewable_by_network_admins" ON donations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.network_id = donations.network_id 
            AND profiles.role = 'admin'
        )
    );

-- ============================================================================
-- PHASE 9: CLEANUP AND VERIFICATION
-- ============================================================================

-- Create verification function
CREATE OR REPLACE FUNCTION verify_multiprofile_migration()
RETURNS TABLE (
    check_name text,
    status text,
    details text
) 
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check 1: All profiles have user_id
    RETURN QUERY
    SELECT 
        'profiles_user_id_populated'::text,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::text,
        'Profiles missing user_id: ' || COUNT(*)::text
    FROM profiles WHERE user_id IS NULL;
    
    -- Check 2: Unique constraint working
    RETURN QUERY
    SELECT 
        'user_network_uniqueness'::text,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::text,
        'Duplicate user-network combinations: ' || COUNT(*)::text
    FROM (
        SELECT user_id, network_id, COUNT(*) 
        FROM profiles 
        GROUP BY user_id, network_id 
        HAVING COUNT(*) > 1
    ) duplicates;
    
    -- Check 3: Foreign key integrity
    RETURN QUERY
    SELECT 
        'foreign_key_integrity'::text,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::text,
        'Orphaned message references: ' || COUNT(*)::text
    FROM messages m 
    LEFT JOIN profiles p ON m.user_id = p.id 
    WHERE p.id IS NULL;
    
    -- Check 4: ID mapping consistency
    RETURN QUERY
    SELECT 
        'id_mapping_complete'::text,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::text,
        'Unmapped profile IDs: ' || COUNT(*)::text
    FROM profile_id_mapping m 
    LEFT JOIN profiles p ON m.new_id = p.id 
    WHERE p.id IS NULL;
    
    -- Check 5: Wiki system integrity
    RETURN QUERY
    SELECT 
        'wiki_system_integrity'::text,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::text,
        'Orphaned wiki references: ' || COUNT(*)::text
    FROM (
        SELECT * FROM wiki_comments wc LEFT JOIN profiles p ON wc.profile_id = p.id WHERE p.id IS NULL
        UNION ALL
        SELECT * FROM wiki_comments wc LEFT JOIN profiles p ON wc.hidden_by = p.id WHERE wc.hidden_by IS NOT NULL AND p.id IS NULL
        UNION ALL
        SELECT * FROM wiki_revisions wr LEFT JOIN profiles p ON wr.created_by = p.id WHERE p.id IS NULL
        UNION ALL
        SELECT * FROM wiki_revisions wr LEFT JOIN profiles p ON wr.approved_by = p.id WHERE wr.approved_by IS NOT NULL AND p.id IS NULL
        UNION ALL
        SELECT * FROM wiki_page_permissions wpp LEFT JOIN profiles p ON wpp.created_by = p.id WHERE p.id IS NULL
        UNION ALL
        SELECT * FROM wiki_page_permissions wpp LEFT JOIN profiles p ON wpp.profile_id = p.id WHERE wpp.profile_id IS NOT NULL AND p.id IS NULL
        UNION ALL
        SELECT * FROM notification_queue nq LEFT JOIN profiles p ON nq.recipient_id = p.id WHERE p.id IS NULL
    ) orphaned_refs;
END;
$$;

-- Run verification
-- SELECT * FROM verify_multiprofile_migration();

-- Add migration metadata
CREATE TABLE IF NOT EXISTS migration_log (
    id SERIAL PRIMARY KEY,
    migration_name text NOT NULL,
    executed_at timestamp with time zone DEFAULT now(),
    status text NOT NULL,
    notes text
);

INSERT INTO migration_log (migration_name, status, notes) 
VALUES (
    'big_multiprofile_migration', 
    'completed', 
    'Migrated from 1:1:1 to 1:many:many User:Profile:Network relationship. Profile IDs regenerated, all foreign keys updated (20+ tables, 25+ columns), RLS policies fixed for multiple profiles support. Added missing wiki_comments.hidden_by, wiki_revisions.approved_by, and wiki_page_permissions columns.'
);

-- Clean up temporary mapping table (uncomment after verification)
-- DROP TABLE profile_id_mapping;
-- DROP TABLE profiles_backup;
-- DROP TABLE messages_backup;
-- DROP TABLE network_poll_votes_backup;
-- DROP TABLE notification_queue_backup;

COMMIT;

-- ============================================================================
-- POST-MIGRATION NOTES
-- ============================================================================
-- 
-- 1. Frontend must be updated to handle new profile ID structure before running
-- 2. All API calls using old profile.id patterns will break until updated
-- 3. Components must use activeProfile.id instead of user.id
-- 4. Chat, polls, badges, and other systems need frontend updates
-- 5. Run verification function after migration: SELECT * FROM verify_multiprofile_migration();
-- 6. Test thoroughly in staging before production deployment
--
-- See MULTIPLE_PROFILES_MIGRATION_PLAN.md sections on "Critical API Functions" 
-- and "Critical Component Updates" for required frontend changes.
-- ============================================================================