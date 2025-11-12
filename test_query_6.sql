-- Query 6: Your Network Activities (RLS Test)
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
