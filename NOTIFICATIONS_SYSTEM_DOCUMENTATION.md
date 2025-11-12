# Notification System Documentation

## Overview

The Mon Cercle application features a comprehensive email notification system that allows users to receive notifications about network activities while providing granular control over their preferences. This system is built with scalability, reliability, and user privacy in mind.

## Architecture

### Core Components

1. **Database Layer**
   - `profiles` table: Stores user notification preferences
   - `notification_queue` table: Manages notification queue with delivery tracking
   - RLS policies: Ensure secure access to notification data

2. **Service Layer**
   - `emailNotificationService.js`: Core notification logic and queue management
   - Edge Functions: Email delivery via Supabase (network-invite function)

3. **UI Components**
   - `NotificationSettings.jsx`: User preference management interface
   - `NotificationSystemManager.jsx`: Admin/testing interface for notifications
   - `EditProfilePage.jsx`: Integration of notification settings

4. **Integration Points**
   - News posting: [src/api/networks.jsx:1259](src/api/networks.jsx#L1259)
   - Portfolio posts: [src/api/posts.js:111](src/api/posts.js#L111)
   - Events: [src/api/networks.jsx:904](src/api/networks.jsx#L904)
   - Chat mentions: Chat components
   - Direct messages: [src/api/directMessages.js](src/api/directMessages.js)
   - Comments: [src/api/comments.js:81](src/api/comments.js#L81)
   - Event proposals/status: [src/api/networks.jsx](src/api/networks.jsx)

## Database Schema

### Notification Preferences (profiles table)
```sql
-- Notification preference columns in profiles table
email_notifications_enabled BOOLEAN DEFAULT true,  -- Master toggle
notify_on_news BOOLEAN DEFAULT true,              -- News notifications
notify_on_events BOOLEAN DEFAULT true,            -- Event notifications
notify_on_mentions BOOLEAN DEFAULT true,          -- Mention notifications
notify_on_direct_messages BOOLEAN DEFAULT true    -- DM notifications
```

### Notification Queue
```sql
CREATE TABLE notification_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    network_id UUID NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN (
        'news',
        'event',
        'mention',
        'direct_message',
        'post',
        'event_proposal',
        'event_status',
        'event_reminder',
        'comment',
        'comment_reply',
        'custom'
    )),
    subject_line VARCHAR(255) NOT NULL,
    content_preview TEXT,
    related_item_id UUID,
    metadata JSONB,  -- Stores additional data like sender names, event dates, ICS attachments
    is_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT
);
```

### RLS Security
- Users can only view notifications intended for their profiles
- Network admins can view all notifications within their network
- System-level operations for notification processing

## Multi-Profile Support

The notification system fully supports the multi-profile architecture:

- **Profile-Based Preferences**: Each profile has independent notification settings
- **Network-Scoped Notifications**: Notifications are sent to specific profile IDs within networks
- **Cross-Profile Management**: Users can manage notification preferences for each of their profiles

## Notification Types

The system supports **11 distinct notification types** with specific triggers, recipients, and content:

### 1. News Notifications (`news`)
- **Trigger**: When new posts are created in a network news feed
- **Recipients**: All network members (excluding author) with news notifications enabled
- **Content**: Post title, author name, content preview, media attachments
- **Subject**: `New post in ${network.name}: ${newsTitle}`
- **Queued by**: `queueNewsNotifications()` in [src/api/networks.jsx:1259](src/api/networks.jsx#L1259)

### 2. Portfolio Post Notifications (`post`)
- **Trigger**: When portfolio items are shared
- **Recipients**: Network members with news notifications enabled (uses same preference)
- **Content**: Post title, description, media attachments
- **Subject**: `New post shared in ${network.name}: ${postTitle}`
- **Queued by**: `queuePortfolioNotifications()` in [src/api/posts.js:111](src/api/posts.js#L111)

### 3. Event Notifications (`event`)
- **Trigger**: When new events are created or approved
- **Recipients**: Network members with event notifications enabled
- **Content**: Event title, description, date, location, optional ICS calendar attachment
- **Subject**: `New event in ${network.name}: ${eventTitle}`
- **Queued by**: `queueEventNotifications()` in [src/api/networks.jsx:904](src/api/networks.jsx#L904)
- **Special**: Includes ICS attachment for calendar import

### 4. Direct Message Notifications (`direct_message`)
- **Trigger**: When new direct messages are received
- **Recipients**: Message recipient only (if DM notifications enabled)
- **Content**: Sender name, message preview(s)
- **Subject**: `New message from ${senderName}`
- **Queued by**: `queueDirectMessageNotification()` in [src/api/directMessages.js](src/api/directMessages.js)
- **Special**: 5-minute batching to group multiple messages from same sender

### 5. Mention Notifications (`mention`)
- **Trigger**: When users are mentioned in network chat (@username)
- **Recipients**: Mentioned user only (if mention notifications enabled)
- **Content**: Mentioner name, message content, context
- **Subject**: `${mentionerName} mentioned you in ${network.name}`
- **Queued by**: `queueMentionNotification()` in chat components

### 6. Comment Notifications (`comment`)
- **Trigger**: Someone comments on user's content (news, posts, events, wiki)
- **Recipients**: Content creator (if news notifications enabled)
- **Content**: Commenter name, comment text, post context
- **Subject**: `${commenterName} commented on your ${itemType}`
- **Queued by**: `queueCommentNotification()` in [src/api/comments.js:81](src/api/comments.js#L81)

### 7. Comment Reply Notifications (`comment_reply`)
- **Trigger**: Someone replies to user's comment
- **Recipients**: Original commenter (if news notifications enabled)
- **Content**: Replier name, reply text, thread context
- **Subject**: `${commenterName} replied to your comment`
- **Queued by**: `queueCommentNotification()` in [src/api/comments.js:81](src/api/comments.js#L81)

### 8. Event Proposal Notifications (`event_proposal`)
- **Trigger**: Member proposes new event requiring approval
- **Recipients**: Network admins only
- **Content**: Proposer name, event details
- **Subject**: `Event proposal in ${network.name}: ${eventTitle}`
- **Queued by**: `queueEventProposalNotificationForAdmins()` in [src/services/emailNotificationService.js:691](src/services/emailNotificationService.js#L691)

### 9. Event Status Notifications (`event_status`)
- **Trigger**: Event proposal approved or rejected by admin
- **Recipients**: Event creator
- **Content**: Approval/rejection message, event details, optional rejection reason
- **Subject**: `Your event "${eventTitle}" has been ${approved/rejected}`
- **Queued by**: `queueEventStatusNotification()` in [src/services/emailNotificationService.js:792](src/services/emailNotificationService.js#L792)

### 10. Event Reminder Notifications (`event_reminder`)
- **Trigger**: 24 hours before event (CRON job)
- **Recipients**: Users registered for the event
- **Content**: Event title, date, location, RSVP confirmation
- **Subject**: `Reminder: Event tomorrow in ${network.name}`
- **Queued by**: CRON job in [supabase/migrations/20250125_add_event_reminder_cron.sql](supabase/migrations/20250125_add_event_reminder_cron.sql)

### 11. Custom Notifications (`custom`)
- **Trigger**: Admin sends custom notification
- **Recipients**: As specified by admin
- **Content**: Custom subject and message
- **Subject**: As specified
- **Queued by**: Admin interface

## Email Service Integration

### Supabase Edge Function
The system uses the `process-notifications` Edge Function for email delivery via Resend API:

**Location**: [supabase/functions/process-notifications/index.ts](supabase/functions/process-notifications/index.ts)

**How it works**:
1. CRON job triggers function periodically
2. Fetches pending notifications from queue (limit 50)
3. Groups notifications by recipient, network, and type for batching
4. Generates HTML emails using custom templates per notification type
5. Sends via Resend API
6. Marks notifications as sent or logs errors

**Email Templates**: Each notification type has a custom HTML template with:
- Type-specific color schemes (News: blue, Events: orange, DMs: green, etc.)
- Dynamic content from `subject_line` and `content_preview`
- Direct links to relevant content
- Preference management links

**Processing Flow**:
```typescript
// Triggered by CRON job or manual invocation
supabase.functions.invoke('process-notifications')
```

### Rate Limiting & Batching
- **Sequential processing**: 600ms delays between emails
- **Direct message batching**: 5-minute window to group messages from same sender
- **Retry logic**: Failed deliveries logged with error messages
- **Cleanup**: Old sent notifications (7+ days) automatically removed

## User Interface

### Notification Settings Component
Located in `NotificationSettings.jsx`:
- Master toggle for all email notifications
- Granular controls for each notification type
- Real-time preference updates
- Visual feedback for changes

### Notification System Manager
Located in `NotificationSystemManager.jsx`:
- Admin interface for notification management
- Test notification creation
- Manual queue processing
- Notification history and statistics
- Debug capabilities

## API Functions

### Core Service Functions
**Location**: [src/services/emailNotificationService.js](src/services/emailNotificationService.js)

#### `queueNewsNotifications(networkId, newsId, authorId, newsTitle, newsContent, mediaUrl, mediaType)`
Queues notification for all eligible network members when news is posted.
- Checks `email_notifications_enabled` AND `notify_on_news`
- Excludes author from recipients
- Line 14 in service file

#### `queuePortfolioNotifications(networkId, postId, authorId, postTitle, postDescription, mediaUrl, mediaType)`
Queues notification for network members when portfolio posts are shared.
- Uses `notify_on_news` preference (same as news)
- Line 487 in service file

#### `queueEventNotifications(networkId, eventId, authorId, eventTitle, eventDescription, eventDate, eventLocation, coverImageUrl)`
Queues notification for network members when events are created.
- Checks `email_notifications_enabled` AND `notify_on_events`
- Generates ICS calendar attachment
- Line 228 in service file

#### `queueMentionNotification(mentionedUserId, networkId, mentionerName, messageContent, messageId)`
Queues notification when a user is mentioned in chat.
- Checks `email_notifications_enabled` AND `notify_on_mentions`
- Line 151 in service file

#### `queueDirectMessageNotification(recipientId, senderId, messageContent, messageId)`
Queues notification when a direct message is sent.
- Checks `email_notifications_enabled` AND `notify_on_direct_messages`
- Prevents self-notifications
- Batched by Edge Function (5-minute window)
- Line 608 in service file

#### `queueCommentNotification(params)`
Queues notifications for comments and comment replies.
- Notifies post author for new comments
- Notifies parent comment author for replies
- Uses `notify_on_news` preference
- Line 362 in service file

#### `queueEventProposalNotificationForAdmins(networkId, eventId, proposerId, eventTitle, eventDescription, eventDate)`
Queues notification for network admins when events are proposed.
- Sends to admins only
- Line 691 in service file

#### `queueEventStatusNotification(eventId, eventCreatorId, eventTitle, status, rejectionReason, networkId)`
Queues notification when event is approved/rejected.
- Sends to event creator
- Line 792 in service file

#### `getNotificationStats(profileId)`
Returns notification statistics for a specific profile.
- Line 108 in service file

#### `getUserNotificationPreferences(profileId)`
Retrieves current notification preferences for a profile.
- Line 865 in service file

#### `cleanupOldNotifications()`
Removes old sent notifications (30+ days) to keep the queue manageable.
- Line 576 in service file

### Preference Management Functions
**Location**: [src/api/notificationPreferences.js](src/api/notificationPreferences.js)

#### `getNotificationPreferences(supabase, profileId)`
Fetches all notification preferences for a profile.

#### `updateNotificationPreferences(supabase, profileId, preferences)`
Updates multiple notification preferences at once.

#### `updateDigestFrequency(supabase, profileId, frequency)`
Updates notification digest frequency ('instant', 'hourly', 'daily', 'weekly').

#### `updateDigestPreferredTime(supabase, profileId, time)`
Updates preferred time for digest delivery.

#### `getDigestHistory(supabase, profileId, limit)`
Retrieves notification digest history.

## Testing & Debugging

### Testing Components
1. **TestNotificationSystem.jsx**: Development testing interface
2. **NotificationSystemManager.jsx**: Production-ready admin interface

### Test Capabilities
- Database column verification
- Queue accessibility testing
- Fake notification creation
- Manual queue processing
- RLS policy verification

### Debug Features
- Comprehensive logging with emoji prefixes
- Error tracking and retry mechanisms
- Queue statistics and monitoring
- Notification history tracking

## Security Considerations

### Row-Level Security (RLS)
```sql
-- Users can only view their own notifications
CREATE POLICY "Users can view relevant notifications" ON notification_queue
    FOR SELECT USING (
        recipient_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    );
```

### Data Protection
- Personal information is limited to recipient profiles
- Email addresses are only used for delivery
- Content previews are truncated for privacy

### Access Control
- System-level operations for queue processing
- User-level access for preference management
- Admin-level access for network monitoring

## Performance Optimization

### Queue Management
- Indexed columns for efficient querying
- Batch processing with configurable limits
- Automatic cleanup of old notifications

### Email Delivery
- Rate limiting to prevent spam
- Error handling and retry logic
- Delivery status tracking

### Database Efficiency
- Proper indexing on frequently queried columns
- Optimized RLS policies
- Minimal data storage per notification

## Configuration

### Environment Variables
```bash
# Required for email delivery
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key

# Email service configuration (in Edge Function)
RESEND_API_KEY=your-resend-api-key
```

### Default Settings
- All notification types enabled by default
- Master toggle enabled for new profiles
- Graceful fallbacks for missing preferences

## Integration Examples

### News Posting Integration
```javascript
// In networks.jsx - createNetworkNews function
const notificationResult = await queueNewsNotifications(
  networkId,
  data[0].id,  // news post ID
  profileId,   // author profile ID
  title,
  content
);
```

### Chat Mention Integration
```javascript
// In Chat.jsx - mention detection
const mentionResult = await queueMentionNotification(
  mentionedProfile.id,
  networkId,
  currentProfile.full_name,
  messageText,
  messageId
);
```

### Direct Message Integration
```javascript
// In DirectMessageChat.jsx - after successful message send
const notificationResult = await queueDirectMessageNotification(
  partner.id,           // recipient ID
  activeProfile.id,     // sender ID
  messageContent || '[Media message]',  // message content
  messageData.message.id        // message ID
);
```

## Monitoring & Analytics

### Notification Statistics
- Total notifications sent
- Pending notifications count
- Failed delivery tracking
- User engagement metrics

### Error Tracking
- Failed delivery logs
- Rate limit hit tracking
- Database error monitoring
- Edge function error tracking

## Future Enhancements

### Planned Features
1. **Push Notifications**: Browser/mobile push notification support
2. **Notification Scheduling**: Digest emails and scheduled delivery
3. **Advanced Preferences**: Time-based notification windows
4. **Notification Templates**: Customizable email templates per network
5. **Analytics Dashboard**: Advanced notification metrics and insights

### Scalability Considerations
1. **Queue Partitioning**: Separate queues by priority/type
2. **Background Processing**: Dedicated notification processing workers
3. **Caching Layer**: Redis caching for user preferences
4. **Email Provider Rotation**: Multiple email service providers

## Troubleshooting

### Common Issues

#### Notifications Not Being Sent
1. Check user notification preferences
2. Verify RLS policies allow queue access
3. Confirm Edge Function is operational
4. Review email service API limits

#### Queue Processing Failures
1. Check database connectivity
2. Verify Edge Function deployment
3. Review rate limiting configuration
4. Check email service API status

#### Missing Notifications
1. Verify notification queueing is triggered
2. Check recipient profile preferences
3. Review database constraints
4. Confirm email delivery status

### Debug Tools
- Use `NotificationSystemManager` for queue inspection
- Check browser console for detailed debug logs
- Monitor Supabase logs for database errors
- Review Edge Function logs for email delivery issues

## Conclusion

The Mon Cercle notification system provides a robust, scalable, and user-friendly way to keep network members informed while respecting their preferences and privacy. The multi-profile architecture ensures that notifications work seamlessly across different network memberships, while the comprehensive testing and debugging tools make maintenance and troubleshooting straightforward.

The system is designed for both current needs and future growth, with clear extension points for additional notification types, delivery methods, and advanced features.