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
profiles
- id (uuid, PK, references auth.users.id)
- network_id (uuid, FK to networks.id)
- full_name (varchar)
- contact_email (varchar)
- bio (text)
- role (varchar) - 'admin' or 'member'
- profile_picture_url (varchar)
- portfolio_url (varchar)
- linkedin_url (varchar)
- skills (text[])
- is_suspended (boolean)
- suspension_reason (text)
- suspension_end_date (timestamp)
- restriction_level (varchar)
- restriction_reason (text)
- last_active (timestamp)
- email_notifications_enabled (boolean)
- notify_on_news (boolean)
- notify_on_events (boolean)
- notify_on_mentions (boolean)
- notify_on_direct_messages (boolean)
- badge_count (integer)
- portfolio_data (jsonb) - Legacy field
- created_at (timestamp) - When the profile was created
- updated_at (timestamp)

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
- name (varchar)
- description (text)
- logo_url (varchar)
- background_image_url (varchar)
- privacy_level (varchar) - 'public', 'private', 'invite-only'
- purpose (varchar) - 'community', 'professional', 'educational', 'hobby', 'other'
- theme_color (varchar)
- features_config (jsonb) - Feature toggles
- enabled_tabs (jsonb) - Enabled navigation tabs configuration
- subscription_status (varchar)
- subscription_plan (varchar)
- subscription_end_date (timestamp)
- stripe_customer_id (varchar)
- stripe_subscription_id (varchar)
- trial_start_date (timestamp)
- trial_end_date (timestamp)
- is_trial (boolean)
- trial_days_used (integer)
- created_at (timestamp)
- updated_at (timestamp)

invitations
- id (uuid, PK)
- email (varchar)
- network_id (uuid, FK to networks.id)
- invited_by (uuid, FK to profiles.id)
- status (varchar) - 'pending', 'accepted', 'declined'
- role (varchar) - 'admin' or 'member'
- created_at (timestamp)

network_invitation_links
- id (uuid, PK)
- network_id (uuid, FK to networks.id)
- code (varchar, unique)
- created_by (uuid, FK to profiles.id)
- name (varchar)
- role (varchar) - 'admin' or 'member'
- max_uses (integer, nullable)
- uses_count (integer, default 0)
- expires_at (timestamp, nullable)
- is_active (boolean, default true)
- created_at (timestamp)
- updated_at (timestamp)
```

### Events & Participation

```sql
network_events
- id (uuid, PK)
- network_id (uuid, FK to networks.id)
- title (varchar)
- description (text)
- date (timestamp)
- location (varchar)
- coordinates (json) - {latitude, longitude}
- cover_image_url (varchar)
- capacity (integer)
- event_link (varchar)
- created_by (uuid, FK to profiles.id)
- created_at (timestamp)
- updated_at (timestamp)

event_participations
- id (uuid, PK)
- event_id (uuid, FK to network_events.id)
- profile_id (uuid, FK to profiles.id)
- status (varchar) - 'attending', 'maybe', 'declined'
- created_at (timestamp)
- updated_at (timestamp)
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
- media_metadata (jsonb) - Metadata for media files
- category_id (uuid, FK to network_categories.id)
- is_hidden (boolean)
- is_flagged (boolean)
- flag_reason (text)
- created_at (timestamp)
- updated_at (timestamp)
```

### File Management

```sql
network_files
- id (uuid, PK)
- network_id (uuid, FK to networks.id)
- uploaded_by (uuid, FK to profiles.id)
- filename (varchar)
- filepath (varchar)
- file_url (varchar)
- file_size (integer)
- file_type (varchar)
- description (text)
- download_count (integer)
- created_at (timestamp)
- updated_at (timestamp)

media_uploads
- id (uuid, PK)
- user_id (uuid, FK to profiles.id)
- network_id (uuid, FK to networks.id, nullable)
- file_path (varchar)
- file_url (varchar)
- file_type (varchar)
- file_size (bigint)
- metadata (jsonb) - Dimensions, duration, thumbnails, etc.
- created_at (timestamp)
```

### Messaging & Communication

```sql
direct_conversations
- id (uuid, PK)
- participants (uuid[]) - Array of user IDs (profiles.id)
- created_at (timestamp)
- updated_at (timestamp)
- last_message_at (timestamp)

direct_messages
- id (uuid, PK)
- conversation_id (uuid, FK to direct_conversations.id)
- sender_id (uuid, FK to profiles.id)
- content (text)
- media_urls (text[], nullable) - Array of media file URLs
- media_types (text[], nullable) - Array of media MIME types
- read_at (timestamp)
- created_at (timestamp)
- updated_at (timestamp)

messages
- id (uuid, PK)
- network_id (uuid, FK to networks.id)
- user_id (uuid, FK to profiles.id)
- content (text)
- is_hidden (boolean)
- is_flagged (boolean)
- flag_reason (text)
- parent_message_id (uuid, FK to messages.id, nullable) - For reply threads
- reply_to_user_id (uuid, FK to profiles.id, nullable) - User being replied to
- reply_to_content (text, nullable) - Preview of replied message
- media_urls (text[], nullable) - Array of media file URLs
- media_types (text[], nullable) - Array of media MIME types
- created_at (timestamp)
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
- network_id (uuid, FK to networks.id)
- title (varchar)
- content (text)
- slug (varchar)
- category (varchar)
- is_published (boolean)
- created_by (uuid, FK to profiles.id)
- created_at (timestamp)
- updated_at (timestamp)

wiki_categories
- id (uuid, PK)
- network_id (uuid, FK to networks.id)
- name (varchar)
- description (text)
- created_at (timestamp)

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
- wiki_page_id (uuid, FK to wiki_pages.id)
- user_id (uuid, FK to profiles.id)
- content (text)
- created_at (timestamp)
- updated_at (timestamp)

wiki_revisions
- id (uuid, PK)
- wiki_page_id (uuid, FK to wiki_pages.id)
- content (text)
- edited_by (uuid, FK to profiles.id)
- created_at (timestamp)
```

### Polls

```sql
network_polls
- id (uuid, PK)
- network_id (uuid, FK to networks.id)
- created_by (uuid, FK to profiles.id)
- question (text)
- description (text, nullable)
- poll_type (varchar) - 'multiple_choice', 'yes_no', 'date_picker'
- options (jsonb) - Array of poll options
- allow_multiple (boolean)
- is_anonymous (boolean)
- closes_at (timestamp, nullable)
- created_at (timestamp)
- updated_at (timestamp)

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
- network_id (uuid, FK to networks.id)
- moderator_id (uuid, FK to profiles.id)
- target_user_id (uuid, FK to profiles.id, nullable)
- target_content_id (uuid, nullable)
- target_content_type (varchar) - 'message', 'news', 'profile'
- action (varchar) - 'hide', 'flag', 'suspend', 'restrict', 'unsuspend', 'unrestrict'
- reason (text)
- created_at (timestamp)

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
- item_id (uuid) - References news or portfolio item
- item_type (varchar) - 'news' or 'portfolio'
- user_id (uuid, FK to profiles.id)
- content (text)
- parent_comment_id (uuid, FK to social_wall_comments.id, nullable)
- is_hidden (boolean)
- created_at (timestamp)
- updated_at (timestamp)
```

### Badges & Engagement

```sql
badges
- id (uuid, PK)
- network_id (uuid, FK to networks.id, nullable)
- name (varchar(255))
- description (text, nullable)
- icon (varchar(50))
- color (varchar(50), default 'primary')
- criteria_type (varchar(50))
- criteria_value (integer, default 0)
- is_active (boolean, default true)
- created_by (uuid, FK to profiles.id, nullable)
- created_at (timestamp)
- updated_at (timestamp)

user_badges
- id (uuid, PK)
- user_id (uuid, FK to profiles.id)
- badge_id (uuid, FK to badges.id)
- awarded_by (uuid, FK to profiles.id, nullable)
- awarded_at (timestamp)
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
- last_active (timestamp)
- member_since (timestamp)
- updated_at (timestamp)
```

### Support System

```sql
support_tickets
- id (uuid, PK)
- network_id (uuid, FK to networks.id)
- submitted_by (uuid, FK to profiles.id)
- assigned_to (uuid, FK to profiles.id, nullable)
- title (varchar)
- description (text)
- category (varchar) - 'technical', 'billing', 'feature', 'bug', 'other'
- priority (varchar) - 'low', 'medium', 'high', 'urgent'
- status (varchar) - 'open', 'in_progress', 'waiting_response', 'resolved', 'closed'
- created_at (timestamp)
- updated_at (timestamp)
- resolved_at (timestamp, nullable)

ticket_messages
- id (uuid, PK)
- ticket_id (uuid, FK to support_tickets.id)
- sender_id (uuid, FK to profiles.id)
- message (text)
- is_internal (boolean) - For internal notes between super admins
- created_at (timestamp)
```

### Cache & Optimization

```sql
opengraph_cache
- id (uuid, PK)
- url (varchar, unique)
- title (varchar)
- description (text)
- image_url (varchar)
- site_name (varchar)
- created_at (timestamp)
- updated_at (timestamp)
```