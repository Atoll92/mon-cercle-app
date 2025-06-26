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
   - News posting: Automatic notification queueing
   - Chat mentions: Real-time mention notifications
   - Profile management: Multi-profile notification support

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
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('news', 'event', 'mention', 'direct_message')),
    subject_line VARCHAR(255) NOT NULL,
    content_preview TEXT,
    related_item_id UUID,
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

### 1. News Notifications
- **Trigger**: When new posts are created in a network
- **Recipients**: All network members (excluding author) with news notifications enabled
- **Content**: Post title, author name, content preview

### 2. Mention Notifications
- **Trigger**: When users are mentioned in chat messages (@username)
- **Recipients**: Mentioned user only (if mention notifications enabled)
- **Content**: Mentioner name, message context

### 3. Event Notifications
- **Trigger**: When new events are created or updated
- **Recipients**: Network members with event notifications enabled
- **Content**: Event details and timing

### 4. Direct Message Notifications
- **Trigger**: When new direct messages are received
- **Recipients**: Message recipient (if DM notifications enabled)
- **Content**: Sender name, message preview

## Email Service Integration

### Supabase Edge Function
The system uses the `network-invite` Edge Function for email delivery:

```typescript
// Example call to edge function
const { data, error } = await supabase.functions.invoke('network-invite', {
  body: {
    toEmail: recipient.contact_email,
    networkName: network.name,
    inviterName: 'Network Update',
    type: 'news_notification',
    subject: notification.subject_line,
    content: notification.content_preview,
    relatedItemId: notification.related_item_id
  }
});
```

### Rate Limiting
- Sequential processing with 600ms delays between emails
- Retry logic for rate limit errors (3 attempts)
- Exponential backoff for failed deliveries

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

#### `queueNewsNotifications(networkId, newsId, authorId, newsTitle, newsContent)`
Queues notification for all eligible network members when news is posted.

#### `processPendingNotifications()`
Processes the notification queue and sends emails via edge function.

#### `queueMentionNotification(mentionedUserId, networkId, mentionerName, messageContent, messageId)`
Queues notification when a user is mentioned in chat.

#### `queueDirectMessageNotification(recipientId, senderId, messageContent, messageId)`
Queues notification when a direct message is sent to another user.

#### `getNotificationStats(profileId)`
Returns notification statistics for a specific profile.

#### `getUserNotificationPreferences(profileId)`
Retrieves current notification preferences for a profile.

#### `cleanupOldNotifications()`
Removes old sent notifications (30+ days) to keep the queue manageable.

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