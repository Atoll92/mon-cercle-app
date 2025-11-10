# Engagement Features User Guide

## Overview
This guide explains how to access and use all the new engagement features in Conclav.

## 🎯 Accessing the Features

### Engagement Demo Page
**URL Pattern:** `/network/{networkId}/engagement-demo`

**Example:** If your network ID is `abc123`, visit:
```
http://localhost:5174/network/abc123/engagement-demo
```

This demo page showcases all engagement features in one convenient location:
- Activity Feed (full & widget versions)
- Leaderboard (full & widget versions)
- Engagement Stats Card
- Onboarding Checklist
- Notification Preferences

### Features in Production Use

1. **Emoji Reactions** - Available on:
   - Social Wall posts ([NetworkLandingPage.jsx](../src/pages/NetworkLandingPage.jsx) → Social tab)
   - News items ([NewsCard.jsx](../src/components/SocialWall/NewsCard.jsx))
   - Comments ([CommentSection.jsx](../src/components/CommentSection.jsx))

2. **Activity Feed** - Can be added to any page using:
   ```jsx
   import ActivityFeedWidget from '../components/ActivityFeedWidget';

   <ActivityFeedWidget />
   ```

3. **Leaderboard** - Can be added to any page using:
   ```jsx
   import LeaderboardWidget from '../components/LeaderboardWidget';

   <LeaderboardWidget limit={5} compact={true} />
   ```

4. **Engagement Stats** - Can be added to profile pages:
   ```jsx
   import EngagementStatsCard from '../components/EngagementStatsCard';

   <EngagementStatsCard profileId={activeProfile?.id} />
   ```

5. **Onboarding Checklist** - Can be added to dashboards:
   ```jsx
   import OnboardingChecklist from '../components/OnboardingChecklist';

   <OnboardingChecklist />
   ```

## 📱 Feature Descriptions

### 1. Emoji Reactions
**Location:** Posts, News, Comments

**How to use:**
1. Click the "Add Reaction" button (➕ icon) below any post/news/comment
2. Select an emoji from the picker (16 options available)
3. Click again to remove your reaction
4. Hover over existing reactions to see who reacted

**Admin Controls:**
- Network Settings → Features Configuration → "Emoji Reactions" toggle
- When disabled, reactions are hidden but not deleted
- Re-enabling shows all existing reactions

**Available Emojis:**
👍 ❤️ 🎉 😂 😮 😢 🔥 ✨ 👏 💯 🚀 💡 🙌 💪 🎯 ⭐

### 2. Activity Feed
**Location:** Demo page, can be added to any network page

**What it tracks:**
- Member joined network
- New post created
- News published
- Event created
- Event RSVP
- Badge earned (future feature)

**Features:**
- Real-time updates via Supabase Realtime
- Automatic refresh every 30 seconds
- Shows member avatars and action types
- Compact and full-width versions available

**Database:** `activity_feed` table with automatic triggers

### 3. Leaderboard & Rankings
**Location:** Demo page, can be added to any network page

**Scoring Algorithm:**
```
Total Score =
  (posts_count × 5) +
  (events_attended × 3) +
  (messages_sent × 1) +
  (wiki_contributions × 4) +
  (polls_participated × 2) +
  (files_shared × 2)
```

**Features:**
- Real-time ranking updates
- Time period filters (all-time, month, week)
- Shows top contributors
- Displays engagement stats for each member
- Compact widget version for sidebars

**Database:** Uses existing `engagement_stats` table

### 4. Engagement Stats Card
**Location:** Demo page, Profile pages

**Displays:**
- Total engagement score
- Posts created
- Events attended
- Messages sent
- Wiki contributions
- Polls participated
- Files shared

**Visualization:**
- Circular progress indicator
- Category breakdown
- Color-coded by engagement level

### 5. Onboarding Checklist
**Location:** Demo page, Dashboard

**7 Tracked Items:**
1. ✅ Completed profile
2. ✅ Uploaded profile picture
3. ✅ Made first post
4. ✅ RSVP'd to first event
5. ✅ Sent first message
6. ✅ Joined first network
7. ✅ Invited a member

**Features:**
- Automatic progress tracking via triggers
- Visual progress bar
- Celebration animation on completion
- Persistent state (stored in database)

**Database:** `onboarding_progress` table with automatic triggers

### 6. Notification Preferences
**Location:** Demo page, Settings pages

**Options:**
- **Digest Frequency:**
  - Instant (no digest)
  - Daily
  - Weekly

- **Preferred Time:**
  - Morning (8 AM)
  - Afternoon (2 PM)
  - Evening (6 PM)

**Features:**
- Groups notifications into daily/weekly digests
- Reduces email clutter
- Customizable per member
- Smart batching algorithm

**Database:**
- `profiles` table: `notification_digest_frequency`, `digest_preferred_time`
- `notification_queue` table: digest grouping fields
- `notification_digests` table: digest history

## 🛠️ Integration Examples

### Adding Activity Feed to a Sidebar

```jsx
import React from 'react';
import { Grid, Paper } from '@mui/material';
import ActivityFeedWidget from '../components/ActivityFeedWidget';

const MyPage = () => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        {/* Main content */}
      </Grid>
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 2 }}>
          <ActivityFeedWidget />
        </Paper>
      </Grid>
    </Grid>
  );
};
```

### Adding Leaderboard to Dashboard

```jsx
import React from 'react';
import { Box, Typography } from '@mui/material';
import LeaderboardWidget from '../components/LeaderboardWidget';

const Dashboard = () => {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Top Contributors
      </Typography>
      <LeaderboardWidget limit={10} showFilters={true} />
    </Box>
  );
};
```

### Adding Onboarding to Welcome Screen

```jsx
import React from 'react';
import { Alert } from '@mui/material';
import OnboardingChecklist from '../components/OnboardingChecklist';

const WelcomeScreen = () => {
  return (
    <>
      <Alert severity="info" sx={{ mb: 2 }}>
        Complete these steps to get started!
      </Alert>
      <OnboardingChecklist />
    </>
  );
};
```

## 🧪 Testing Checklist

### Reactions Testing
- [ ] Add reaction to a post
- [ ] Remove reaction from a post
- [ ] See reaction count update in real-time
- [ ] Hover to see who reacted
- [ ] Admin toggle reactions on/off
- [ ] Verify reactions persist when re-enabled

### Activity Feed Testing
- [ ] Create a post → see in feed
- [ ] Join network → see in feed
- [ ] RSVP to event → see in feed
- [ ] Verify real-time updates work
- [ ] Check auto-refresh every 30s

### Leaderboard Testing
- [ ] Create posts → see score increase
- [ ] Attend event → see score increase
- [ ] Send messages → see score increase
- [ ] Filter by time period
- [ ] Verify ranking order correct

### Onboarding Testing
- [ ] Complete profile → check ✅
- [ ] Upload picture → check ✅
- [ ] Create post → check ✅
- [ ] RSVP event → check ✅
- [ ] Send message → check ✅
- [ ] Verify progress persists

### Notification Preferences Testing
- [ ] Change digest frequency
- [ ] Change preferred time
- [ ] Verify settings save
- [ ] Test digest email generation (if applicable)

## 📊 Database Tables Reference

All engagement features use these tables:

1. **`reactions`** - Emoji reactions
2. **`activity_feed`** - Activity tracking
3. **`engagement_stats`** - Leaderboard scores
4. **`onboarding_progress`** - Checklist progress
5. **`notification_queue`** - Notification management
6. **`notification_digests`** - Digest history

See [database.md](../database.md) for complete schema.

## 🎨 Customization

### Changing Reaction Emojis

Edit `EMOJI_PICKER` array in [ReactionBar.jsx](../src/components/ReactionBar.jsx):

```javascript
const EMOJI_PICKER = [
  '👍', '❤️', '🎉', '😂', // Add or remove emojis
];
```

### Adjusting Leaderboard Scoring

Edit scoring weights in [leaderboard.js](../src/api/leaderboard.js):

```javascript
const scoreFormula = `
  (posts_count * 5) +      // Change weight here
  (events_attended * 3) +
  // ... etc
`;
```

### Activity Feed Refresh Rate

Edit refresh interval in [ActivityFeed.jsx](../src/components/ActivityFeed.jsx):

```javascript
const REFRESH_INTERVAL = 30000; // milliseconds (30s default)
```

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Verify network context is available
3. Check database migrations ran successfully
4. Review [ENGAGEMENT_FEATURES_IMPLEMENTATION.md](./ENGAGEMENT_FEATURES_IMPLEMENTATION.md)

## 🚀 Next Steps

Future enhancements to consider:
- Add reactions to events and wiki pages
- Custom emoji sets per network
- Reaction analytics dashboard
- Advanced leaderboard filtering
- Gamification badges and achievements
- Social sharing of achievements
