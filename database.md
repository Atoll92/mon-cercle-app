# Complete Database Schema & Data Documentation

*Generated on 2025-06-26 using database migrations and schema analysis*

## Overview

This document provides a comprehensive overview of the Conclav application database schema, built on Supabase (PostgreSQL). The database implements a **multiple profiles system** where users can have separate profiles for each network they join, enabling a 1:many:many relationship between Users:Profiles:Networks.

### Database Statistics

- **Database Type**: PostgreSQL (Supabase)
- **Connection**: https://etoxvocwsktguoddmgcu.supabase.co
- **Migration Count**: 50+ migrations
- **Core Tables**: 35+ application tables
- **Key Features**: Multi-tenancy, RLS security, real-time subscriptions

## Architecture Overview

### Multi-Profile System (Post-Migration)

The database underwent a major migration (`20250606100000_big_multiprofile_migration.sql`) to support multiple profiles per user:

- **Users** (auth.users): Base authentication (1 user)  
- **Profiles** (profiles): Network-specific profiles (many per user)
- **Networks** (networks): Communities/organizations (many)

**Key Changes:**
- `profiles.id`: Now generated UUIDs (not user IDs)
- `profiles.user_id`: References `auth.users.id`
- `profiles.network_id`: Cannot be changed after creation (immutable)
- **Unique Constraint**: `(user_id, network_id)` - one profile per user per network

## Auth Tables (Supabase Built-in)

```sql
auth.users
├── id (uuid, PK)
├── email (varchar)
├── created_at (timestamp)
├── updated_at (timestamp)
└── [other Supabase auth fields]
```

## Application Tables

### 1. User & Profile Management

#### profiles (MULTIPLE PROFILES SYSTEM)
*Core table enabling multiple network memberships per user*

```sql
profiles
├── id (uuid, PK, generated UUID) -- Profile-specific ID
├── user_id (uuid, NOT NULL, FK to auth.users.id) -- References authenticated user
├── network_id (uuid, NOT NULL, FK to networks.id) -- Network this profile belongs to
├── UNIQUE CONSTRAINT (user_id, network_id) -- One profile per user per network
├── full_name (text)
├── contact_email (text)
├── bio (text)
├── role (text, NOT NULL, default 'member') -- 'admin' or 'member'
├── profile_picture_url (text)
├── portfolio_url (text)
├── linkedin_url (text)
├── skills (text[])
├── is_suspended (boolean, default false)
├── suspension_reason (text)
├── suspension_end_date (timestamp with time zone)
├── restriction_level (text)
├── restriction_reason (text)
├── last_active (timestamp with time zone)
├── email_notifications_enabled (boolean, default true)
├── notify_on_news (boolean, default true)
├── notify_on_events (boolean, default true)
├── notify_on_mentions (boolean, default true)
├── notify_on_direct_messages (boolean, default true)
├── badge_count (integer, default 0)
├── portfolio_data (jsonb) -- Legacy field
├── created_at (timestamp with time zone, NOT NULL, default now())
└── updated_at (timestamp with time zone)

-- Constraints:
-- profiles_user_id_network_id_key UNIQUE (user_id, network_id)
-- profiles_network_id_fkey FK to networks(id) ON DELETE CASCADE
-- prevent_network_id_update() trigger prevents network_id changes
```

#### portfolio_items
*User portfolio projects with media support*

```sql
portfolio_items
├── id (uuid, PK)
├── profile_id (uuid, FK to profiles.id)
├── title (varchar)
├── description (text)
├── url (varchar)
├── image_url (varchar)
├── file_type (text)
├── media_url (text) -- Single media file URL
├── media_type (text) -- 'image', 'video', 'audio', or 'pdf'
├── media_metadata (jsonb) -- Metadata for media files
├── category_id (uuid, FK to network_categories.id)
└── created_at (timestamp)
```

### 2. Network Management

#### networks
*Core network/community configuration*

```sql
networks
├── id (uuid, PK)
├── name (text, NOT NULL)
├── description (text)
├── logo_url (text)
├── background_image_url (text)
├── privacy_level (text, default 'private') -- 'public', 'private', 'invite-only'
├── purpose (text, default 'general') -- 'community', 'professional', 'educational', 'hobby', 'general', 'other'
├── theme_color (text, default '#1976d2')
├── theme_bg_color (character varying, default '#ffffff')
├── features_config (jsonb, default feature config) -- Feature toggles
├── enabled_tabs (jsonb, default tabs config) -- Navigation tabs configuration
├── subscription_status (text, default 'free')
├── subscription_plan (text, default 'community')
├── subscription_start_date (timestamp with time zone)
├── subscription_end_date (timestamp with time zone)
├── subscription_updated_at (timestamp with time zone)
├── stripe_customer_id (text)
├── stripe_subscription_id (text)
├── stripe_account_id (text)
├── last_invoice_id (text)
├── last_payment_date (timestamp with time zone)
├── trial_start_date (timestamp with time zone)
├── trial_end_date (timestamp with time zone)
├── is_trial (boolean, default false)
├── trial_days_used (integer, default 0)
├── created_by (text) -- References auth.users.id as text
├── created_at (timestamp with time zone, default now())
└── updated_at (timestamp with time zone)
```

#### invitations
*Network invitation management*

```sql
invitations
├── id (uuid, PK)
├── email (text, NOT NULL)
├── network_id (uuid, FK to networks.id, NOT NULL)
├── invited_by (uuid, FK to auth.users.id, NOT NULL)
├── status (text, NOT NULL, default 'pending') -- 'pending', 'accepted', 'declined'
├── role (text, NOT NULL, default 'member') -- 'admin' or 'member'
├── expires_at (timestamp with time zone)
├── created_at (timestamp with time zone, default now())
└── updated_at (timestamp with time zone, default now())
```

#### network_invitation_links
*Shareable invitation links with QR codes*

```sql
network_invitation_links
├── id (uuid, PK)
├── network_id (uuid, FK to networks.id, NOT NULL)
├── code (character varying, NOT NULL)
├── created_by (uuid, FK to profiles.id, NOT NULL)
├── name (character varying)
├── description (text)
├── role (character varying, default 'member') -- 'admin' or 'member'
├── max_uses (integer, nullable)
├── uses_count (integer, default 0)
├── expires_at (timestamp with time zone, nullable)
├── is_active (boolean, default true)
├── created_at (timestamp with time zone, default now())
└── updated_at (timestamp with time zone, default now())
```

### 3. Events & Participation

#### network_events
*Event management with location and payment support*

```sql
network_events
├── id (uuid, PK)
├── network_id (uuid, FK to networks.id, NOT NULL)
├── title (text, NOT NULL)
├── description (text)
├── date (timestamp with time zone, NOT NULL)
├── location (text, NOT NULL)
├── coordinates (jsonb) -- {latitude, longitude}
├── cover_image_url (text)
├── capacity (integer)
├── max_tickets (integer)
├── tickets_sold (integer, default 0)
├── price (numeric, default 0)
├── currency (text, default 'EUR')
├── event_link (text)
├── created_by (uuid, FK to profiles.id, NOT NULL)
├── created_at (timestamp with time zone, default now())
└── updated_at (timestamp with time zone)
```

#### event_participations
*RSVP and payment tracking*

```sql
event_participations
├── id (uuid, PK)
├── event_id (uuid, FK to network_events.id, NOT NULL)
├── profile_id (uuid, FK to profiles.id, NOT NULL)
├── status (character varying, NOT NULL) -- 'attending', 'maybe', 'declined'
├── payment_status (text, default 'free') -- 'free', 'paid', 'pending'
├── payment_amount (numeric)
├── payment_date (timestamp with time zone)
├── stripe_payment_id (text)
├── created_at (timestamp with time zone, default now())
└── updated_at (timestamp with time zone, default now())
```

### 4. Content & News

#### network_news
*News posts with rich media support*

```sql
network_news
├── id (uuid, PK)
├── network_id (uuid, FK to networks.id)
├── title (text)
├── content (text)
├── created_by (uuid, FK to profiles.id)
├── image_url (text)
├── image_caption (text)
├── media_url (text) -- Single media file URL
├── media_type (text) -- 'image', 'video', 'audio', or 'pdf'
├── media_metadata (jsonb, default '{}') -- Metadata for media files
├── category_id (uuid, FK to network_categories.id)
├── is_hidden (boolean, default false)
├── is_flagged (boolean, default false)
├── flag_reason (text)
├── created_at (timestamp with time zone, default now())
└── updated_at (timestamp with time zone)
```

#### network_categories
*Content categorization system*

```sql
network_categories
├── id (uuid, PK)
├── network_id (uuid, FK to networks.id)
├── name (varchar(100))
├── slug (varchar(100))
├── description (text, nullable)
├── color (varchar(7), nullable)
├── sort_order (integer, default 0)
├── is_active (boolean, default true)
├── created_by (uuid, FK to profiles.id, nullable)
├── created_at (timestamp)
└── updated_at (timestamp)
```

### 5. File Management

#### network_files
*Shared file storage and tracking*

```sql
network_files
├── id (uuid, PK)
├── network_id (uuid, FK to networks.id, NOT NULL)
├── uploaded_by (uuid, FK to profiles.id, NOT NULL)
├── filename (text, NOT NULL)
├── filepath (text, NOT NULL)
├── file_url (text, NOT NULL)
├── file_size (bigint, NOT NULL)
├── file_type (text)
├── description (text)
├── download_count (integer, default 0)
├── created_at (timestamp with time zone, default now())
└── updated_at (timestamp with time zone, default now())
```

#### media_uploads
*Media file metadata and management*

```sql
media_uploads
├── id (uuid, PK)
├── uploaded_by (uuid, FK to profiles.id)
├── network_id (uuid, FK to networks.id, nullable)
├── url (text, NOT NULL)
├── file_name (text)
├── media_type (text, NOT NULL)
├── mime_type (text)
├── file_size (bigint)
├── dimensions (jsonb)
├── duration (double precision)
├── metadata (jsonb, default '{}') -- Dimensions, duration, thumbnails, etc.
└── created_at (timestamp with time zone, default now())
```

### 6. Messaging & Communication

#### direct_conversations
*Private conversation management*

```sql
direct_conversations
├── id (uuid, PK)
├── participants (uuid[], NOT NULL) -- Array of user IDs (profiles.id)
├── created_at (timestamp with time zone, default now())
├── updated_at (timestamp with time zone, default now())
└── last_message_at (timestamp with time zone, default now())
```

#### direct_messages
*Private messaging with media support*

```sql
direct_messages
├── id (uuid, PK)
├── conversation_id (uuid, FK to direct_conversations.id, NOT NULL)
├── sender_id (uuid, FK to profiles.id, NOT NULL)
├── recipient_id (uuid, FK to auth.users.id)
├── content (text, NOT NULL)
├── media_url (text) -- Single media file URL
├── media_type (text) -- Media type
├── media_metadata (jsonb, default '{}') -- Media metadata
├── read_at (timestamp with time zone)
├── created_at (timestamp with time zone, default now())
└── updated_at (timestamp with time zone)
```

#### messages
*Network chat with replies and media*

```sql
messages
├── id (uuid, PK)
├── network_id (uuid, FK to networks.id, NOT NULL)
├── user_id (uuid, FK to profiles.id, NOT NULL)
├── content (text, NOT NULL)
├── is_hidden (boolean, default false)
├── is_flagged (boolean, default false)
├── flag_reason (text)
├── parent_message_id (uuid, FK to messages.id, nullable) -- For reply threads
├── reply_to_user_id (uuid, FK to profiles.id, nullable) -- User being replied to
├── reply_to_content (text, nullable) -- Preview of replied message
├── media_url (text) -- Single media file URL
├── media_type (text) -- Media type
├── media_metadata (jsonb, default '{}') -- Media metadata
└── created_at (timestamp with time zone, NOT NULL, default now())
```

### 7. Moodboards

#### moodboards
*Visual content boards*

```sql
moodboards
├── id (uuid, PK)
├── network_id (uuid, FK to networks.id)
├── title (text)
├── description (text)
├── permissions (text) -- 'personal', 'private', 'collaborative', 'public'
├── background_color (text)
├── created_by (uuid, FK to profiles.id)
├── is_personal (boolean)
├── created_at (timestamp)
└── updated_at (timestamp)
```

#### moodboard_items
*Individual moodboard content pieces*

```sql
moodboard_items
├── id (uuid, PK)
├── moodboard_id (uuid, FK to moodboards.id)
├── type (text) -- 'image', 'text', 'video', 'link'
├── content (text)
├── title (text, nullable)
├── x (double precision)
├── y (double precision)
├── width (double precision)
├── height (double precision)
├── rotation (double precision, default 0)
├── zIndex (integer, default 0)
├── textColor (text, nullable)
├── backgroundColor (text, nullable)
├── font_family (text, nullable)
├── font_size (text, nullable)
├── font_weight (text, nullable)
├── text_align (text, nullable)
├── line_height (text, nullable)
├── opacity (double precision, default 1)
├── border_radius (double precision, default 0)
├── metadata (jsonb, default '{}')
├── created_by (uuid, FK to profiles.id)
├── created_at (timestamp)
└── updated_at (timestamp)
```

### 8. Wiki System

#### wiki_pages
*Collaborative documentation*

```sql
wiki_pages
├── id (uuid, PK)
├── network_id (uuid, FK to networks.id, NOT NULL)
├── title (character varying, NOT NULL)
├── content (text)
├── slug (character varying, NOT NULL)
├── is_published (boolean, default false)
├── views_count (integer, default 0)
├── created_by (uuid, FK to profiles.id)
├── last_edited_by (uuid, FK to profiles.id)
├── created_at (timestamp with time zone, default now())
└── updated_at (timestamp with time zone, default now())
```

#### wiki_categories
*Wiki page organization*

```sql
wiki_categories
├── id (uuid, PK)
├── network_id (uuid, FK to networks.id, NOT NULL)
├── name (character varying, NOT NULL)
├── slug (character varying, NOT NULL)
├── description (text)
├── created_by (uuid, FK to auth.users.id)
└── created_at (timestamp with time zone, default now())
```

#### wiki_comments
*Comments on wiki pages*

```sql
wiki_comments
├── id (uuid, PK)
├── page_id (uuid, FK to wiki_pages.id, NOT NULL)
├── profile_id (uuid, FK to profiles.id, NOT NULL)
├── content (text, NOT NULL)
├── is_hidden (boolean, default false)
├── hidden_at (timestamp with time zone)
├── hidden_by (uuid, FK to profiles.id)
└── created_at (timestamp with time zone, default now())
```

#### wiki_revisions
*Version control for wiki pages*

```sql
wiki_revisions
├── id (uuid, PK)
├── page_id (uuid, FK to wiki_pages.id, NOT NULL)
├── content (text, NOT NULL)
├── revision_number (integer, NOT NULL)
├── comment (character varying)
├── created_by (uuid, FK to profiles.id, NOT NULL)
├── is_approved (boolean, default false)
├── approved_by (uuid, FK to profiles.id)
├── approved_at (timestamp with time zone)
└── created_at (timestamp with time zone, default now())
```

#### wiki_page_permissions
*Fine-grained wiki access control*

```sql
wiki_page_permissions
├── id (uuid, PK)
├── page_id (uuid, FK to wiki_pages.id)
├── profile_id (uuid, FK to profiles.id, nullable)
├── role (varchar) -- 'editor', 'viewer', etc.
├── created_by (uuid, FK to profiles.id)
└── created_at (timestamp)
```

#### wiki_page_categories
*Many-to-many wiki categorization*

```sql
wiki_page_categories
├── page_id (uuid, FK to wiki_pages.id)
└── category_id (uuid, FK to wiki_categories.id)
```

### 9. Polls System

#### network_polls
*Interactive polling with multiple types*

```sql
network_polls
├── id (uuid, PK)
├── network_id (uuid, FK to networks.id, NOT NULL)
├── created_by (uuid, FK to profiles.id, NOT NULL)
├── title (character varying, NOT NULL)
├── description (text, nullable)
├── poll_type (character varying, NOT NULL) -- 'multiple_choice', 'yes_no', 'date_picker'
├── options (jsonb) -- Array of poll options
├── allow_multiple_votes (boolean, default false)
├── is_anonymous (boolean, default true)
├── status (character varying, default 'active')
├── starts_at (timestamp with time zone, default now())
├── ends_at (timestamp with time zone, nullable)
├── created_at (timestamp with time zone, default now())
└── updated_at (timestamp with time zone, default now())
```

#### network_poll_votes
*Poll voting records*

```sql
network_poll_votes
├── id (uuid, PK)
├── poll_id (uuid, FK to network_polls.id)
├── user_id (uuid, FK to profiles.id)
├── selected_options (jsonb) -- Array of selected option indices
└── created_at (timestamp)
```

### 10. Social Features

#### social_wall_comments
*Threaded comments system*

```sql
social_wall_comments
├── id (uuid, PK)
├── item_id (uuid, NOT NULL) -- References news or portfolio item
├── item_type (character varying, NOT NULL) -- 'news' or 'post'
├── profile_id (uuid, FK to profiles.id, NOT NULL)
├── content (text, NOT NULL)
├── parent_comment_id (uuid, FK to social_wall_comments.id, nullable)
├── is_hidden (boolean, default false)
├── created_at (timestamp with time zone, default now())
└── updated_at (timestamp with time zone, default now())
```

### 11. Badges & Engagement

#### badges
*Achievement and engagement recognition*

```sql
badges
├── id (uuid, PK)
├── network_id (uuid, FK to networks.id, nullable)
├── name (character varying, NOT NULL)
├── description (text, nullable)
├── icon (character varying, NOT NULL)
├── color (character varying, default 'primary')
├── criteria_type (character varying, NOT NULL)
├── criteria_value (integer, default 0)
├── is_active (boolean, default true)
├── created_by (uuid, FK to profiles.id, nullable)
├── achieved_at (timestamp with time zone, default now())
├── created_at (timestamp with time zone, NOT NULL, default now())
└── updated_at (timestamp with time zone, NOT NULL, default now())
```

#### user_badges
*Badge assignments to users*

```sql
user_badges
├── id (uuid, PK)
├── user_id (uuid, FK to profiles.id)
├── badge_id (uuid, FK to badges.id)
├── awarded_by (uuid, FK to profiles.id, nullable)
├── awarded_at (timestamp with time zone, NOT NULL, default now())
└── reason (text, nullable)
```

#### engagement_stats
*User activity tracking*

```sql
engagement_stats
├── id (uuid, PK)
├── user_id (uuid, FK to profiles.id)
├── network_id (uuid, FK to networks.id)
├── posts_count (integer, default 0)
├── events_attended (integer, default 0)
├── messages_sent (integer, default 0)
├── wiki_contributions (integer, default 0)
├── polls_participated (integer, default 0)
├── files_shared (integer, default 0)
├── last_active (timestamp with time zone, NOT NULL, default now())
├── member_since (timestamp with time zone, NOT NULL, default now())
└── updated_at (timestamp with time zone, NOT NULL, default now())
```

### 12. Moderation & Administration

#### moderation_logs
*Content and user moderation audit trail*

```sql
moderation_logs
├── id (uuid, PK)
├── network_id (uuid, FK to networks.id, NOT NULL)
├── moderator_id (uuid, FK to profiles.id, NOT NULL)
├── target_id (uuid, NOT NULL) -- References target user/content ID
├── target_type (text, NOT NULL) -- 'message', 'news', 'profile', 'user'
├── action (text, NOT NULL) -- 'hide', 'flag', 'suspend', 'restrict', 'unsuspend', 'unrestrict'
├── reason (text)
└── created_at (timestamp with time zone, default now())
```

#### notification_queue
*Email notification management*

```sql
notification_queue
├── id (uuid, PK)
├── recipient_id (uuid, FK to profiles.id)
├── network_id (uuid, FK to networks.id)
├── notification_type (varchar(50)) -- 'news', 'event', 'mention', 'direct_message'
├── subject_line (varchar(255))
├── content_preview (text, nullable)
├── related_item_id (uuid, nullable)
├── is_sent (boolean, default false)
├── created_at (timestamp)
├── sent_at (timestamp, nullable)
└── error_message (text, nullable)
```

### 13. Support System

#### support_tickets
*Help desk and customer support*

```sql
support_tickets
├── id (uuid, PK)
├── network_id (uuid, FK to networks.id, nullable) -- Null for system tickets
├── submitted_by (uuid, FK to profiles.id, nullable) -- Null for system tickets
├── assigned_to (uuid, FK to profiles.id, nullable)
├── title (character varying, NOT NULL)
├── description (text, NOT NULL)
├── category (character varying) -- 'technical', 'billing', 'feature', 'bug', 'other'
├── priority (character varying, default 'medium') -- 'low', 'medium', 'high', 'urgent'
├── status (character varying, default 'open') -- 'open', 'in_progress', 'waiting_response', 'resolved', 'closed'
├── created_at (timestamp with time zone, default now())
├── updated_at (timestamp with time zone, default now())
└── resolved_at (timestamp with time zone, nullable)
```

#### ticket_messages
*Threaded support conversations*

```sql
ticket_messages
├── id (uuid, PK)
├── ticket_id (uuid, FK to support_tickets.id)
├── sender_id (uuid, FK to profiles.id, nullable) -- Null for system messages
├── message (text, NOT NULL)
├── is_internal (boolean, default false) -- For internal notes between super admins
└── created_at (timestamp with time zone, default now())
```

### 14. Monetization & Donations

#### donations
*Network funding and donations*

```sql
donations
├── id (uuid, PK)
├── network_id (uuid, FK to networks.id)
├── donor_id (uuid, FK to profiles.id)
├── amount (numeric, NOT NULL)
├── currency (text, default 'EUR')
├── message (text, nullable)
├── is_anonymous (boolean, default false)
├── stripe_payment_id (text)
└── created_at (timestamp with time zone, default now())
```

#### membership_plans
*Subscription tier management*

```sql
membership_plans
├── id (uuid, PK)
├── network_id (uuid, FK to networks.id)
├── name (text, NOT NULL)
├── description (text, nullable)
├── price (numeric, NOT NULL, default 0)
├── currency (text, default 'EUR')
├── interval (text, NOT NULL, default 'month') -- 'month', 'year', etc.
├── features (jsonb, default '[]')
├── stripe_price_id (text)
├── is_active (boolean, default true)
├── created_at (timestamp with time zone, default now())
└── updated_at (timestamp with time zone, default now())
```

#### member_subscriptions
*Individual member subscription tracking*

```sql
member_subscriptions
├── id (uuid, PK)
├── network_id (uuid, FK to networks.id)
├── profile_id (uuid, FK to profiles.id)
├── plan_id (uuid, FK to membership_plans.id)
├── status (text, NOT NULL, default 'active') -- 'active', 'canceled', 'past_due', etc.
├── stripe_subscription_id (text)
├── current_period_start (timestamp with time zone)
├── current_period_end (timestamp with time zone)
├── created_at (timestamp with time zone, default now())
└── updated_at (timestamp with time zone, default now())
```

### 15. Cache & Optimization

#### opengraph_cache
*URL preview optimization*

```sql
opengraph_cache
├── id (uuid, PK)
├── url (text, NOT NULL)
├── data (jsonb, NOT NULL) -- Complete OpenGraph data
├── created_at (timestamp with time zone, default now())
└── updated_at (timestamp with time zone, default now())
```

#### migration_log
*Database migration tracking*

```sql
migration_log
├── id (serial, PK)
├── migration_name (text, NOT NULL)
├── executed_at (timestamp with time zone, default now())
├── status (text, NOT NULL)
└── notes (text)
```

## Row-Level Security (RLS) Policies

All sensitive tables implement comprehensive RLS policies enforcing:

### Core Security Principles

1. **Network Membership**: Users can only access data from networks they belong to
2. **Profile Ownership**: Users can only modify their own profile data
3. **Admin Privileges**: Network admins have moderation and management access
4. **System Access**: Some operations reserved for service role
5. **Multi-Profile Support**: All policies account for `profiles.user_id = auth.uid()` pattern

### Key Policy Updates (Post Multi-Profile Migration)

The migration to multiple profiles required updating 25+ RLS policies from:
- ❌ OLD: `profiles.id = auth.uid()` 
- ✅ NEW: `profiles.user_id = auth.uid()`

**Examples:**

```sql
-- Messages RLS Policy
CREATE POLICY "Allow network members to read messages" ON messages
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.network_id = messages.network_id 
        AND profiles.user_id = auth.uid()
    )
);

-- Media Uploads RLS Policy  
CREATE POLICY "Users can upload media" ON media_uploads
FOR INSERT WITH CHECK (
    uploaded_by IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
    )
);
```

## Database Functions

### Core Functions

#### get_active_profile_id()
*Helper function for profile context (frontend implementation required)*

```sql
CREATE OR REPLACE FUNCTION get_active_profile_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    profile_id uuid;
BEGIN
    -- Implemented by frontend via localStorage/cookies
    -- For gradual migration compatibility
    RETURN null;
END;
$$;
```

#### prevent_network_id_update()
*Enforces network_id immutability*

```sql
CREATE OR REPLACE FUNCTION prevent_network_id_update()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'UPDATE' AND OLD.network_id IS DISTINCT FROM NEW.network_id THEN
    RAISE EXCEPTION 'Cannot change network_id after profile creation.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### verify_multiprofile_migration()
*Migration integrity verification*

```sql
CREATE OR REPLACE FUNCTION verify_multiprofile_migration()
RETURNS TABLE (
    check_name text,
    status text,
    details text
) 
LANGUAGE plpgsql
-- Returns verification results for:
-- - profiles_user_id_populated
-- - user_network_uniqueness  
-- - foreign_key_integrity
-- - id_mapping_complete
-- - wiki_system_integrity
```

## Performance Optimizations

### Key Indexes

```sql
-- Profile lookups
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_network_id ON profiles(network_id);
CREATE INDEX idx_profiles_user_network ON profiles(user_id, network_id);

-- Message performance
CREATE INDEX idx_messages_network_created ON messages(network_id, created_at);
CREATE INDEX idx_messages_parent_id ON messages(parent_message_id);

-- Media optimization
CREATE INDEX idx_media_uploads_network ON media_uploads(network_id);
CREATE INDEX idx_media_uploads_type ON media_uploads(media_type);

-- Event queries
CREATE INDEX idx_network_events_date ON network_events(network_id, date);

-- Notification processing
CREATE INDEX idx_notification_queue_unsent ON notification_queue(is_sent, created_at);
```

## Data Relationships Overview

### Core Entity Relationships

```
auth.users (1) ←→ (many) profiles (many) ←→ (1) networks
    ↓                    ↓                     ↓
    └─ direct_messages   ├─ messages          ├─ network_events
                        ├─ portfolio_items   ├─ network_news  
                        ├─ wiki_pages        ├─ network_polls
                        ├─ moodboards        ├─ network_files
                        ├─ badges            ├─ wiki_pages
                        └─ engagement_stats  └─ social_wall_comments
```

### Foreign Key Constraints Summary

- **profiles.user_id** → auth.users.id (CASCADE DELETE)
- **profiles.network_id** → networks.id (CASCADE DELETE) 
- **All content tables** → profiles.id (for creators/authors)
- **Network-scoped tables** → networks.id (for network data)
- **Messaging tables** → profiles.id (for senders/participants)

## Migration History

### Major Migrations

1. **Big Multi-Profile Migration** (`20250606100000_big_multiprofile_migration.sql`)
   - Transformed 1:1:1 to 1:many:many User:Profile:Network relationship
   - Regenerated all profile UUIDs
   - Updated 20+ tables with new foreign key references
   - Fixed 25+ RLS policies for multi-profile support

2. **Network ID Immutability** (`20250612000000_make_network_id_immutable.sql`)
   - Made network_id NOT NULL and immutable
   - Added trigger to prevent network_id changes
   - Enforced CASCADE DELETE on network deletion

3. **Feature Expansions**
   - Media support across all content types
   - Advanced wiki system with revisions
   - Comprehensive engagement tracking
   - Support ticket system
   - Monetization features

### Data Integrity Verification

Migration includes comprehensive verification:
- Foreign key integrity checks
- Unique constraint validation  
- RLS policy testing
- Data migration completeness
- System function validation

## Environment Configuration

### Supabase Connection

- **URL**: `https://etoxvocwsktguoddmgcu.supabase.co`
- **Environment**: Production/Development
- **Authentication**: Row Level Security enabled
- **Real-time**: Enabled for messaging and notifications

### External Integrations

- **Stripe**: Payment processing and subscriptions
- **Storage**: Supabase Storage for media files
- **Email**: Queue-based notification system
- **Analytics**: Event tracking and engagement metrics

---

*This documentation was generated from database migrations, schema analysis, and code inspection. For the most current schema state, refer to the latest migration files in `/supabase/migrations/`.*