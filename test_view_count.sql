-- Test script to verify view count feature is working
-- Run this in Supabase SQL Editor

-- 1. Check if view_count column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'moodboards' AND column_name = 'view_count';

-- 2. Check if the function exists
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name = 'increment_moodboard_view_count';

-- 3. Check current moodboards and their view counts
SELECT id, created_by, title, view_count
FROM moodboards
LIMIT 5;

-- 4. Test the increment function (replace YOUR_MOODBOARD_ID with actual ID)
-- SELECT increment_moodboard_view_count('YOUR_MOODBOARD_ID');
-- Then re-run query #3 to see if it incremented
