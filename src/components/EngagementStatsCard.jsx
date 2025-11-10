/**
 * EngagementStatsCard Component
 * Displays user's personal engagement stats and network rank
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  alpha,
  useTheme,
  Skeleton,
  Tooltip,
  Chip
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  EmojiEvents as TrophyIcon,
  Article as PostIcon,
  Event as EventIcon,
  Forum as MessageIcon,
  MenuBook as WikiIcon,
  Poll as PollIcon,
  InsertDriveFile as FileIcon
} from '@mui/icons-material';
import { supabase } from '../supabaseclient';
import { useAuth } from '../context/authcontext';
import { useNetwork } from '../context/networkContext';
import { fetchUserEngagementStats } from '../api/leaderboard';

/**
 * StatItem Component - Individual stat display
 */
const StatItem = ({ icon, label, value, color, theme }) => (
  <Box
    sx={{
      p: 2,
      borderRadius: 2,
      backgroundColor: alpha(color, 0.05),
      border: `1px solid ${alpha(color, 0.2)}`,
      transition: 'all 0.3s',
      '&:hover': {
        backgroundColor: alpha(color, 0.1),
        transform: 'translateY(-2px)',
        boxShadow: `0 4px 12px ${alpha(color, 0.2)}`
      }
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: alpha(color, 0.1),
          color: color
        }}
      >
        {icon}
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
        {label}
      </Typography>
    </Box>
    <Typography variant="h4" sx={{ fontWeight: 700, color: color }}>
      {value}
    </Typography>
  </Box>
);

/**
 * EngagementStatsCard Component
 * @param {string} networkId - Network ID
 */
const EngagementStatsCard = ({ networkId }) => {
  const theme = useTheme();
  // Using global supabase client
  const { activeProfile } = useAuth();
  const { currentNetwork } = useNetwork();

  const [stats, setStats] = useState(null);
  const [rank, setRank] = useState(null);
  const [totalMembers, setTotalMembers] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [loading, setLoading] = useState(true);

  // Check if activity feed feature is enabled
  const isActivityFeedEnabled = React.useMemo(() => {
    if (!currentNetwork?.features_config) return false;

    try {
      const config = typeof currentNetwork.features_config === 'string'
        ? JSON.parse(currentNetwork.features_config)
        : currentNetwork.features_config;
      return config.activity_feed === true;
    } catch (e) {
      console.error('Error parsing features config:', e);
      return false;
    }
  }, [currentNetwork?.features_config]);

  useEffect(() => {
    if (networkId && activeProfile?.id && isActivityFeedEnabled) {
      loadStats();
    }
  }, [networkId, activeProfile?.id, isActivityFeedEnabled]);

  const loadStats = async () => {
    if (!networkId || !activeProfile?.id) return;

    setLoading(true);
    const { data, error } = await fetchUserEngagementStats(
      supabase,
      activeProfile.id,
      networkId
    );

    if (!error && data) {
      setStats(data.stats);
      setRank(data.rank);
      setTotalMembers(data.totalMembers);
      setTotalScore(data.totalScore);
    }

    setLoading(false);
  };

  // Don't render if feature is disabled
  if (!isActivityFeedEnabled) {
    return null;
  }

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Skeleton variant="text" width="60%" height={32} />
          <Skeleton variant="rectangular" width="100%" height={100} sx={{ mt: 2 }} />
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            No engagement data available
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const rankPercentile = totalMembers > 0 ? (((totalMembers - rank + 1) / totalMembers) * 100).toFixed(0) : 0;

  return (
    <Card>
      <CardContent>
        {/* Header with Rank */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUpIcon sx={{ color: theme.palette.primary.main, fontSize: 28 }} />
            <Typography variant="h6">Your Engagement</Typography>
          </Box>
          <Tooltip title={`Top ${rankPercentile}% of members`}>
            <Chip
              icon={<TrophyIcon />}
              label={`Rank #${rank} of ${totalMembers}`}
              sx={{
                backgroundColor: alpha(theme.palette.warning.main, 0.1),
                color: theme.palette.warning.dark,
                fontWeight: 600,
                '& .MuiChip-icon': {
                  color: theme.palette.warning.dark
                }
              }}
            />
          </Tooltip>
        </Box>

        {/* Overall Score Progress */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Total Engagement Score
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
              {totalScore}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.min((totalScore / (totalMembers * 100)) * 100, 100)}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                backgroundColor: theme.palette.primary.main
              }
            }}
          />
        </Box>

        {/* Stats Grid */}
        <Grid container spacing={2}>
          <Grid item xs={6} sm={4}>
            <StatItem
              icon={<PostIcon fontSize="small" />}
              label="Posts"
              value={stats.posts_count || 0}
              color={theme.palette.primary.main}
              theme={theme}
            />
          </Grid>
          <Grid item xs={6} sm={4}>
            <StatItem
              icon={<EventIcon fontSize="small" />}
              label="Events"
              value={stats.events_attended || 0}
              color={theme.palette.secondary.main}
              theme={theme}
            />
          </Grid>
          <Grid item xs={6} sm={4}>
            <StatItem
              icon={<MessageIcon fontSize="small" />}
              label="Messages"
              value={stats.messages_sent || 0}
              color={theme.palette.info.main}
              theme={theme}
            />
          </Grid>
          <Grid item xs={6} sm={4}>
            <StatItem
              icon={<WikiIcon fontSize="small" />}
              label="Wiki"
              value={stats.wiki_contributions || 0}
              color={theme.palette.success.main}
              theme={theme}
            />
          </Grid>
          <Grid item xs={6} sm={4}>
            <StatItem
              icon={<PollIcon fontSize="small" />}
              label="Polls"
              value={stats.polls_participated || 0}
              color={theme.palette.warning.main}
              theme={theme}
            />
          </Grid>
          <Grid item xs={6} sm={4}>
            <StatItem
              icon={<FileIcon fontSize="small" />}
              label="Files"
              value={stats.files_shared || 0}
              color={theme.palette.error.main}
              theme={theme}
            />
          </Grid>
        </Grid>

        {/* Motivational Message */}
        <Box
          sx={{
            mt: 3,
            p: 2,
            borderRadius: 2,
            backgroundColor: alpha(theme.palette.primary.main, 0.05),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
          }}
        >
          <Typography variant="body2" sx={{ textAlign: 'center', fontWeight: 500 }}>
            {rank === 1 && "🏆 You're the top contributor! Amazing work!"}
            {rank === 2 && "🥈 You're #2! Keep it up to reach the top!"}
            {rank === 3 && "🥉 You're in the top 3! Great engagement!"}
            {rank > 3 && rank <= 10 && `You're in the top ${Math.ceil((rank / totalMembers) * 100)}%! Keep contributing!`}
            {rank > 10 && "Keep engaging to climb the leaderboard!"}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default EngagementStatsCard;
