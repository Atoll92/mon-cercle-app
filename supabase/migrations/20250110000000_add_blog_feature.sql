-- Migration: Add Personal Blog Feature
-- This migration adds support for blog-type networks with public pages,
-- anonymous comments, newsletter subscriptions, and simplified admin.

-- ============================================
-- 1. Add network_type and blog columns to networks table
-- ============================================

-- Add network_type column (default to 'network' for existing networks)
ALTER TABLE public.networks
ADD COLUMN IF NOT EXISTS network_type text NOT NULL DEFAULT 'network';

-- Add constraint for network_type
ALTER TABLE public.networks
ADD CONSTRAINT valid_network_type CHECK (network_type IN ('network', 'blog'));

-- Add subdomain for blog URLs (myblog.conclav.club)
ALTER TABLE public.networks
ADD COLUMN IF NOT EXISTS subdomain text;

-- Add custom domain support
ALTER TABLE public.networks
ADD COLUMN IF NOT EXISTS custom_domain text;

-- Add blog-specific settings
ALTER TABLE public.networks
ADD COLUMN IF NOT EXISTS blog_settings jsonb DEFAULT '{
  "comments_enabled": true,
  "anonymous_comments": true,
  "comment_moderation": true,
  "newsletter_enabled": false,
  "rss_enabled": true,
  "about_page_content": "",
  "social_links": {}
}'::jsonb;

-- Add SEO settings for blogs
ALTER TABLE public.networks
ADD COLUMN IF NOT EXISTS seo_settings jsonb DEFAULT '{
  "meta_title": "",
  "meta_description": "",
  "og_image_url": ""
}'::jsonb;

-- Create unique indexes for subdomain and custom_domain lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_networks_subdomain
ON networks(subdomain) WHERE subdomain IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_networks_custom_domain
ON networks(custom_domain) WHERE custom_domain IS NOT NULL;

-- ============================================
-- 2. Create blog_posts table
-- ============================================

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  network_id uuid NOT NULL REFERENCES networks(id) ON DELETE CASCADE,

  -- Content
  title text,
  content text,

  -- Media (reuse existing media pattern from portfolio_items/network_news)
  media_url text,
  media_type text CHECK (media_type IS NULL OR media_type IN ('image', 'video', 'audio', 'pdf')),
  media_metadata jsonb DEFAULT '{}',

  -- Featured post support (only one per blog)
  is_featured boolean DEFAULT false,

  -- Publishing
  is_published boolean DEFAULT true,
  published_at timestamp with time zone DEFAULT now(),

  -- Analytics
  view_count integer DEFAULT 0,

  -- Author (profile_id for admin)
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Indexes for blog_posts
CREATE INDEX IF NOT EXISTS idx_blog_posts_network ON blog_posts(network_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(network_id, is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_featured ON blog_posts(network_id, is_featured) WHERE is_featured = true;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_blog_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS blog_posts_updated_at ON blog_posts;
CREATE TRIGGER blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_posts_updated_at();

-- ============================================
-- 3. Create blog_comments table (supports anonymous comments)
-- ============================================

CREATE TABLE IF NOT EXISTS public.blog_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,

  -- Author (nullable for anonymous comments)
  profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,

  -- Anonymous author info (used when profile_id is null)
  author_name text,
  author_email text, -- Optional, stored but not displayed publicly

  -- Content
  content text NOT NULL,

  -- Threading support
  parent_comment_id uuid REFERENCES blog_comments(id) ON DELETE CASCADE,

  -- Moderation (comments require approval by default)
  is_approved boolean DEFAULT false,
  is_hidden boolean DEFAULT false,
  approved_at timestamp with time zone,
  approved_by uuid REFERENCES profiles(id) ON DELETE SET NULL,

  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Indexes for blog_comments
CREATE INDEX IF NOT EXISTS idx_blog_comments_post ON blog_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_parent ON blog_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_approved ON blog_comments(post_id, is_approved, is_hidden);
CREATE INDEX IF NOT EXISTS idx_blog_comments_pending ON blog_comments(post_id, is_approved) WHERE is_approved = false;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_blog_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS blog_comments_updated_at ON blog_comments;
CREATE TRIGGER blog_comments_updated_at
  BEFORE UPDATE ON blog_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_comments_updated_at();

-- ============================================
-- 4. Create blog_subscribers table (newsletter)
-- ============================================

CREATE TABLE IF NOT EXISTS public.blog_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  network_id uuid NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
  email text NOT NULL,

  -- Verification
  is_verified boolean DEFAULT false,
  verification_token text DEFAULT gen_random_uuid()::text,
  verified_at timestamp with time zone,

  -- Unsubscribe
  unsubscribe_token text DEFAULT gen_random_uuid()::text,
  unsubscribed_at timestamp with time zone,

  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),

  -- One subscription per email per blog
  UNIQUE(network_id, email)
);

-- Index for blog_subscribers
CREATE INDEX IF NOT EXISTS idx_blog_subscribers_network ON blog_subscribers(network_id);
CREATE INDEX IF NOT EXISTS idx_blog_subscribers_verified ON blog_subscribers(network_id, is_verified) WHERE is_verified = true;

-- ============================================
-- 5. RLS Policies for blog_posts
-- ============================================

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Public can read published posts from blog-type networks
CREATE POLICY "Public can read published blog posts"
ON blog_posts FOR SELECT
USING (
  is_published = true
  AND EXISTS (
    SELECT 1 FROM networks
    WHERE networks.id = blog_posts.network_id
    AND networks.network_type = 'blog'
  )
);

-- Blog admins can read all their posts (including unpublished)
CREATE POLICY "Blog admins can read all their posts"
ON blog_posts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.network_id = blog_posts.network_id
    AND profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Blog admins can create posts
CREATE POLICY "Blog admins can create posts"
ON blog_posts FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = blog_posts.created_by
    AND profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Blog admins can update their posts
CREATE POLICY "Blog admins can update posts"
ON blog_posts FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.network_id = blog_posts.network_id
    AND profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Blog admins can delete their posts
CREATE POLICY "Blog admins can delete posts"
ON blog_posts FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.network_id = blog_posts.network_id
    AND profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ============================================
-- 6. RLS Policies for blog_comments
-- ============================================

ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;

-- Public can read approved, non-hidden comments
CREATE POLICY "Public can read approved blog comments"
ON blog_comments FOR SELECT
USING (
  is_approved = true
  AND is_hidden = false
);

-- Blog admins can read all comments (for moderation)
CREATE POLICY "Blog admins can read all comments"
ON blog_comments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM blog_posts bp
    JOIN profiles p ON p.network_id = bp.network_id
    WHERE bp.id = blog_comments.post_id
    AND p.user_id = auth.uid()
    AND p.role = 'admin'
  )
);

-- Anyone can add comments (anonymous allowed)
CREATE POLICY "Anyone can add blog comments"
ON blog_comments FOR INSERT
WITH CHECK (true);

-- Blog admins can update comments (for moderation)
CREATE POLICY "Blog admins can update comments"
ON blog_comments FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM blog_posts bp
    JOIN profiles p ON p.network_id = bp.network_id
    WHERE bp.id = blog_comments.post_id
    AND p.user_id = auth.uid()
    AND p.role = 'admin'
  )
);

-- Blog admins can delete comments
CREATE POLICY "Blog admins can delete comments"
ON blog_comments FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM blog_posts bp
    JOIN profiles p ON p.network_id = bp.network_id
    WHERE bp.id = blog_comments.post_id
    AND p.user_id = auth.uid()
    AND p.role = 'admin'
  )
);

-- ============================================
-- 7. RLS Policies for blog_subscribers
-- ============================================

ALTER TABLE blog_subscribers ENABLE ROW LEVEL SECURITY;

-- Blog admins can view their subscribers
CREATE POLICY "Blog admins can view subscribers"
ON blog_subscribers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.network_id = blog_subscribers.network_id
    AND profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Anyone can subscribe (insert)
CREATE POLICY "Anyone can subscribe to blog"
ON blog_subscribers FOR INSERT
WITH CHECK (true);

-- Allow unsubscribe via token (handled by function)
CREATE POLICY "Anyone can unsubscribe with token"
ON blog_subscribers FOR UPDATE
USING (true)
WITH CHECK (true);

-- Blog admins can delete subscribers
CREATE POLICY "Blog admins can delete subscribers"
ON blog_subscribers FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.network_id = blog_subscribers.network_id
    AND profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ============================================
-- 8. Helper Functions
-- ============================================

-- Function to increment blog post view count (called from frontend)
CREATE OR REPLACE FUNCTION increment_blog_post_views(post_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE blog_posts
  SET view_count = view_count + 1
  WHERE id = post_uuid
  AND is_published = true;
END;
$$;

-- Function to ensure only one featured post per blog
CREATE OR REPLACE FUNCTION ensure_single_featured_post()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_featured = true THEN
    -- Unfeature all other posts in this blog
    UPDATE blog_posts
    SET is_featured = false
    WHERE network_id = NEW.network_id
    AND id != NEW.id
    AND is_featured = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_single_featured_post_trigger ON blog_posts;
CREATE TRIGGER ensure_single_featured_post_trigger
  BEFORE INSERT OR UPDATE ON blog_posts
  FOR EACH ROW
  WHEN (NEW.is_featured = true)
  EXECUTE FUNCTION ensure_single_featured_post();

-- Function to get blog by subdomain (public access)
CREATE OR REPLACE FUNCTION get_blog_by_subdomain(subdomain_param text)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  logo_url text,
  background_image_url text,
  theme_color text,
  theme_bg_color text,
  blog_settings jsonb,
  seo_settings jsonb,
  subdomain text,
  custom_domain text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    n.id,
    n.name,
    n.description,
    n.logo_url,
    n.background_image_url,
    n.theme_color,
    n.theme_bg_color::text,
    n.blog_settings,
    n.seo_settings,
    n.subdomain,
    n.custom_domain
  FROM networks n
  WHERE n.subdomain = subdomain_param
  AND n.network_type = 'blog';
END;
$$;

-- Function to get blog by custom domain (public access)
CREATE OR REPLACE FUNCTION get_blog_by_domain(domain_param text)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  logo_url text,
  background_image_url text,
  theme_color text,
  theme_bg_color text,
  blog_settings jsonb,
  seo_settings jsonb,
  subdomain text,
  custom_domain text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    n.id,
    n.name,
    n.description,
    n.logo_url,
    n.background_image_url,
    n.theme_color,
    n.theme_bg_color::text,
    n.blog_settings,
    n.seo_settings,
    n.subdomain,
    n.custom_domain
  FROM networks n
  WHERE n.custom_domain = domain_param
  AND n.network_type = 'blog';
END;
$$;

-- Function to validate subdomain format
CREATE OR REPLACE FUNCTION validate_subdomain()
RETURNS TRIGGER AS $$
BEGIN
  -- Only validate for blog networks with subdomain
  IF NEW.network_type = 'blog' AND NEW.subdomain IS NOT NULL THEN
    -- Subdomain must be lowercase alphanumeric with hyphens, 3-63 chars
    IF NEW.subdomain !~ '^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$' AND
       NEW.subdomain !~ '^[a-z0-9]{3,63}$' THEN
      RAISE EXCEPTION 'Invalid subdomain format. Use lowercase letters, numbers, and hyphens (3-63 characters).';
    END IF;

    -- Check reserved subdomains
    IF NEW.subdomain IN ('www', 'app', 'api', 'admin', 'blog', 'mail', 'ftp', 'smtp', 'imap', 'pop', 'ns1', 'ns2', 'cdn', 'static', 'assets', 'media', 'images', 'files', 'docs', 'help', 'support', 'status', 'beta', 'dev', 'staging', 'test', 'demo', 'conclav', 'dashboard', 'account', 'login', 'signup', 'register', 'auth', 'oauth', 'sso') THEN
      RAISE EXCEPTION 'This subdomain is reserved. Please choose a different one.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_subdomain_trigger ON networks;
CREATE TRIGGER validate_subdomain_trigger
  BEFORE INSERT OR UPDATE ON networks
  FOR EACH ROW
  EXECUTE FUNCTION validate_subdomain();

-- Function to convert blog to full network
CREATE OR REPLACE FUNCTION convert_blog_to_network(network_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_admin boolean;
BEGIN
  -- Check if user is admin of this network
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.network_id = network_uuid
    AND profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  ) INTO is_admin;

  IF NOT is_admin THEN
    RAISE EXCEPTION 'Only blog admins can convert to network';
  END IF;

  -- Update network type
  UPDATE networks
  SET
    network_type = 'network',
    -- Keep subdomain for backward compatibility but it won't be used
    updated_at = now()
  WHERE id = network_uuid
  AND network_type = 'blog';

  RETURN FOUND;
END;
$$;

-- ============================================
-- 9. Grant public access to blog functions
-- ============================================

GRANT EXECUTE ON FUNCTION get_blog_by_subdomain(text) TO anon;
GRANT EXECUTE ON FUNCTION get_blog_by_domain(text) TO anon;
GRANT EXECUTE ON FUNCTION increment_blog_post_views(uuid) TO anon;

-- ============================================
-- 10. Add comment to migration_log
-- ============================================

INSERT INTO migration_log (migration_name, status, notes)
VALUES (
  '20250110000000_add_blog_feature',
  'completed',
  'Added blog network type with blog_posts, blog_comments, blog_subscribers tables and RLS policies'
)
ON CONFLICT DO NOTHING;
