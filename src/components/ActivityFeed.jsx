/**
 * ActivityFeed Component
 * Displays real-time network activity feed
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
  IconButton,
  Collapse,
  alpha,
  useTheme,
  Skeleton
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Article as ArticleIcon,
  Campaign as CampaignIcon,
  Event as EventIcon,
  Comment as CommentIcon,
  InsertDriveFile as FileIcon,
  MenuBook as WikiIcon,
  EmojiEvents as BadgeIcon,
  TrendingUp as MilestoneIcon,
  CheckCircle as RsvpIcon,
  EmojiEmotions as ReactionIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { supabase } from '../supabaseclient';
import { useAuth } from '../context/authcontext';
import { fetchNetworkActivity, subscribeToActivity } from '../api/activityFeed';
import { formatTimeAgo } from '../utils/dateFormatting';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import { generateActivityText } from '../utils/activityTextGenerator';

// Icon mapping for activity types
const getActivityIcon = (activityType) => {
  const iconMap = {
    member_joined: <PersonAddIcon />,
    post_created: <ArticleIcon />,
    news_created: <CampaignIcon />,
    event_created: <EventIcon />,
    event_rsvp: <RsvpIcon />,
    comment_added: <CommentIcon />,
    file_shared: <FileIcon />,
    wiki_page_created: <WikiIcon />,
    badge_earned: <BadgeIcon />,
    milestone_reached: <MilestoneIcon />,
    reaction_added: <ReactionIcon />
  };
  return iconMap[activityType] || <MilestoneIcon />;
};

// Color mapping for activity types
const getActivityColor = (activityType, theme) => {
  const colorMap = {
    member_joined: theme.palette.success.main,
    post_created: theme.palette.primary.main,
    news_created: theme.palette.info.main,
    event_created: theme.palette.secondary.main,
    event_rsvp: theme.palette.success.light,
    comment_added: theme.palette.grey[600],
    file_shared: theme.palette.warning.main,
    wiki_page_created: theme.palette.info.light,
    badge_earned: theme.palette.warning.dark,
    milestone_reached: theme.palette.success.dark,
    reaction_added: theme.palette.warning.light
  };
  return colorMap[activityType] || theme.palette.primary.main;
};

/**
 * ActivityFeed Component
 * @param {string} networkId - Network ID
 * @param {number} limit - Number of activities to display (default: 20)
 * @param {boolean} compact - Compact view (default: false)
 * @param {boolean} autoRefresh - Auto-refresh with real-time (default: true)
 */
const ActivityFeed = ({ networkId, limit = 20, compact = false, autoRefresh = true }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  // Using global supabase client
  const { activeProfile } = useAuth();
  const navigate = useNavigate();

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (networkId) {
      loadActivities();
    }
  }, [networkId, limit]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!networkId || !autoRefresh || !supabase) return;

    const subscription = subscribeToActivity(supabase, networkId, (payload) => {
      console.log('New activity:', payload);
      // Prepend new activity to the list
      if (payload.new) {
        setActivities(prev => [payload.new, ...prev.slice(0, limit - 1)]);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [networkId, autoRefresh, limit, supabase]);

  const loadActivities = async () => {
    if (!networkId) return;

    setLoading(true);
    const { data, error } = await fetchNetworkActivity(supabase, networkId, limit);

    if (error) {
      console.error('[ActivityFeed] Error loading activities:', error);
    }

    if (!error && data) {
      setActivities(data);
    }

    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadActivities();
    setRefreshing(false);
  };

  const handleActivityClick = (activity) => {
    // Navigate to entity if applicable
    if (activity.entity_type && activity.entity_id) {
      switch (activity.entity_type) {
        case 'post':
          navigate(`/post/${activity.entity_id}`);
          break;
        case 'news':
          navigate(`/network/${networkId}/news/${activity.entity_id}`);
          break;
        case 'event':
          navigate(`/network/${networkId}/events`);
          break;
        case 'wiki':
          navigate(`/network/${networkId}/wiki`);
          break;
        default:
          break;
      }
    }
  };

  if (loading && activities.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {t('activityFeed.title')}
          </Typography>
          <List>
            {[...Array(5)].map((_, i) => (
              <ListItem key={i}>
                <ListItemAvatar>
                  <Skeleton variant="circular" width={40} height={40} />
                </ListItemAvatar>
                <ListItemText
                  primary={<Skeleton variant="text" width="80%" />}
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
      <CardContent sx={{ pb: 1 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6">
              {compact ? t('activityFeed.recentActivity') : t('activityFeed.whatsHappening')}
            </Typography>
            <Chip
              label={activities.length}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.75rem',
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main
              }}
            />
          </Box>
          <Box>
            <IconButton
              size="small"
              onClick={handleRefresh}
              disabled={refreshing}
              sx={{
                animation: refreshing ? 'spin 1s linear infinite' : 'none',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' }
                }
              }}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
            {!compact && (
              <IconButton
                size="small"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            )}
          </Box>
        </Box>

        {/* Activity List */}
        <Collapse in={expanded} timeout="auto">
          {activities.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                {t('activityFeed.noActivity')}
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {activities.map((activity, index) => {
                const activityColor = getActivityColor(activity.activity_type, theme);
                const isClickable = activity.entity_type && activity.entity_id;

                return (
                  <ListItem
                    key={activity.id}
                    sx={{
                      px: compact ? 1 : 2,
                      py: compact ? 0.5 : 1,
                      cursor: isClickable ? 'pointer' : 'default',
                      transition: 'all 0.2s',
                      borderRadius: 1,
                      mb: 0.5,
                      '&:hover': isClickable ? {
                        backgroundColor: alpha(activityColor, 0.05),
                        transform: 'translateX(4px)'
                      } : {},
                      borderLeft: `3px solid ${alpha(activityColor, 0.3)}`
                    }}
                    onClick={() => isClickable && handleActivityClick(activity)}
                  >
                    <ListItemAvatar>
                      <Avatar
                        src={activity.profiles?.profile_picture_url}
                        sx={{
                          width: compact ? 32 : 40,
                          height: compact ? 32 : 40,
                          bgcolor: alpha(activityColor, 0.1),
                          color: activityColor
                        }}
                      >
                        {activity.profiles?.full_name?.[0] || getActivityIcon(activity.activity_type)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography
                          variant={compact ? 'body2' : 'body1'}
                          sx={{
                            fontSize: compact ? '0.875rem' : '1rem',
                            fontWeight: 500,
                            color: theme.palette.text.primary
                          }}
                        >
                          {generateActivityText(activity, t)}
                        </Typography>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <Typography
                            variant="caption"
                            sx={{
                              color: theme.palette.text.secondary,
                              fontSize: compact ? '0.7rem' : '0.75rem'
                            }}
                          >
                            {formatTimeAgo(activity.created_at)}
                          </Typography>
                          {!compact && (
                            <Chip
                              icon={getActivityIcon(activity.activity_type)}
                              label={t(`activityFeed.activityTypes.${activity.activity_type}`)}
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: '0.65rem',
                                backgroundColor: alpha(activityColor, 0.1),
                                color: activityColor,
                                '& .MuiChip-icon': {
                                  fontSize: '0.875rem',
                                  color: activityColor
                                }
                              }}
                            />
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                );
              })}
            </List>
          )}
        </Collapse>

        {/* View All Button */}
        {!compact && activities.length > 0 && (
          <Box sx={{ textAlign: 'center', mt: 2, pt: 1, borderTop: `1px solid ${theme.palette.divider}` }}>
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.text.secondary,
                cursor: 'pointer',
                '&:hover': {
                  color: theme.palette.primary.main,
                  textDecoration: 'underline'
                }
              }}
              onClick={handleRefresh}
            >
              {activities[0] && t('activityFeed.lastUpdated', { time: formatTimeAgo(activities[0].created_at) })}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityFeed;
