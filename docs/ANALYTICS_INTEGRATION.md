# Analytics Integration Guide

## Overview

The analytics system tracks user experiences and engagement during the soft launch. It provides insights into onboarding flow, feature usage, network health, and errors.

## Key Components

### 1. Database Layer
- **Table**: `analytics_events` - Stores all tracked events
- **Views**:
  - `network_health_metrics` - Network-level metrics
  - `onboarding_funnel_metrics` - User onboarding progress
  - `user_engagement_metrics` - User activity and engagement
  - `recent_errors` - Error tracking for debugging

### 2. API Layer (`src/api/analytics.js`)
- `trackEvent()` - Track custom events
- `trackError()` - Track errors with context
- `getAnalyticsSummary()` - Get comprehensive dashboard data
- `getNetworkHealthMetrics()` - Get network metrics
- `getOnboardingFunnelMetrics()` - Get onboarding data
- `getRecentErrors()` - Get recent errors

### 3. Hook (`src/hooks/useAnalytics.js`)
Provides convenience methods for tracking:
- `trackLogin()` - User login
- `trackNetworkCreated()` - Network creation
- `trackMemberInvited()` - Member invitations
- `trackMemberJoined()` - Member joins
- `trackProfileCompleted()` - Profile completion
- `trackFirstPostCreated()` - First post
- `trackFirstEventCreated()` - First event
- `trackFeatureUsed()` - Feature usage
- `trackError()` - Error tracking

### 4. Dashboard (`src/components/superadmin/AnalyticsDashboard.jsx`)
Visualizes analytics data for super admins

## Event Types

### Core Events
- `user_login` - User signs in (auto-tracked in authcontext.jsx)
- `network_created` - User creates a network (tracked in NetworkOnboardingWizard.jsx)
- `network_setup_completed` - Network setup finished
- `member_invited` - Member invitation sent
- `member_joined` - Member joins network
- `profile_completed` - Profile completed (bio, avatar, etc.)
- `first_post_created` - User creates first post
- `first_event_created` - User creates first event
- `feature_used` - Feature interaction (messaging, wiki, files, etc.)
- `error_occurred` - Error with context

## Integration Examples

### Using the Hook

```javascript
import { useAnalytics } from '../hooks/useAnalytics';

function MyComponent() {
  const { trackFeatureUsed, trackError } = useAnalytics();

  const handleAction = async () => {
    try {
      // Your action logic
      await trackFeatureUsed('messaging', {
        networkId: network.id,
        profileId: profile.id
      });
    } catch (error) {
      trackError(error, {
        component: 'MyComponent',
        action: 'handleAction',
        networkId: network.id
      });
    }
  };

  return <button onClick={handleAction}>Do Something</button>;
}
```

### Direct API Usage

```javascript
import { trackEvent } from '../api/analytics';
import { useSupabase } from '../context/authcontext';

const supabase = useSupabase();

await trackEvent(supabase, 'custom_event', {
  networkId: network.id,
  metadata: {
    custom_field: 'value'
  }
});
```

### Error Tracking

```javascript
import { useAnalytics } from '../hooks/useAnalytics';

function MyComponent() {
  const { trackError } = useAnalytics();

  try {
    // Risky operation
  } catch (error) {
    trackError(error, {
      component: 'MyComponent',
      action: 'riskyOperation',
      networkId: currentNetwork?.id,
      profileId: activeProfile?.id
    });
    // Show user error message
  }
}
```

## Already Integrated

✅ **Login Tracking** - `src/context/authcontext.jsx`
- Automatically tracks `user_login` on SIGNED_IN event

✅ **Network Creation** - `src/components/NetworkOnboardingWizard.jsx`
- Tracks `network_created` with network details

✅ **Analytics Dashboard** - `src/pages/SuperAdminDashboard.jsx`
- Added "User Analytics" tab for monitoring

## Recommended Integrations

### High Priority

1. **Member Invitations** (`src/components/admin/MembersTab.jsx`)
   ```javascript
   const { trackMemberInvited } = useAnalytics();

   // After sending invitation
   await trackMemberInvited(networkId, invitationCount);
   ```

2. **Profile Completion** (`src/components/ProfileEditDialog.jsx` or similar)
   ```javascript
   const { trackProfileCompleted } = useAnalytics();

   // When profile is complete (bio + avatar)
   if (hasBio && hasAvatar) {
     await trackProfileCompleted(profileId, networkId, {
       has_bio: true,
       has_avatar: true,
       has_contact: hasContact
     });
   }
   ```

3. **First Post Creation** (`src/components/CreatePostModal.jsx`)
   ```javascript
   const { trackFirstPostCreated } = useAnalytics();

   // Check if it's user's first post
   const { count } = await supabase
     .from('posts')
     .select('*', { count: 'exact', head: true })
     .eq('profile_id', profileId);

   if (count === 1) {
     await trackFirstPostCreated(profileId, networkId, 'portfolio');
   }
   ```

4. **Feature Usage**
   - Messaging: Track when user opens/sends message
   - Wiki: Track when user creates/edits wiki page
   - Files: Track when user uploads file
   - Events: Track when user creates event

### Medium Priority

5. **Member Joined** - Track when user accepts invitation and joins
6. **Network Setup Completed** - Track when admin completes all setup steps
7. **Error Tracking** - Add to critical try/catch blocks

## Best Practices

1. **Fail Silently**: Analytics should never disrupt user experience
   ```javascript
   try {
     await trackEvent(...);
   } catch (error) {
     console.error('Analytics error:', error);
     // Don't throw or show error to user
   }
   ```

2. **Include Context**: Always provide relevant IDs and metadata
   ```javascript
   await trackEvent(supabase, 'event_type', {
     userId: user.id,
     networkId: network.id,
     profileId: profile.id,
     metadata: { /* useful context */ }
   });
   ```

3. **Privacy**: Don't track sensitive data (passwords, tokens, etc.)

4. **Performance**: Analytics calls are async and non-blocking

## Viewing Analytics

1. Navigate to Super Admin Dashboard (`/super-admin`)
2. Click "User Analytics" tab
3. View:
   - Summary metrics (users, active users, networks, errors)
   - Onboarding funnel with conversion rates
   - Network health metrics by network
   - Top engaged users
   - Feature usage statistics
   - Recent errors for debugging

## Database Queries

### Get all events for a user
```sql
SELECT * FROM analytics_events
WHERE user_id = 'user-uuid'
ORDER BY created_at DESC;
```

### Get events by type
```sql
SELECT * FROM analytics_events
WHERE event_type = 'network_created'
ORDER BY created_at DESC;
```

### Get onboarding completion rate
```sql
SELECT
  COUNT(*) FILTER (WHERE completed_network_creation) as networks_created,
  COUNT(*) FILTER (WHERE completed_profile) as profiles_completed,
  COUNT(*) as total_users
FROM onboarding_funnel_metrics;
```

## Troubleshooting

### Analytics not appearing in dashboard
1. Check RLS policies are applied (run migration)
2. Verify user has super_admin role
3. Check browser console for errors
4. Verify events are being inserted in `analytics_events` table

### Events not being tracked
1. Check `trackEvent()` calls aren't failing silently
2. Verify Supabase connection is working
3. Check user permissions in RLS policies
4. Review browser network tab for API calls

## Migration

Run the analytics migration:
```bash
# The migration file already exists
# Apply it to your database via Supabase dashboard or CLI
```

## Security

- RLS policies ensure users can only insert their own events
- Super admins can view all analytics data
- Regular users cannot view analytics tables
- Error tracking excludes sensitive data (tokens, passwords)
