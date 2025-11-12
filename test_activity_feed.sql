-- Test Activity Feed Setup
-- Run this in Supabase SQL Editor to diagnose issues

-- 1. Check if activity_feed table exists and has data
SELECT
    'Activity Feed Records' as check_name,
    COUNT(*) as count,
    MAX(created_at) as latest_activity
FROM activity_feed;

-- 2. Check if triggers exist
SELECT
    'Existing Triggers' as check_name,
    trigger_name,
    event_object_table,
    action_timing || ' ' || event_manipulation as timing
FROM information_schema.triggers
WHERE trigger_name LIKE '%activity%'
   OR trigger_name LIKE '%milestone%'
ORDER BY event_object_table, trigger_name;

-- 3. Check if functions exist
SELECT
    'Existing Functions' as check_name,
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_name LIKE '%activity%'
ORDER BY routine_name;

-- 4. Sample recent comments (to see if they should have triggered)
SELECT
    'Recent Comments' as check_name,
    c.id,
    c.entity_type,
    c.profile_id,
    c.is_hidden,
    c.created_at,
    p.full_name as commenter_name
FROM comments c
JOIN profiles p ON c.profile_id = p.id
ORDER BY c.created_at DESC
LIMIT 5;

-- 5. Sample recent files
SELECT
    'Recent Files' as check_name,
    nf.id,
    nf.filename,
    nf.network_id,
    nf.uploaded_by,
    nf.created_at,
    p.full_name as uploader_name
FROM network_files nf
JOIN profiles p ON nf.uploaded_by = p.id
ORDER BY nf.created_at DESC
LIMIT 5;

-- 6. Check network features config
SELECT
    'Network Features' as check_name,
    n.id as network_id,
    n.name as network_name,
    n.features_config
FROM networks n
ORDER BY n.created_at DESC
LIMIT 3;

-- 7. Test trigger manually - Try creating a test activity directly
-- (This will help us see if RLS policies are blocking reads)
SELECT
    'Can Read Activity Feed?' as check_name,
    COUNT(*) as readable_count
FROM activity_feed;

-- 8. Check RLS policies on activity_feed
SELECT
    'Activity Feed Policies' as check_name,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'activity_feed';
