# Supabase Migrations

This directory contains SQL migrations for the Supabase database.

## Running Migrations

To apply a migration to your Supabase project, you have several options:

### Option 1: Using the Supabase CLI

1. Make sure you have the Supabase CLI installed:
   ```bash
   npm install -g supabase
   ```

2. Login to your Supabase account:
   ```bash
   supabase login
   ```

3. Link your project (if not already linked):
   ```bash
   supabase link --project-ref your-project-ref
   ```

4. Run the migration:
   ```bash
   supabase db push
   ```

### Option 2: Using the Supabase SQL Editor

1. Open the Supabase dashboard and navigate to your project
2. Go to the SQL Editor
3. Copy the content of the migration file
4. Paste it into the SQL Editor
5. Run the SQL

## Migration History

### Recent Migrations (In Order)

1. **Network Polls** - `20250124123000_add_network_polls.sql`
   - Adds polling system with multiple question types
   - Creates `network_polls` and `network_poll_votes` tables
   - Supports multiple choice, yes/no, and date picker polls

2. **Invitation Links** - `20250125000000_add_network_invitation_links.sql`
   - Adds shareable invitation links with QR codes
   - Creates `network_invitation_links` table
   - Tracks usage and expiration of links

3. **Rename Default Tabs** - `20250125000001_rename_default_tabs_to_enabled_tabs.sql`
   - Renames `default_tabs` to `enabled_tabs` in networks table
   - Better reflects the column's purpose

4. **Engagement Badges** - `20250127000000_add_engagement_badges.sql`
   - Creates badge system for user achievements
   - Adds `network_badges` and `user_badges` tables
   - Supports automatic and manual badge awarding

5. **News Images** - `20250514182907_add_news_images.sql`
   - Adds image support to network news posts
   - Adds `image_url` and `image_caption` columns

6. **Moderation Support** - `20250516120000_add_moderation_support.sql`
   - Adds comprehensive content moderation system
   - Updates profiles and content tables with moderation fields
   - Creates moderation logs

7. **Network Configuration** - `20250517000000_add_network_configuration.sql`
   - Adds network customization options
   - Privacy levels, purposes, and feature toggles

8. **Email Notifications** - `20250524120000_add_email_notification_preferences.sql`
   - Adds user notification preferences
   - Creates notification queue system

9. **Fix Notification Queue RLS** - `20250524121000_fix_notification_queue_rls.sql`
   - Fixes row-level security for notification queue

10. **Monetization Support** - `20250525000000_add_monetization_support.sql`
    - Adds subscription and billing fields
    - Stripe integration support

11. **Media Support** - `20250526000000_add_media_support.sql`
    - Comprehensive media handling across all content types
    - Adds `media_urls` and `media_types` arrays
    - Creates `media_uploads` table

12. **Moodboard Metadata** - `20250526000002_add_moodboard_metadata.sql`
    - Adds metadata fields to moodboards
    - Network association and privacy settings

13. **Performance Indexes** - `20250526120000_add_performance_indexes.sql`
    - Adds database indexes for common queries
    - Improves query performance significantly

14. **PDF Media Support** - `20250527000000_add_pdf_media_support.sql`
    - Adds PDF support across the platform
    - Updates media type constraints

15. **Social Wall Comments** - `20250528000000_add_social_wall_comments.sql`
    - Creates comment system for social wall
    - Supports threaded comments with replies
    - Creates `social_wall_comments` table

16. **Chat Replies** - `20250528000001_add_chat_replies.sql`
    - Adds reply functionality to chat messages
    - Adds `parent_message_id`, `reply_to_user_id`, and `reply_to_content` fields

## Migration Best Practices

1. **Always backup your database** before running migrations
2. **Test migrations** on a development database first
3. **Run migrations in order** - they may depend on previous changes
4. **Check for errors** in the SQL output after running
5. **Verify the changes** in your database after migration

## After Migration

Once you've run the migrations, the application will automatically use the new database features. Some migrations may require:
- Clearing browser cache
- Restarting the application
- Re-authenticating users (for permission changes)