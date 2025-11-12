-- Diagnostic for Boost Club Activity Feed
-- Run this while logged in as your user

-- 1. Check your current user and profiles
SELECT
    'Your User Info' as check_name,
    auth.uid() as user_id,
    (SELECT COUNT(*) FROM profiles WHERE user_id = auth.uid()) as profile_count;

-- 2. Check your profiles and networks
SELECT
    'Your Profiles' as check_name,
    p.id as profile_id,
    p.full_name,
    p.network_id,
    n.name as network_name,
    n.features_config->>'activity_feed' as activity_feed_enabled
FROM profiles p
JOIN networks n ON p.network_id = n.id
WHERE p.user_id = auth.uid();

-- 3. Check activity feed for Boost Club specifically
SELECT
    'Boost Club Activities' as check_name,
    af.id,
    af.activity_type,
    af.activity_text,
    af.created_at,
    p.full_name as actor_name
FROM activity_feed af
JOIN profiles p ON af.profile_id = p.id
WHERE af.network_id = (
    SELECT network_id
    FROM profiles
    WHERE user_id = auth.uid()
    AND network_id IN (
        SELECT id FROM networks WHERE name ILIKE '%boost%club%'
    )
    LIMIT 1
)
ORDER BY af.created_at DESC
LIMIT 10;

-- 4. Check if you can see ANY activity feed records (bypass network filter)
SELECT
    'All Activity Feed Count' as check_name,
    COUNT(*) as total_records
FROM activity_feed;

-- 5. Check recent activity feed with network names
SELECT
    'Recent Activities (All Networks)' as check_name,
    af.activity_type,
    af.activity_text,
    n.name as network_name,
    af.created_at
FROM activity_feed af
JOIN networks n ON af.network_id = n.id
ORDER BY af.created_at DESC
LIMIT 10;

-- 6. Test RLS - Can you read activity feed for your networks?
SELECT
    'Your Network Activities (RLS Test)' as check_name,
    af.id,
    af.activity_type,
    af.activity_text,
    n.name as network_name,
    af.created_at
FROM activity_feed af
JOIN networks n ON af.network_id = n.id
WHERE EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.network_id = af.network_id
    AND profiles.user_id = auth.uid()
)
ORDER BY af.created_at DESC
LIMIT 10;

-- 7. Check Boost Club network features
SELECT
    'Boost Club Network Config' as check_name,
    id,
    name,
    features_config
FROM networks
WHERE name ILIKE '%boost%club%';

-- 8. Check if migration triggers exist
SELECT
    'Activity Triggers Status' as check_name,
    trigger_name,
    event_object_table,
    action_timing || ' ' || event_manipulation as event
FROM information_schema.triggers
WHERE trigger_name IN (
    'trigger_comment_activity',
    'trigger_file_shared_activity',
    'trigger_wiki_page_created_activity',
    'trigger_wiki_page_published_activity',
    'trigger_milestone_post',
    'trigger_milestone_event',
    'trigger_milestone_comment'
)
ORDER BY trigger_name;
