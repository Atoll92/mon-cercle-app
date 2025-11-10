-- Test if the reaction_summaries view works correctly

-- 1. Check if view exists
SELECT EXISTS (
   SELECT FROM information_schema.views
   WHERE table_schema = 'public'
   AND table_name = 'reaction_summaries'
) as view_exists;

-- 2. Check view definition
SELECT definition
FROM pg_views
WHERE schemaname = 'public'
AND viewname = 'reaction_summaries';

-- 3. Try selecting from the view (should work even with no data)
SELECT * FROM reaction_summaries LIMIT 5;

-- 4. Check if any reactions exist in the reactions table
SELECT
    content_type,
    content_id,
    emoji,
    COUNT(*) as reaction_count
FROM reactions
GROUP BY content_type, content_id, emoji
LIMIT 10;

-- 5. Test with a specific post (replace POST_ID with a real ID)
-- SELECT * FROM reaction_summaries
-- WHERE content_type = 'post' AND content_id = 'YOUR_POST_ID';
