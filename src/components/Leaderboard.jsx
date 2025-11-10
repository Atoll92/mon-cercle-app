/**
 * Leaderboard Component
 * Displays top members by various engagement metrics
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  Tabs,
  Tab,
  alpha,
  useTheme,
  Skeleton,
  Tooltip
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Article as PostIcon,
  Event as EventIcon,
  Forum as MessageIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { supabase } from '../supabaseclient';
import {
  fetchTopContributors,
  fetchMostActiveMembers,
  fetchTopEventAttendees,
  fetchOverallLeaderboard
} from '../api/leaderboard';

// Medal colors for top 3
const getMedalColor = (rank, theme) => {
  if (rank === 1) return '#FFD700'; // Gold
  if (rank === 2) return '#C0C0C0'; // Silver
  if (rank === 3) return '#CD7F32'; // Bronze
  return theme.palette.text.secondary;
};

/**
 * Leaderboard Component
 * @param {string} networkId - Network ID
 * @param {number} limit - Number of top users to display (default: 10)
 * @param {string} defaultTab - Default tab to show ('overall', 'posts', 'events', 'messages')
 * @param {boolean} compact - Compact view (default: false)
 */
const Leaderboard = ({ networkId, limit = 10, defaultTab = 'overall', compact = false }) => {
  const theme = useTheme();
  // Using global supabase client

  const [currentTab, setCurrentTab] = useState(defaultTab);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (networkId) {
      loadLeaderboard();
    }
  }, [networkId, currentTab, limit]);

  const loadLeaderboard = async () => {
    if (!networkId) return;

    setLoading(true);
    let result;

    switch (currentTab) {
      case 'posts':
        result = await fetchTopContributors(supabase, networkId, limit);
        break;
      case 'events':
        result = await fetchTopEventAttendees(supabase, networkId, limit);
        break;
      case 'messages':
        result = await fetchMostActiveMembers(supabase, networkId, limit);
        break;
      case 'overall':
      default:
        result = await fetchOverallLeaderboard(supabase, networkId, limit);
        break;
    }

    if (!result.error && result.data) {
      setLeaderboardData(result.data);
    }

    setLoading(false);
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const getMetricValue = (item) => {
    switch (currentTab) {
      case 'posts':
        return item.posts_count || 0;
      case 'events':
        return item.events_attended || 0;
      case 'messages':
        return item.messages_sent || 0;
      case 'overall':
        return item.total_score || 0;
      default:
        return 0;
    }
  };

  const getMetricLabel = () => {
    switch (currentTab) {
      case 'posts':
        return 'Posts';
      case 'events':
        return 'Events';
      case 'messages':
        return 'Messages';
      case 'overall':
        return 'Score';
      default:
        return '';
    }
  };

  if (loading && leaderboardData.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Leaderboard
          </Typography>
          <List>
            {[...Array(5)].map((_, i) => (
              <ListItem key={i}>
                <ListItemAvatar>
                  <Skeleton variant="circular" width={40} height={40} />
                </ListItemAvatar>
                <ListItemText
                  primary={<Skeleton variant="text" width="60%" />}
                  secondary={<Skeleton variant="text" width="40%" />}
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <TrophyIcon sx={{ color: theme.palette.warning.main, fontSize: 28 }} />
          <Typography variant="h6">
            Leaderboard
          </Typography>
        </Box>

        {/* Tabs */}
        {!compact && (
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Overall" value="overall" icon={<StarIcon />} iconPosition="start" />
            <Tab label="Posts" value="posts" icon={<PostIcon />} iconPosition="start" />
            <Tab label="Events" value="events" icon={<EventIcon />} iconPosition="start" />
            <Tab label="Messages" value="messages" icon={<MessageIcon />} iconPosition="start" />
          </Tabs>
        )}

        {/* Leaderboard List */}
        {leaderboardData.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No engagement data available yet
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {leaderboardData.map((item, index) => {
              const rank = index + 1;
              const medalColor = getMedalColor(rank, theme);
              const profile = item.profiles;
              const metricValue = getMetricValue(item);

              return (
                <ListItem
                  key={item.user_id}
                  sx={{
                    px: compact ? 1 : 2,
                    py: compact ? 0.5 : 1,
                    borderRadius: 1,
                    mb: 0.5,
                    backgroundColor: rank <= 3
                      ? alpha(medalColor, 0.05)
                      : 'transparent',
                    transition: 'all 0.2s',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.05),
                      transform: 'translateX(4px)'
                    }
                  }}
                >
                  {/* Rank Number */}
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 1.5,
                      fontWeight: 700,
                      fontSize: '1rem',
                      color: medalColor,
                      backgroundColor: alpha(medalColor, 0.1),
                      border: rank <= 3 ? `2px solid ${medalColor}` : 'none'
                    }}
                  >
                    {rank <= 3 ? (
                      <TrophyIcon sx={{ fontSize: 20, color: medalColor }} />
                    ) : (
                      rank
                    )}
                  </Box>

                  {/* Avatar */}
                  <ListItemAvatar>
                    <Avatar
                      src={profile?.profile_picture_url}
                      sx={{
                        width: compact ? 36 : 44,
                        height: compact ? 36 : 44,
                        border: rank <= 3 ? `2px solid ${medalColor}` : 'none'
                      }}
                    >
                      {profile?.full_name?.[0] || '?'}
                    </Avatar>
                  </ListItemAvatar>

                  {/* User Info */}
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography
                          variant={compact ? 'body2' : 'body1'}
                          sx={{
                            fontWeight: rank <= 3 ? 600 : 500,
                            fontSize: compact ? '0.875rem' : '1rem'
                          }}
                        >
                          {profile?.full_name || 'Unknown User'}
                        </Typography>
                        {profile?.badge_count > 0 && (
                          <Tooltip title={`${profile.badge_count} badges earned`}>
                            <Chip
                              label={profile.badge_count}
                              size="small"
                              icon={<StarIcon />}
                              sx={{
                                height: 20,
                                fontSize: '0.7rem',
                                backgroundColor: alpha(theme.palette.warning.main, 0.1),
                                color: theme.palette.warning.dark,
                                '& .MuiChip-icon': {
                                  fontSize: '0.875rem',
                                  color: theme.palette.warning.dark
                                }
                              }}
                            />
                          </Tooltip>
                        )}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <Chip
                          label={`${metricValue} ${getMetricLabel()}`}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.7rem',
                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                            color: theme.palette.primary.main
                          }}
                        />
                        {!compact && currentTab === 'overall' && (
                          <>
                            <Typography variant="caption" color="text.secondary">
                              •
                            </Typography>
                            <Tooltip title="Posts">
                              <Chip
                                label={item.posts_count || 0}
                                size="small"
                                icon={<PostIcon />}
                                sx={{
                                  height: 18,
                                  fontSize: '0.65rem',
                                  backgroundColor: 'transparent',
                                  color: theme.palette.text.secondary,
                                  '& .MuiChip-icon': {
                                    fontSize: '0.75rem'
                                  }
                                }}
                              />
                            </Tooltip>
                            <Tooltip title="Events Attended">
                              <Chip
                                label={item.events_attended || 0}
                                size="small"
                                icon={<EventIcon />}
                                sx={{
                                  height: 18,
                                  fontSize: '0.65rem',
                                  backgroundColor: 'transparent',
                                  color: theme.palette.text.secondary,
                                  '& .MuiChip-icon': {
                                    fontSize: '0.75rem'
                                  }
                                }}
                              />
                            </Tooltip>
                          </>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              );
            })}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

export default Leaderboard;
