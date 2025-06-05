# Row-Level Security (RLS) Policies

This document describes the Row-Level Security policies implemented in the Conclav application.

## Tables with RLS Enabled

The following tables have Row-Level Security (RLS) enabled:

- badges
- direct_conversations
- direct_messages
- donations
- engagement_stats
- event_participations
- media_uploads
- member_subscriptions
- membership_plans
- messages
- moderation_logs
- moodboard_items
- moodboards
- network_categories
- network_files
- network_invitation_links
- network_poll_votes
- network_polls
- notification_queue
- opengraph_cache
- social_wall_comments
- support_tickets
- ticket_messages
- user_badges
- wiki_pages

## Key RLS Policies by Feature

### Direct Messages

**direct_conversations**
- Users can only view conversations they're part of
- Users can only create conversations where they're a participant

**direct_messages**
- Users can only view messages from conversations they're part of
- Users can only send messages to conversations they're part of
- Participants in a conversation can update the read_at status

### Network Files

- Users can view files in their network
- Users can upload files to their network
- Users can update and delete their own files
- Network admins can manage all files in their network

### Wiki Pages

- Anyone can view published wiki pages
- Network admins can view all wiki pages, including unpublished ones
- Network members can insert wiki pages
- Network admins can update any wiki page
- Page creators can update their own unpublished pages

### Moodboards

- Users can view public moodboards
- Users can view personal moodboards they created
- Users can view collaborative moodboards in their network
- Network admins can view all moodboards
- Users can create moodboards in their network
- Users can update their own moodboards
- Users can delete their own moodboards

### Event Participations

- Participations are viewable by everyone
- Users can manage their own participations
- Network admins can view all participations in their network

### Moderation Logs

- Network admins can view moderation logs for their network
- Network admins can create moderation logs

### Notification Queue

- Authenticated users can insert notifications
- Users can view notifications relevant to them (recipient or network member)
- Network admins can view all notifications for their network
- Users can delete their own notifications
- System operations have full access for queue management

### Social Wall Comments

- Users can view non-hidden comments, or all comments if they're network admins
- Users can create comments on items in their network (news or portfolio posts)
- Users can update and delete their own comments
- Network admins can hide/unhide comments and view hidden comments
- Comment visibility is determined by network membership and admin status

### Network Polls & Poll Votes

**network_polls**
- Network members can view polls in their network
- Network admins can create, update, and delete polls
- Poll creators can manage their own polls

**network_poll_votes**
- Network members can vote on active polls within the voting period
- Users can view and update their own votes while polls are active
- Users can delete their votes while polls are active
- Network admins can view all votes for polls in their network

### Network Categories

- Network members can view categories in their network
- Network admins can create, update, and delete categories
- Categories are scoped by network membership

### Donations

- Donors can view their own donation history
- Network admins can view all donations to their network
- Users can create donations to networks
- Donation privacy is respected through is_anonymous flag

### Membership Plans & Subscriptions

**membership_plans**
- Network members can view available plans for their network
- Network admins can manage all aspects of membership plans

**member_subscriptions**
- Users can view and manage their own subscriptions
- Network admins can view all subscriptions in their network
- Subscription privacy is maintained per user

### Engagement Stats

- Users can view their own engagement statistics
- Network admins can view engagement stats for all members in their network
- System has full access for updating engagement tracking
- Stats are automatically maintained through triggers

### Media Uploads

- Users can view their own uploads
- Network members can view uploads in their network
- Users can upload media to networks they belong to
- Users can delete their own uploads
- Media uploads are scoped by network membership

### Badges & User Badges

**badges**
- Network members can view active badges in their network
- Network creators and admins can manage badge definitions
- Only active badges are visible to members

**user_badges**
- Anyone can view user badges (public visibility)
- Network creators and admins can manage user badge assignments
- Badge awards are publicly visible for recognition purposes

### Support Tickets

**support_tickets**
- Network admins can create, view and update tickets for their network
- Super admins can view and update all tickets (including system tickets)
- System can create tickets without authentication (for error reporting)
- Network admins can only access tickets within their network scope

**ticket_messages**
- Users can view messages for tickets they have access to (network admins or super admins)
- Users can send messages to tickets they have access to
- Super admins can create internal notes (is_internal flag)
- Network admins cannot see internal messages

## Policy Implementation Patterns

### Common Patterns

1. **Network Membership Check**
   ```sql
   EXISTS (
     SELECT 1 FROM profiles
     WHERE profiles.id = auth.uid()
     AND profiles.network_id = [table].network_id
   )
   ```

2. **Admin Role Check**
   ```sql
   EXISTS (
     SELECT 1 FROM profiles
     WHERE profiles.id = auth.uid()
     AND profiles.network_id = [table].network_id
     AND profiles.role = 'admin'
   )
   ```

3. **Owner Check**
   ```sql
   auth.uid() = [table].user_id
   ```

4. **Public Content Check**
   ```sql
   [table].is_public = true
   OR EXISTS (network membership check)
   ```

### Security Considerations

1. **Cascading Permissions**: Some policies depend on other tables (e.g., checking network membership via profiles table)
2. **Performance**: Complex policies may impact query performance; indexes are crucial
3. **Default Deny**: All tables start with no access; policies explicitly grant permissions
4. **Audit Trail**: Moderation logs track all administrative actions for accountability