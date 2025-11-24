/**
 * ReactorsModal Component
 * Facebook-style modal showing all users who reacted to content
 * Groups reactions by emoji and shows user profiles
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Avatar,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  Button,
  alpha,
  useTheme,
  useMediaQuery,
  Skeleton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { supabase } from '../supabaseclient';
import { useProfile } from '../context/profileContext';
import { removeReaction } from '../api/reactions';

/**
 * ReactorsModal
 * @param {boolean} open - Whether modal is open
 * @param {Function} onClose - Close handler
 * @param {string} contentType - Type of content ('post', 'news', etc.)
 * @param {string} contentId - ID of the content
 * @param {Object} reactions - Reaction summary with emoji counts
 * @param {boolean} darkMode - Dark mode flag
 */
const ReactorsModal = ({ open, onClose, contentType, contentId, reactions = {}, darkMode = false }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { activeProfile } = useProfile();
  const [selectedTab, setSelectedTab] = useState('all');
  const [reactorsByEmoji, setReactorsByEmoji] = useState({});
  const [loading, setLoading] = useState(false);
  const [removingReaction, setRemovingReaction] = useState(false);

  // Load reactor profiles when modal opens
  useEffect(() => {
    if (open && contentType && contentId) {
      loadReactors();
    }
  }, [open, contentType, contentId]);

  const loadReactors = async () => {
    setLoading(true);
    try {
      // Fetch all reactions with profile information
      const { data, error } = await supabase
        .from('reactions')
        .select(`
          id,
          emoji,
          created_at,
          profile_id,
          profiles!inner(
            id,
            full_name,
            profile_picture_url
          )
        `)
        .eq('content_type', contentType)
        .eq('content_id', contentId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group reactions by emoji
      const grouped = {};
      if (data) {
        data.forEach(reaction => {
          const emoji = reaction.emoji;
          if (!grouped[emoji]) {
            grouped[emoji] = [];
          }
          grouped[emoji].push({
            id: reaction.profile_id,
            full_name: reaction.profiles?.full_name || 'Unknown User',
            profile_picture_url: reaction.profiles?.profile_picture_url,
            created_at: reaction.created_at
          });
        });
      }

      setReactorsByEmoji(grouped);
    } catch (err) {
      console.error('Error loading reactors:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get all reactors (for "All" tab)
  const allReactors = React.useMemo(() => {
    const all = [];
    Object.values(reactorsByEmoji).forEach(reactors => {
      all.push(...reactors);
    });
    // Remove duplicates (in case someone changed their reaction)
    const unique = Array.from(new Map(all.map(r => [r.id, r])).values());
    return unique.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [reactorsByEmoji]);

  // Get total count
  const totalCount = allReactors.length;

  // Get emojis with counts
  const emojiTabs = React.useMemo(() => {
    return Object.entries(reactorsByEmoji).map(([emoji, reactors]) => ({
      emoji,
      count: reactors.length
    })).sort((a, b) => b.count - a.count);
  }, [reactorsByEmoji]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  // Get reactors for current tab
  const currentReactors = selectedTab === 'all'
    ? allReactors
    : reactorsByEmoji[selectedTab] || [];

  // Handle profile click
  const handleProfileClick = (profileId) => {
    window.location.href = `/profile/${profileId}`;
  };

  // Handle removing user's own reaction
  const handleRemoveReaction = async () => {
    if (!activeProfile?.id) return;

    setRemovingReaction(true);
    try {
      const result = await removeReaction(supabase, activeProfile.id, contentType, contentId);
      if (!result.error) {
        // Reload reactors and close modal
        await loadReactors();
        // If no more reactors, close modal
        if (totalCount <= 1) {
          onClose();
        }
      }
    } catch (err) {
      console.error('Error removing reaction:', err);
    } finally {
      setRemovingReaction(false);
    }
  };

  // Check if current user has reacted
  const currentUserReaction = React.useMemo(() => {
    if (!activeProfile?.id) return null;

    for (const [emoji, reactors] of Object.entries(reactorsByEmoji)) {
      if (reactors.some(r => r.id === activeProfile.id)) {
        return emoji;
      }
    }
    return null;
  }, [reactorsByEmoji, activeProfile?.id]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: fullScreen ? 0 : 3,
          bgcolor: darkMode ? 'grey.900' : 'background.paper',
          backgroundImage: 'none',
          minHeight: '60vh',
          maxHeight: '80vh'
        }
      }}
    >
      {/* Header */}
      <DialogTitle sx={{
        p: 2,
        pb: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              Reactions
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {totalCount} {totalCount === 1 ? 'person' : 'people'} reacted
            </Typography>
          </Box>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              color: 'text.secondary',
              '&:hover': {
                bgcolor: alpha(theme.palette.action.hover, 0.08)
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Show remove button if user has reacted */}
        {currentUserReaction && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
              You reacted with {currentUserReaction}
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={handleRemoveReaction}
              disabled={removingReaction}
              sx={{
                textTransform: 'none',
                borderRadius: 2,
                fontSize: '0.875rem'
              }}
            >
              {removingReaction ? 'Removing...' : 'Remove your reaction'}
            </Button>
          </Box>
        )}
      </DialogTitle>

      {/* Tabs for emoji filters */}
      {emojiTabs.length > 0 && (
        <Box sx={{
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: darkMode ? alpha('#000', 0.2) : alpha('#000', 0.02)
        }}>
          <Tabs
            value={selectedTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 48,
              '& .MuiTab-root': {
                minHeight: 48,
                minWidth: 'auto',
                px: 2,
                py: 1
              }
            }}
          >
            {/* All tab */}
            <Tab
              value="all"
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    All
                  </Typography>
                  <Box
                    component="span"
                    sx={{
                      bgcolor: selectedTab === 'all'
                        ? alpha(theme.palette.primary.main, 0.15)
                        : alpha(theme.palette.action.hover, 0.08),
                      px: 1,
                      py: 0.25,
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: selectedTab === 'all' ? 'primary.main' : 'text.secondary'
                    }}
                  >
                    {totalCount}
                  </Box>
                </Box>
              }
            />

            {/* Individual emoji tabs */}
            {emojiTabs.map(({ emoji, count }) => (
              <Tab
                key={emoji}
                value={emoji}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <span style={{ fontSize: '1.25rem' }}>{emoji}</span>
                    <Box
                      component="span"
                      sx={{
                        bgcolor: selectedTab === emoji
                          ? alpha(theme.palette.primary.main, 0.15)
                          : alpha(theme.palette.action.hover, 0.08),
                        px: 1,
                        py: 0.25,
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: selectedTab === emoji ? 'primary.main' : 'text.secondary',
                        minWidth: 20,
                        textAlign: 'center'
                      }}
                    >
                      {count}
                    </Box>
                  </Box>
                }
              />
            ))}
          </Tabs>
        </Box>
      )}

      {/* Content */}
      <DialogContent sx={{ p: 0, overflowY: 'auto' }}>
        {loading ? (
          // Loading skeleton
          <List sx={{ p: 2, pt: 1 }}>
            {[1, 2, 3, 4, 5].map(i => (
              <ListItem key={i} sx={{ px: 2, py: 1.5 }}>
                <ListItemAvatar>
                  <Skeleton variant="circular" width={40} height={40} />
                </ListItemAvatar>
                <ListItemText
                  primary={<Skeleton width="60%" />}
                  secondary={<Skeleton width="40%" />}
                />
              </ListItem>
            ))}
          </List>
        ) : currentReactors.length > 0 ? (
          // Reactors list
          <List sx={{ p: 0 }}>
            {currentReactors.map((reactor, index) => (
              <ListItem
                key={`${reactor.id}-${index}`}
                sx={{
                  px: 3,
                  py: 1.5,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  borderBottom: index < currentReactors.length - 1
                    ? `1px solid ${alpha(theme.palette.divider, 0.05)}`
                    : 'none',
                  '&:hover': {
                    bgcolor: darkMode
                      ? alpha('#fff', 0.05)
                      : alpha('#000', 0.02),
                    '& .MuiAvatar-root': {
                      transform: 'scale(1.05)',
                      boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.3)}`
                    }
                  }
                }}
                onClick={() => handleProfileClick(reactor.id)}
              >
                <ListItemAvatar>
                  <Avatar
                    src={reactor.profile_picture_url}
                    sx={{
                      width: 40,
                      height: 40,
                      transition: 'all 0.2s ease',
                      border: `2px solid ${alpha(theme.palette.divider, 0.1)}`
                    }}
                  >
                    {reactor.full_name?.[0]?.toUpperCase() || 'U'}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: darkMode ? 'grey.100' : 'text.primary'
                      }}
                    >
                      {reactor.full_name}
                    </Typography>
                  }
                />
                {/* Show emoji for "All" tab */}
                {selectedTab === 'all' && (
                  <Box sx={{ ml: 1 }}>
                    {Object.entries(reactorsByEmoji).map(([emoji, reactors]) => {
                      if (reactors.some(r => r.id === reactor.id)) {
                        return (
                          <span key={emoji} style={{ fontSize: '1.25rem' }}>
                            {emoji}
                          </span>
                        );
                      }
                      return null;
                    })}
                  </Box>
                )}
              </ListItem>
            ))}
          </List>
        ) : (
          // Empty state
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 8,
              px: 3
            }}
          >
            <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
              No reactions yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
              Be the first to react to this content
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ReactorsModal;
