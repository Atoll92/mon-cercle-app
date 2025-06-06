# Database Schema

This document describes the complete database schema for the Conclav application.

## Auth Tables (Supabase Default)

```sql
auth.users
- id (uuid, PK)
- email (varchar)
- created_at (timestamp)
- updated_at (timestamp)
- [other Supabase auth fields]
```

## Application Tables

### User & Profile Management

```sql
profiles (MULTIPLE PROFILES SYSTEM - Users can have one profile per network)
- id (uuid, PK, generated UUID) - Profile-specific ID
- user_id (uuid, NOT NULL, FK to auth.users.id) - References the authenticated user
- network_id (uuid, FK to networks.id) - Which network this profile belongs to
- UNIQUE CONSTRAINT (user_id, network_id) - One profile per user per network
- full_name (text)
- contact_email (text)
- bio (text)
- role (text, NOT NULL, default 'member') - 'admin' or 'member'
- profile_picture_url (text)
- portfolio_url (text)
- linkedin_url (text)
- skills (text[])
- is_suspended (boolean, default false)
- suspension_reason (text)
- suspension_end_date (timestamp with time zone)
- restriction_level (text)
- restriction_reason (text)
- last_active (timestamp with time zone)
- email_notifications_enabled (boolean, default true)
- notify_on_news (boolean, default true)
- notify_on_events (boolean, default true)
- notify_on_mentions (boolean, default true)
- notify_on_direct_messages (boolean, default true)
- badge_count (integer, default 0)
- portfolio_data (jsonb) - Legacy field
- created_at (timestamp with time zone, NOT NULL, default now()) - When the profile was created
- updated_at (timestamp with time zone)

portfolio_items
- id (uuid, PK)
- profile_id (uuid, FK to profiles.id)
- title (varchar)
- description (text)
- url (varchar)
- image_url (varchar)
- file_type (text)
- media_url (text) - Single media file URL
- media_type (text) - Media type: 'image', 'video', 'audio', or 'pdf'
- media_metadata (jsonb) - Metadata for media files
- category_id (uuid, FK to network_categories.id)
- created_at (timestamp)
```

### Network Management

```sql
networks
- id (uuid, PK)
- name (text, NOT NULL)
- description (text)
- logo_url (text)
- background_image_url (text)
- privacy_level (text, default 'private') - 'public', 'private', 'invite-only'
- purpose (text, default 'general') - 'community', 'professional', 'educational', 'hobby', 'general', 'other'
- theme_color (text, default '#1976d2')
- theme_bg_color (character varying, default '#ffffff')
- features_config (jsonb, default feature config) - Feature toggles
- enabled_tabs (jsonb, default tabs config) - Enabled navigation tabs configuration
- subscription_status (text, default 'free')
- subscription_plan (text, default 'community')
- subscription_start_date (timestamp with time zone)
- subscription_end_date (timestamp with time zone)
- subscription_updated_at (timestamp with time zone)
- stripe_customer_id (text)
- stripe_subscription_id (text)
- stripe_account_id (text)
- last_invoice_id (text)
- last_payment_date (timestamp with time zone)
- trial_start_date (timestamp with time zone)
- trial_end_date (timestamp with time zone)
- is_trial (boolean, default false)
- trial_days_used (integer, default 0)
- created_by (text)
- created_at (timestamp with time zone, default now())
- updated_at (timestamp with time zone)

invitations
- id (uuid, PK)
- email (text, NOT NULL)
- network_id (uuid, FK to networks.id, NOT NULL)
- invited_by (uuid, FK to auth.users.id, NOT NULL)
- status (text, NOT NULL, default 'pending') - 'pending', 'accepted', 'declined'
- role (text, NOT NULL, default 'member') - 'admin' or 'member'
- expires_at (timestamp with time zone)
- created_at (timestamp with time zone, default now())
- updated_at (timestamp with time zone, default now())

network_invitation_links
- id (uuid, PK)
- network_id (uuid, FK to networks.id, NOT NULL)
- code (character varying, NOT NULL)
- created_by (uuid, FK to profiles.id, NOT NULL)
- name (character varying)
- description (text)
- role (character varying, default 'member') - 'admin' or 'member'
- max_uses (integer, nullable)
- uses_count (integer, default 0)
- expires_at (timestamp with time zone, nullable)
- is_active (boolean, default true)
- created_at (timestamp with time zone, default now())
- updated_at (timestamp with time zone, default now())
```

### Events & Participation

```sql
network_events
- id (uuid, PK)
- network_id (uuid, FK to networks.id, NOT NULL)
- title (text, NOT NULL)
- description (text)
- date (timestamp with time zone, NOT NULL)
- location (text, NOT NULL)
- coordinates (jsonb) - {latitude, longitude}
- cover_image_url (text)
- capacity (integer)
- max_tickets (integer)
- tickets_sold (integer, default 0)
- price (numeric, default 0)
- currency (text, default 'EUR')
- event_link (text)
- created_by (uuid, FK to profiles.id, NOT NULL)
- created_at (timestamp with time zone, default now())
- updated_at (timestamp with time zone)

event_participations
- id (uuid, PK)
- event_id (uuid, FK to network_events.id, NOT NULL)
- profile_id (uuid, FK to profiles.id, NOT NULL)
- status (character varying, NOT NULL) - 'attending', 'maybe', 'declined'
- payment_status (text, default 'free') - 'free', 'paid', 'pending'
- payment_amount (numeric)
- payment_date (timestamp with time zone)
- stripe_payment_id (text)
- created_at (timestamp with time zone, default now())
- updated_at (timestamp with time zone, default now())
```

### Content & News

```sql
network_news
- id (uuid, PK)
- network_id (uuid, FK to networks.id)
- title (text)
- content (text)
- created_by (uuid, FK to profiles.id)
- image_url (text)
- image_caption (text)
- media_url (text) - Single media file URL
- media_type (text) - Media type: 'image', 'video', 'audio', or 'pdf'
- media_metadata (jsonb, default '{}') - Metadata for media files
- category_id (uuid, FK to network_categories.id)
- is_hidden (boolean, default false)
- is_flagged (boolean, default false)
- flag_reason (text)
- created_at (timestamp with time zone, default now())
- updated_at (timestamp with time zone)
```

### File Management

```sql
network_files
- id (uuid, PK)
- network_id (uuid, FK to networks.id, NOT NULL)
- uploaded_by (uuid, FK to profiles.id, NOT NULL)
- filename (text, NOT NULL)
- filepath (text, NOT NULL)
- file_url (text, NOT NULL)
- file_size (bigint, NOT NULL)
- file_type (text)
- description (text)
- download_count (integer, default 0)
- created_at (timestamp with time zone, default now())
- updated_at (timestamp with time zone, default now())

media_uploads
- id (uuid, PK)
- uploaded_by (uuid, FK to profiles.id)
- network_id (uuid, FK to networks.id, nullable)
- url (text, NOT NULL)
- file_name (text)
- media_type (text, NOT NULL)
- mime_type (text)
- file_size (bigint)
- dimensions (jsonb)
- duration (double precision)
- metadata (jsonb, default '{}') - Dimensions, duration, thumbnails, etc.
- created_at (timestamp with time zone, default now())
```

### Messaging & Communication

```sql
direct_conversations
- id (uuid, PK)
- participants (uuid[], NOT NULL) - Array of user IDs (profiles.id)
- created_at (timestamp with time zone, default now())
- updated_at (timestamp with time zone, default now())
- last_message_at (timestamp with time zone, default now())

direct_messages
- id (uuid, PK)
- conversation_id (uuid, FK to direct_conversations.id, NOT NULL)
- sender_id (uuid, FK to profiles.id, NOT NULL)
- recipient_id (uuid, FK to auth.users.id)
- content (text, NOT NULL)
- media_url (text) - Single media file URL
- media_type (text) - Media type
- media_metadata (jsonb, default '{}') - Media metadata
- read_at (timestamp with time zone)
- created_at (timestamp with time zone, default now())
- updated_at (timestamp with time zone)

messages
- id (uuid, PK)
- network_id (uuid, FK to networks.id, NOT NULL)
- user_id (uuid, FK to profiles.id, NOT NULL)
- content (text, NOT NULL)
- is_hidden (boolean, default false)
- is_flagged (boolean, default false)
- flag_reason (text)
- parent_message_id (uuid, FK to messages.id, nullable) - For reply threads
- reply_to_user_id (uuid, FK to profiles.id, nullable) - User being replied to
- reply_to_content (text, nullable) - Preview of replied message
- media_url (text) - Single media file URL
- media_type (text) - Media type
- media_metadata (jsonb, default '{}') - Media metadata
- created_at (timestamp with time zone, NOT NULL, default now())
```

### Moodboards

```sql
moodboards
- id (uuid, PK)
- network_id (uuid, FK to networks.id)
- title (text)
- description (text)
- permissions (text) - 'personal', 'private', 'collaborative', 'public'
- background_color (text)
- created_by (uuid, FK to profiles.id)
- is_personal (boolean)
- created_at (timestamp)
- updated_at (timestamp)

moodboard_items
- id (uuid, PK)
- moodboard_id (uuid, FK to moodboards.id)
- type (text) - 'image', 'text', 'video', 'link'
- content (text)
- title (text, nullable)
- x (double precision)
- y (double precision)
- width (double precision)
- height (double precision)
- rotation (double precision, default 0)
- zIndex (integer, default 0)
- textColor (text, nullable)
- backgroundColor (text, nullable)
- font_family (text, nullable)
- font_size (text, nullable)
- font_weight (text, nullable)
- text_align (text, nullable)
- line_height (text, nullable)
- opacity (double precision, default 1)
- border_radius (double precision, default 0)
- metadata (jsonb, default '{}')
- created_by (uuid, FK to profiles.id)
- created_at (timestamp)
- updated_at (timestamp)
```

### Wiki System

```sql
wiki_pages
- id (uuid, PK)
- network_id (uuid, FK to networks.id, NOT NULL)
- title (character varying, NOT NULL)
- content (text)
- slug (character varying, NOT NULL)
- is_published (boolean, default false)
- views_count (integer, default 0)
- created_by (uuid, FK to profiles.id)
- last_edited_by (uuid, FK to profiles.id)
- created_at (timestamp with time zone, default now())
- updated_at (timestamp with time zone, default now())

wiki_categories
- id (uuid, PK)
- network_id (uuid, FK to networks.id, NOT NULL)
- name (character varying, NOT NULL)
- slug (character varying, NOT NULL)
- description (text)
- created_by (uuid, FK to auth.users.id)
- created_at (timestamp with time zone, default now())

network_categories
- id (uuid, PK)
- network_id (uuid, FK to networks.id)
- name (varchar(100))
- slug (varchar(100))
- description (text, nullable)
- color (varchar(7), nullable)
- sort_order (integer, default 0)
- is_active (boolean, default true)
- created_by (uuid, FK to profiles.id, nullable)
- created_at (timestamp)
- updated_at (timestamp)

wiki_comments
- id (uuid, PK)
- page_id (uuid, FK to wiki_pages.id, NOT NULL)
- profile_id (uuid, FK to profiles.id, NOT NULL)
- content (text, NOT NULL)
- is_hidden (boolean, default false)
- hidden_at (timestamp with time zone)
- hidden_by (uuid, FK to profiles.id)
- created_at (timestamp with time zone, default now())

wiki_revisions
- id (uuid, PK)
- page_id (uuid, FK to wiki_pages.id, NOT NULL)
- content (text, NOT NULL)
- revision_number (integer, NOT NULL)
- comment (character varying)
- created_by (uuid, FK to profiles.id, NOT NULL)
- is_approved (boolean, default false)
- approved_by (uuid, FK to profiles.id)
- approved_at (timestamp with time zone)
- created_at (timestamp with time zone, default now())
```

### Polls

```sql
network_polls
- id (uuid, PK)
- network_id (uuid, FK to networks.id, NOT NULL)
- created_by (uuid, FK to profiles.id, NOT NULL)
- title (character varying, NOT NULL)
- description (text, nullable)
- poll_type (character varying, NOT NULL) - 'multiple_choice', 'yes_no', 'date_picker'
- options (jsonb) - Array of poll options
- allow_multiple_votes (boolean, default false)
- is_anonymous (boolean, default true)
- status (character varying, default 'active')
- starts_at (timestamp with time zone, default now())
- ends_at (timestamp with time zone, nullable)
- created_at (timestamp with time zone, default now())
- updated_at (timestamp with time zone, default now())

network_poll_votes
- id (uuid, PK)
- poll_id (uuid, FK to network_polls.id)
- user_id (uuid, FK to profiles.id)
- selected_options (jsonb) - Array of selected option indices
- created_at (timestamp)
```

### Moderation & Administration

```sql
moderation_logs
- id (uuid, PK)
- network_id (uuid, FK to networks.id, NOT NULL)
- moderator_id (uuid, FK to profiles.id, NOT NULL)
- target_id (uuid, NOT NULL) - References target user/content ID
- target_type (text, NOT NULL) - 'message', 'news', 'profile', 'user'
- action (text, NOT NULL) - 'hide', 'flag', 'suspend', 'restrict', 'unsuspend', 'unrestrict'
- reason (text)
- created_at (timestamp with time zone, default now())

notification_queue
- id (uuid, PK)
- recipient_id (uuid, FK to profiles.id)
- network_id (uuid, FK to networks.id)
- notification_type (varchar(50)) - 'news', 'event', 'mention', 'direct_message'
- subject_line (varchar(255))
- content_preview (text, nullable)
- related_item_id (uuid, nullable)
- is_sent (boolean, default false)
- created_at (timestamp)
- sent_at (timestamp, nullable)
- error_message (text, nullable)
```

### Social Features

```sql
social_wall_comments
- id (uuid, PK)
- item_id (uuid, NOT NULL) - References news or portfolio item
- item_type (character varying, NOT NULL) - 'news' or 'post'
- profile_id (uuid, FK to profiles.id, NOT NULL)
- content (text, NOT NULL)
- parent_comment_id (uuid, FK to social_wall_comments.id, nullable)
- is_hidden (boolean, default false)
- created_at (timestamp with time zone, default now())
- updated_at (timestamp with time zone, default now())
```

### Badges & Engagement

```sql
badges
- id (uuid, PK)
- network_id (uuid, FK to networks.id, nullable)
- name (character varying, NOT NULL)
- description (text, nullable)
- icon (character varying, NOT NULL)
- color (character varying, default 'primary')
- criteria_type (character varying, NOT NULL)
- criteria_value (integer, default 0)
- is_active (boolean, default true)
- created_by (uuid, FK to profiles.id, nullable)
- achieved_at (timestamp with time zone, default now())
- created_at (timestamp with time zone, NOT NULL, default now())
- updated_at (timestamp with time zone, NOT NULL, default now())

user_badges
- id (uuid, PK)
- user_id (uuid, FK to profiles.id)
- badge_id (uuid, FK to badges.id)
- awarded_by (uuid, FK to profiles.id, nullable)
- awarded_at (timestamp with time zone, NOT NULL, default now())
- reason (text, nullable)

engagement_stats
- id (uuid, PK)
- user_id (uuid, FK to profiles.id)
- network_id (uuid, FK to networks.id)
- posts_count (integer, default 0)
- events_attended (integer, default 0)
- messages_sent (integer, default 0)
- wiki_contributions (integer, default 0)
- polls_participated (integer, default 0)
- files_shared (integer, default 0)
- last_active (timestamp with time zone, NOT NULL, default now())
- member_since (timestamp with time zone, NOT NULL, default now())
- updated_at (timestamp with time zone, NOT NULL, default now())
```

### Support System

```sql
support_tickets
- id (uuid, PK)
- network_id (uuid, FK to networks.id, nullable) - Null for system tickets
- submitted_by (uuid, FK to profiles.id, nullable) - Null for system tickets
- assigned_to (uuid, FK to profiles.id, nullable)
- title (character varying, NOT NULL)
- description (text, NOT NULL)
- category (character varying) - 'technical', 'billing', 'feature', 'bug', 'other'
- priority (character varying, default 'medium') - 'low', 'medium', 'high', 'urgent'
- status (character varying, default 'open') - 'open', 'in_progress', 'waiting_response', 'resolved', 'closed'
- created_at (timestamp with time zone, default now())
- updated_at (timestamp with time zone, default now())
- resolved_at (timestamp with time zone, nullable)

ticket_messages
- id (uuid, PK)
- ticket_id (uuid, FK to support_tickets.id)
- sender_id (uuid, FK to profiles.id, nullable) - Null for system messages
- message (text, NOT NULL)
- is_internal (boolean, default false) - For internal notes between super admins
- created_at (timestamp with time zone, default now())
```

### Monetization & Donations

```sql
donations
- id (uuid, PK)
- network_id (uuid, FK to networks.id)
- donor_id (uuid, FK to profiles.id)
- amount (numeric, NOT NULL)
- currency (text, default 'EUR')
- message (text, nullable)
- is_anonymous (boolean, default false)
- stripe_payment_id (text)
- created_at (timestamp with time zone, default now())

membership_plans
- id (uuid, PK)
- network_id (uuid, FK to networks.id)
- name (text, NOT NULL)
- description (text, nullable)
- price (numeric, NOT NULL, default 0)
- currency (text, default 'EUR')
- interval (text, NOT NULL, default 'month') - 'month', 'year', etc.
- features (jsonb, default '[]')
- stripe_price_id (text)
- is_active (boolean, default true)
- created_at (timestamp with time zone, default now())
- updated_at (timestamp with time zone, default now())

member_subscriptions
- id (uuid, PK)
- network_id (uuid, FK to networks.id)
- profile_id (uuid, FK to profiles.id)
- plan_id (uuid, FK to membership_plans.id)
- status (text, NOT NULL, default 'active') - 'active', 'canceled', 'past_due', etc.
- stripe_subscription_id (text)
- current_period_start (timestamp with time zone)
- current_period_end (timestamp with time zone)
- created_at (timestamp with time zone, default now())
- updated_at (timestamp with time zone, default now())
```

### Wiki Advanced Features

```sql
wiki_page_categories
- page_id (uuid, FK to wiki_pages.id)
- category_id (uuid, FK to wiki_categories.id)

wiki_page_permissions
- id (uuid, PK)
- page_id (uuid, FK to wiki_pages.id)
- profile_id (uuid, FK to profiles.id, nullable)
- role (varchar) - 'editor', 'viewer', etc.
- created_by (uuid, FK to profiles.id)
- created_at (timestamp)
```

### Cache & Optimization

```sql
opengraph_cache
- id (uuid, PK)
- url (text, NOT NULL)
- data (jsonb, NOT NULL) - Complete OpenGraph data
- created_at (timestamp with time zone, default now())
- updated_at (timestamp with time zone, default now())
```