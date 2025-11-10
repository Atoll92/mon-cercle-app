-- Quick check to see if reactions table exists and is configured correctly

-- 1. Check if reactions table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name = 'reactions'
);

-- 2. If it exists, show its structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'reactions'
ORDER BY ordinal_position;

-- 3. Check if reaction_count columns were added to content tables
SELECT
  'portfolio_items' as table_name,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'portfolio_items' AND column_name = 'reaction_count'
  ) as has_reaction_count;

SELECT
  'network_news' as table_name,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'network_news' AND column_name = 'reaction_count'
  ) as has_reaction_count;

-- 4. Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'reactions';

-- 5. Count existing reactions (if any)
SELECT COUNT(*) as reaction_count FROM reactions;
