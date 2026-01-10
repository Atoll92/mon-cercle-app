# Personal Blog Feature - Implementation Plan

## Overview

Add a "Personal Blog" network type that provides a minimalist, public blog experience while reusing existing Conclav infrastructure. Blog networks have a simplified admin dashboard and a beautiful public-facing page.

## Database Changes

### 1. Add `network_type` column to `networks` table

```sql
-- Migration: 20250110000000_add_blog_network_type.sql

-- Add network_type column
ALTER TABLE public.networks
ADD COLUMN network_type text NOT NULL DEFAULT 'network'
CHECK (network_type IN ('network', 'blog'));

-- Add blog-specific columns
ALTER TABLE public.networks
ADD COLUMN custom_domain text UNIQUE,
ADD COLUMN subdomain text UNIQUE,
ADD COLUMN blog_settings jsonb DEFAULT '{
  "comments_enabled": true,
  "anonymous_comments": true,
  "comment_moderation": true,
  "newsletter_enabled": false,
  "rss_enabled": true,
  "about_page_content": "",
  "social_links": {}
}'::jsonb,
ADD COLUMN seo_settings jsonb DEFAULT '{
  "meta_title": "",
  "meta_description": "",
  "og_image_url": ""
}'::jsonb;

-- Create index for subdomain lookups
CREATE UNIQUE INDEX idx_networks_subdomain ON networks(subdomain) WHERE subdomain IS NOT NULL;
CREATE UNIQUE INDEX idx_networks_custom_domain ON networks(custom_domain) WHERE custom_domain IS NOT NULL;
```

### 2. Create `blog_posts` table

```sql
-- blog_posts table for blog content
CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  network_id uuid NOT NULL REFERENCES networks(id) ON DELETE CASCADE,

  -- Content
  title text,
  content text,

  -- Media (reuse existing media pattern)
  media_url text,
  media_type text CHECK (media_type IN ('image', 'video', 'audio', 'pdf')),
  media_metadata jsonb DEFAULT '{}',

  -- Featured post support
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

-- Indexes
CREATE INDEX idx_blog_posts_network ON blog_posts(network_id);
CREATE INDEX idx_blog_posts_published ON blog_posts(network_id, is_published, published_at DESC);
CREATE INDEX idx_blog_posts_featured ON blog_posts(network_id, is_featured) WHERE is_featured = true;

-- RLS Policies
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Public can read published posts from blog networks
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

-- Admins can manage their blog posts
CREATE POLICY "Blog admins can manage posts"
ON blog_posts FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = blog_posts.created_by
    AND profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
);
```

### 3. Create `blog_comments` table (for anonymous comments)

```sql
-- blog_comments for anonymous comment support
CREATE TABLE public.blog_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,

  -- Author (nullable for anonymous)
  profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,

  -- Anonymous author info
  author_name text,
  author_email text, -- Optional, for notifications

  -- Content
  content text NOT NULL,

  -- Threading
  parent_comment_id uuid REFERENCES blog_comments(id) ON DELETE CASCADE,

  -- Moderation
  is_approved boolean DEFAULT false, -- Requires approval by default
  is_hidden boolean DEFAULT false,

  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Indexes
CREATE INDEX idx_blog_comments_post ON blog_comments(post_id);
CREATE INDEX idx_blog_comments_parent ON blog_comments(parent_comment_id);
CREATE INDEX idx_blog_comments_approved ON blog_comments(post_id, is_approved) WHERE is_approved = true;

-- RLS Policies
ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;

-- Public can read approved comments
CREATE POLICY "Public can read approved blog comments"
ON blog_comments FOR SELECT
USING (is_approved = true AND is_hidden = false);

-- Anyone can insert comments (anonymous allowed)
CREATE POLICY "Anyone can add blog comments"
ON blog_comments FOR INSERT
WITH CHECK (true);

-- Blog admins can manage all comments
CREATE POLICY "Blog admins can manage comments"
ON blog_comments FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM blog_posts bp
    JOIN profiles p ON p.network_id = bp.network_id
    WHERE bp.id = blog_comments.post_id
    AND p.user_id = auth.uid()
    AND p.role = 'admin'
  )
);
```

### 4. Create `blog_subscribers` table (newsletter)

```sql
-- blog_subscribers for newsletter functionality
CREATE TABLE public.blog_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  network_id uuid NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
  email text NOT NULL,
  is_verified boolean DEFAULT false,
  verification_token text,
  unsubscribe_token text DEFAULT gen_random_uuid()::text,
  created_at timestamp with time zone DEFAULT now(),

  UNIQUE(network_id, email)
);

-- Index
CREATE INDEX idx_blog_subscribers_network ON blog_subscribers(network_id);

-- RLS
ALTER TABLE blog_subscribers ENABLE ROW LEVEL SECURITY;

-- Admins can view subscribers
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

-- Anyone can subscribe
CREATE POLICY "Anyone can subscribe"
ON blog_subscribers FOR INSERT
WITH CHECK (true);
```

### 5. Function to increment view count

```sql
-- Function to increment blog post view count
CREATE OR REPLACE FUNCTION increment_blog_post_views(post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE blog_posts
  SET view_count = view_count + 1
  WHERE id = post_id;
END;
$$;
```

---

## Frontend Changes

### Phase 1: Network Creation Updates

#### 1.1 Update NetworkOnboardingWizard.jsx

Add network type selection in Step 1 (Basic Info):

```jsx
// New state
const [networkType, setNetworkType] = useState('network'); // 'network' or 'blog'

// Add UI for selection
<FormControl component="fieldset" sx={{ mt: 3 }}>
  <FormLabel>What would you like to create?</FormLabel>
  <RadioGroup value={networkType} onChange={(e) => setNetworkType(e.target.value)}>
    <FormControlLabel
      value="network"
      control={<Radio />}
      label="Community Network - Full-featured community with events, chat, wiki, and more"
    />
    <FormControlLabel
      value="blog"
      control={<Radio />}
      label="Personal Blog - Simple public blog with media posts and optional comments"
    />
  </RadioGroup>
</FormControl>
```

When `blog` is selected:
- Skip Step 2 (Privacy & Purpose) - blogs are always public
- Skip Step 3 (Features) - blogs have fixed minimal features
- Go directly to Step 4 (Branding) with blog-specific options
- Add subdomain field in branding step

#### 1.2 Create BlogOnboardingSteps.jsx

Simplified wizard steps for blog creation:
1. **Basic Info**: Name, description, subdomain
2. **Branding**: Logo, theme color, background
3. **Settings**: Comments (on/off), Anonymous comments, Newsletter
4. **About Page**: Bio, social links
5. **Review & Create**

### Phase 2: Public Blog Page

#### 2.1 Create PublicBlogPage.jsx

New page at `/blog/:subdomain` or custom domain:

```jsx
// src/pages/PublicBlogPage.jsx
const PublicBlogPage = () => {
  // Fetch blog by subdomain
  // Display header with logo, name, social links
  // Show featured post prominently
  // Grid of blog posts (reuse SocialWallGrid patterns)
  // About section
  // Newsletter signup if enabled
};
```

Components:
- `BlogHeader` - Logo, name, navigation
- `BlogPostCard` - Individual post card (based on PostCard)
- `BlogPostPage` - Full post view with comments
- `BlogAboutSection` - About the author
- `NewsletterSignup` - Email subscription form
- `BlogCommentSection` - Comments with anonymous support

#### 2.2 Create BlogPostCard.jsx

Adapted from existing PostCard:
- Clean, minimal design
- Media display (images, video, audio, PDF)
- View count display
- Featured badge if applicable
- Click to open full post

#### 2.3 Create BlogCommentSection.jsx

New component for blog comments:
- Anonymous name/email fields (optional)
- Threaded replies
- Pending approval notice
- Admin moderation UI

### Phase 3: Simplified Admin Dashboard

#### 3.1 Create BlogAdminLayout.jsx

Simplified admin layout for blog networks:

```jsx
const blogAdminTabs = [
  { id: 'posts', label: 'Posts', icon: ArticleIcon },
  { id: 'comments', label: 'Comments', icon: CommentIcon },
  { id: 'subscribers', label: 'Subscribers', icon: MailIcon },
  { id: 'analytics', label: 'Analytics', icon: BarChartIcon },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
  { id: 'theme', label: 'Theme', icon: PaletteIcon },
];
```

#### 3.2 Create BlogPostsTab.jsx

- List of all posts with status
- Create/Edit/Delete posts
- Feature/unfeature posts
- Reuse CreatePostModal patterns

#### 3.3 Create BlogCommentsTab.jsx

- List of pending comments for approval
- List of approved comments
- Approve/reject/delete actions
- Reply as admin

#### 3.4 Create BlogSubscribersTab.jsx

- List of newsletter subscribers
- Export subscribers
- Send newsletter (future enhancement)

#### 3.5 Create BlogAnalyticsTab.jsx

- Total views
- Views per post
- Subscriber count
- Comment activity

#### 3.6 Create BlogSettingsTab.jsx

- Blog name, description
- Subdomain (if not custom domain)
- Custom domain setup instructions
- Comments settings
- Newsletter toggle
- Social links
- About page content
- SEO settings (meta title, description, OG image)
- Convert to full network option

### Phase 4: RSS Feed

#### 4.1 Create RSS Edge Function

```typescript
// supabase/functions/blog-rss/index.ts
// Generate RSS 2.0 feed for blog posts
```

### Phase 5: SEO & Domain Handling

#### 5.1 Update App.jsx routing

```jsx
// Add public blog routes
<Route path="/blog/:subdomain" element={<PublicBlogPage />} />
<Route path="/blog/:subdomain/post/:postId" element={<BlogPostPage />} />
<Route path="/blog/:subdomain/about" element={<BlogAboutPage />} />
```

#### 5.2 Create DomainResolver component

For custom domains, resolve domain to network_id:
- Check `custom_domain` column
- Redirect to appropriate blog

#### 5.3 SEO Meta Tags

Use react-helmet or similar for:
- Dynamic page titles
- Meta descriptions
- Open Graph tags
- Twitter cards

---

## API Functions

### src/api/blog.js

```javascript
// Blog Posts
export const fetchBlogPosts = async (supabase, networkId, options = {}) => {...}
export const fetchBlogPost = async (supabase, postId) => {...}
export const createBlogPost = async (supabase, postData) => {...}
export const updateBlogPost = async (supabase, postId, postData) => {...}
export const deleteBlogPost = async (supabase, postId) => {...}
export const toggleFeaturedPost = async (supabase, postId, isFeatured) => {...}
export const incrementPostViews = async (supabase, postId) => {...}

// Blog Comments
export const fetchBlogComments = async (supabase, postId) => {...}
export const addBlogComment = async (supabase, commentData) => {...}
export const approveBlogComment = async (supabase, commentId) => {...}
export const deleteBlogComment = async (supabase, commentId) => {...}

// Blog Subscribers
export const fetchBlogSubscribers = async (supabase, networkId) => {...}
export const subscribeToBlog = async (supabase, networkId, email) => {...}
export const unsubscribeFromBlog = async (supabase, token) => {...}

// Blog Settings
export const fetchBlogBySubdomain = async (supabase, subdomain) => {...}
export const fetchBlogByDomain = async (supabase, domain) => {...}
export const updateBlogSettings = async (supabase, networkId, settings) => {...}
```

---

## File Structure

```
src/
├── pages/
│   ├── PublicBlogPage.jsx          # Main public blog page
│   ├── BlogPostPage.jsx            # Individual post page
│   └── BlogAboutPage.jsx           # About the author page
│
├── components/
│   ├── blog/
│   │   ├── BlogHeader.jsx          # Public blog header
│   │   ├── BlogPostCard.jsx        # Post card for grid
│   │   ├── BlogPostContent.jsx     # Full post content display
│   │   ├── BlogCommentSection.jsx  # Comments with anonymous support
│   │   ├── BlogAboutSection.jsx    # About section
│   │   ├── NewsletterSignup.jsx    # Newsletter form
│   │   ├── BlogSocialLinks.jsx     # Social media links
│   │   └── BlogSEO.jsx             # SEO meta tags
│   │
│   ├── admin/blog/
│   │   ├── BlogAdminLayout.jsx     # Simplified admin layout
│   │   ├── BlogPostsTab.jsx        # Manage posts
│   │   ├── BlogCommentsTab.jsx     # Moderate comments
│   │   ├── BlogSubscribersTab.jsx  # Newsletter subscribers
│   │   ├── BlogAnalyticsTab.jsx    # View analytics
│   │   ├── BlogSettingsTab.jsx     # Blog settings
│   │   └── CreateBlogPostModal.jsx # Create/edit posts
│   │
│   └── NetworkOnboardingWizard.jsx # Updated with blog option
│
├── api/
│   └── blog.js                     # Blog API functions
│
└── hooks/
    └── useBlog.js                  # Blog-related hooks

supabase/
├── migrations/
│   └── 20250110000000_add_blog_feature.sql
│
└── functions/
    └── blog-rss/
        └── index.ts                # RSS feed generator
```

---

## Implementation Order

### Sprint 1: Database & Core Setup
1. Create database migration
2. Add network_type to network creation
3. Create blog API functions
4. Update NetworkOnboardingWizard for blog selection

### Sprint 2: Public Blog Page
1. Create PublicBlogPage
2. Create BlogPostCard (reuse PostCard patterns)
3. Create BlogHeader
4. Create BlogPostPage (individual post view)
5. Implement subdomain routing

### Sprint 3: Admin Dashboard
1. Create BlogAdminLayout
2. Create BlogPostsTab
3. Create CreateBlogPostModal (reuse existing media upload)
4. Create BlogSettingsTab

### Sprint 4: Comments & Engagement
1. Create BlogCommentSection with anonymous support
2. Create BlogCommentsTab (moderation)
3. Implement comment threading

### Sprint 5: Newsletter & Analytics
1. Create NewsletterSignup
2. Create BlogSubscribersTab
3. Create BlogAnalyticsTab
4. Implement view counting

### Sprint 6: SEO & RSS
1. Add SEO meta tags
2. Create RSS feed function
3. Create BlogAboutPage
4. Add social links

### Sprint 7: Polish & Custom Domains
1. Custom domain documentation/instructions
2. Convert blog to network feature
3. Testing & bug fixes

---

## Custom Domain Setup (Manual Process)

For custom domains, users will need to:

1. **Add CNAME record** pointing to `blog.conclav.club`
2. **Verify ownership** in blog settings
3. **SSL certificate** handled automatically by Cloudflare/hosting

The app will:
1. Store custom_domain in networks table
2. Verify DNS configuration
3. Route requests based on Host header

---

## Questions Resolved

1. **Subdomain**: `{name}.conclav.club` - stored in `subdomain` column
2. **Convert blog to network**: Yes, via settings - changes `network_type`
3. **Fully public**: Yes, no login required to view
4. **Custom branding**: Yes, logo, colors, background
5. **Custom domain**: Yes, CNAME setup with verification
6. **Media**: Images, video, audio, PDF (reuse existing)
7. **Categories/tags**: No (as requested)
8. **Featured post**: Yes, one featured post option
9. **Anonymous comments**: Yes, with optional name/email
10. **Threading**: Yes, unlimited depth
11. **Moderation**: Yes, approval required before visible
12. **Newsletter**: Yes, email subscription
13. **RSS**: Yes, auto-generated
14. **SEO**: Yes, meta tags, OG image
15. **Reading time**: No
16. **Scheduling**: No
17. **View count**: Yes, simple analytics
18. **About page**: Yes
19. **Social links**: Yes
20. **Reuse existing code**: Yes, PostCard patterns, media upload, etc.

---

## Ready to implement?

This plan is comprehensive and ready for implementation. Should I proceed with Sprint 1 (Database & Core Setup)?
