import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Chip,
  Avatar,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  Paper,
  alpha,
  useTheme,
  Skeleton
} from '@mui/material';

import {
  Star as StarIcon,
  EmojiEvents as TrophyIcon,
  WorkspacePremium as PremiumIcon,
  TrendingUp as TrendingUpIcon,
  Event as EventIcon,
  Chat as ChatIcon,
  Loyalty as LoyaltyIcon,
  Security as SecurityIcon,
  Favorite as FavoriteIcon,
  Psychology as PsychologyIcon,
  Groups as GroupsIcon,
  School as SchoolIcon,
  Verified as VerifiedIcon,
  LocalFireDepartment as FireIcon,
  AutoAwesome as AutoAwesomeIcon,
  EmojiPeople as EmojiPeopleIcon,
  Timer as TimerIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';

import { fetchUserBadges } from '../api/badges';

// Icon mapping for badge icons
const BADGE_ICONS = {
  Star: StarIcon,
  Trophy: TrophyIcon,
  Premium: PremiumIcon,
  TrendingUp: TrendingUpIcon,
  Event: EventIcon,
  Chat: ChatIcon,
  Loyalty: LoyaltyIcon,
  Security: SecurityIcon,
  Favorite: FavoriteIcon,
  Psychology: PsychologyIcon,
  Groups: GroupsIcon,
  School: SchoolIcon,
  Verified: VerifiedIcon,
  Fire: FireIcon,
  AutoAwesome: AutoAwesomeIcon,
  EmojiPeople: EmojiPeopleIcon,
  Timer: TimerIcon,
  Assignment: AssignmentIcon
};

const UserBadges = ({ userId, displayMode = 'chips', maxDisplay = 3, showTotal = true }) => {
  const theme = useTheme();
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadUserBadges();
  }, [userId]);

  const loadUserBadges = async () => {
    try {
      setLoading(true);
      const data = await fetchUserBadges(userId);
      setBadges(data);
    } catch (err) {
      console.error('Error loading user badges:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderBadgeIcon = (iconName, color = 'primary', size = 'small') => {
    const IconComponent = BADGE_ICONS[iconName] || StarIcon;
    return <IconComponent color={color} fontSize={size} />;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', gap: 1 }}>
        {[...Array(Math.min(maxDisplay, 3))].map((_, i) => (
          <Skeleton key={i} variant="circular" width={32} height={32} />
        ))}
      </Box>
    );
  }

  if (badges.length === 0) {
    return null;
  }

  const displayedBadges = badges.slice(0, maxDisplay);
  const remainingCount = badges.length - maxDisplay;

  if (displayMode === 'chips') {
    return (
      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
        {displayedBadges.map((userBadge) => (
          <Tooltip
            key={userBadge.id}
            title={
              <Box>
                <Typography variant="subtitle2">{userBadge.badge.name}</Typography>
                {userBadge.badge.description && (
                  <Typography variant="caption">{userBadge.badge.description}</Typography>
                )}
                {userBadge.reason && (
                  <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontStyle: 'italic' }}>
                    "{userBadge.reason}"
                  </Typography>
                )}
              </Box>
            }
          >
            <Chip
              size="small"
              icon={renderBadgeIcon(userBadge.badge.icon, userBadge.badge.color)}
              label={userBadge.badge.name}
              color={userBadge.badge.color}
              variant="outlined"
              sx={{
                borderWidth: 1.5,
                '& .MuiChip-icon': {
                  fontSize: 16
                }
              }}
            />
          </Tooltip>
        ))}
        {remainingCount > 0 && showTotal && (
          <Chip
            size="small"
            label={`+${remainingCount}`}
            variant="outlined"
            onClick={() => setDialogOpen(true)}
            sx={{ cursor: 'pointer' }}
          />
        )}
      </Box>
    );
  }

  if (displayMode === 'icons') {
    return (
      <>
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          {displayedBadges.map((userBadge) => (
            <Tooltip
              key={userBadge.id}
              title={
                <Box>
                  <Typography variant="subtitle2">{userBadge.badge.name}</Typography>
                  {userBadge.badge.description && (
                    <Typography variant="caption">{userBadge.badge.description}</Typography>
                  )}
                </Box>
              }
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: alpha(theme.palette[userBadge.badge.color].main, 0.1)
                }}
              >
                {renderBadgeIcon(userBadge.badge.icon, userBadge.badge.color, 'small')}
              </Avatar>
            </Tooltip>
          ))}
          {remainingCount > 0 && showTotal && (
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: 'action.hover',
                cursor: 'pointer',
                fontSize: 14
              }}
              onClick={() => setDialogOpen(true)}
            >
              +{remainingCount}
            </Avatar>
          )}
        </Box>

        {/* All Badges Dialog */}
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>All Badges ({badges.length})</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 0 }}>
              {badges.map((userBadge) => (
                <Grid item xs={12} sm={6} key={userBadge.id}>
                  <Paper
                    sx={{
                      p: 2,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 2,
                      bgcolor: alpha(theme.palette[userBadge.badge.color].main, 0.05)
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: alpha(theme.palette[userBadge.badge.color].main, 0.15),
                        width: 48,
                        height: 48
                      }}
                    >
                      {renderBadgeIcon(userBadge.badge.icon, userBadge.badge.color, 'medium')}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {userBadge.badge.name}
                      </Typography>
                      {userBadge.badge.description && (
                        <Typography variant="body2" color="text.secondary">
                          {userBadge.badge.description}
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        Awarded {new Date(userBadge.awarded_at).toLocaleDateString()}
                      </Typography>
                      {userBadge.reason && (
                        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                          "{userBadge.reason}"
                        </Typography>
                      )}
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return null;
};

export default UserBadges;