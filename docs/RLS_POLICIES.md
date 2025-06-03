# Row-Level Security (RLS) Policies

This document describes the Row-Level Security policies implemented in the Conclav application.

## Tables with RLS Enabled

The following tables have Row-Level Security (RLS) enabled:

- direct_conversations
- direct_messages
- event_participations
- messages
- moodboard_items
- moodboards
- network_files
- opengraph_cache
- wiki_pages
- moderation_logs
- notification_queue
- social_wall_comments
- network_badges
- user_badges
- network_invitation_links
- media_uploads
- support_tickets
- ticket_messages

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

- Only system can insert into notification queue
- Network admins can view notifications for their network users

### Social Wall Comments

- Users can view comments on public items or items in their network
- Users can create comments on items in their network
- Users can update/delete their own comments
- Network admins can moderate all comments in their network

### Media Uploads

- Users can view their own uploads
- Users can view uploads in their network
- Users can create uploads
- Users can delete their own uploads

### Network Badges & User Badges

**network_badges**
- Network members can view badges in their network
- Network admins can manage badge definitions

**user_badges**
- Network admins can award badges to users
- Users can view their own badges
- Network members can view badges of users in their network

### Support Tickets

**support_tickets**
- Network admins can view and create tickets for their network
- Network admins can update their own tickets
- Super admins can view and update all tickets
- Only super admins can access ticket statistics

**ticket_messages**
- Users can view messages for tickets they have access to
- Users can send messages to tickets they have access to
- Super admins can create internal notes
- Network admins cannot see internal notes

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