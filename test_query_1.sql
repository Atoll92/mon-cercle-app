-- Query 1: Your User Info
SELECT
    'Your User Info' as check_name,
    auth.uid() as user_id,
    (SELECT COUNT(*) FROM profiles WHERE user_id = auth.uid()) as profile_count;
