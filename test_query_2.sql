-- Query 2: Your Profiles and Networks (MOST IMPORTANT)
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
