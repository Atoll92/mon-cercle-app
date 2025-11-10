/**
 * Engagement Demo Page
 * Showcases all the new engagement features in one place
 */

import React from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Alert,
  useTheme,
  alpha
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/authcontext';
import { useProfile } from '../context/profileContext';
import { NetworkProviderWithParams } from '../context/networkContext';

// Import engagement widgets
import ActivityFeed from '../components/ActivityFeed';
import ActivityFeedWidget from '../components/ActivityFeedWidget';
import Leaderboard from '../components/Leaderboard';
import LeaderboardWidget from '../components/LeaderboardWidget';
import EngagementStatsCard from '../components/EngagementStatsCard';
import OnboardingChecklist from '../components/OnboardingChecklist';
import NotificationPreferences from '../components/NotificationPreferences';

const EngagementDemoContent = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const { activeProfile } = useProfile();

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="warning">
          Please log in to view engagement features
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" gutterBottom>
          Engagement Features Demo
        </Typography>
        <Typography variant="body1" color="text.secondary">
          All new engagement features in one place
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column - Full Width Components */}
        <Grid item xs={12} lg={8}>
          {/* Activity Feed */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              Activity Feed
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Real-time network activity tracking
            </Typography>
            <ActivityFeedWidget />
          </Paper>

          {/* Full Leaderboard */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              Leaderboard
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Member engagement rankings
            </Typography>
            <Leaderboard limit={10} showFilters={true} />
          </Paper>

          {/* Notification Preferences */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Notification Preferences
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Configure email digest preferences
            </Typography>
            <NotificationPreferences />
          </Paper>
        </Grid>

        {/* Right Column - Widgets & Cards */}
        <Grid item xs={12} lg={4}>
          {/* Onboarding Checklist */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Onboarding Checklist
            </Typography>
            <OnboardingChecklist />
          </Paper>

          {/* Engagement Stats */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Your Engagement Stats
            </Typography>
            <EngagementStatsCard profileId={activeProfile?.id} />
          </Paper>

          {/* Leaderboard Widget */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Top Members (Widget)
            </Typography>
            <LeaderboardWidget limit={5} compact={true} />
          </Paper>

          {/* Feature Info */}
          <Paper
            sx={{
              p: 3,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
            }}
          >
            <Typography variant="h6" gutterBottom>
              New Features
            </Typography>
            <Box component="ul" sx={{ pl: 2, m: 0 }}>
              <li>
                <Typography variant="body2">
                  ✨ Emoji reactions on posts, news, and comments
                </Typography>
              </li>
              <li>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  📊 Real-time activity feed
                </Typography>
              </li>
              <li>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  🏆 Leaderboards & engagement stats
                </Typography>
              </li>
              <li>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  📧 Smart notification digests
                </Typography>
              </li>
              <li>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  ✅ Onboarding progress tracking
                </Typography>
              </li>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Testing Instructions */}
      <Paper
        sx={{
          mt: 4,
          p: 3,
          backgroundColor: alpha(theme.palette.info.main, 0.05),
          border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
        }}
      >
        <Typography variant="h6" gutterBottom>
          How to Test
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Reactions:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Go to the Social Wall tab and react to posts, news, or comments with emojis.
              Admin can enable/disable reactions in Network Settings.
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Activity Feed:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create posts, join the network, RSVP to events - all actions appear in real-time.
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Leaderboard:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Engage with the network (post, attend events, message, contribute to wiki) to climb the rankings.
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Onboarding:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Complete your profile, upload a picture, make your first post to track progress.
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

// Wrapper with NetworkProvider
const EngagementDemoPage = () => {
  const { networkId } = useParams();

  if (!networkId) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">
          Network ID required. Access this page from within a network.
        </Alert>
      </Container>
    );
  }

  return (
    <NetworkProviderWithParams>
      <EngagementDemoContent />
    </NetworkProviderWithParams>
  );
};

export default EngagementDemoPage;
