-- Migration: Fix anonymous blog comments
-- This migration grants anon role access to blog_comments for anonymous commenting

-- Grant anon role SELECT on blog_comments (to read approved comments)
GRANT SELECT ON public.blog_comments TO anon;

-- Grant anon role INSERT on blog_comments (to add anonymous comments)
GRANT INSERT ON public.blog_comments TO anon;

-- Grant anon role SELECT on blog_posts (to verify post exists when commenting)
GRANT SELECT ON public.blog_posts TO anon;

-- Grant anon role SELECT on profiles (for fetching comment author info)
-- Note: RLS still controls what data is visible
GRANT SELECT ON public.profiles TO anon;

-- Also ensure authenticated users have proper grants
GRANT SELECT, INSERT ON public.blog_comments TO authenticated;
GRANT SELECT ON public.blog_posts TO authenticated;

-- Add comment to migration_log
INSERT INTO migration_log (migration_name, status, notes)
VALUES (
  '20250111000000_fix_anon_blog_comments',
  'completed',
  'Granted anon and authenticated roles access to blog_comments, blog_posts, and profiles for anonymous commenting'
)
ON CONFLICT DO NOTHING;
