-- Query 3: Boost Club Activities
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
