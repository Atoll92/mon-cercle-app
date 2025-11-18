/**
 * ReactionBar Component
 * Displays emoji reactions and allows users to add/remove reactions
 * Works with any content type (posts, news, comments, events, wiki)
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Popover,
  Paper,
  Typography,
  Chip,
  Stack,
  Avatar,
  useTheme,
  alpha
} from '@mui/material';
import AddReactionOutlinedIcon from '@mui/icons-material/AddReactionOutlined';
import { useProfile } from '../context/profileContext';
import { supabase } from '../supabaseclient';
import {
  fetchReactionSummary,
  addReaction,
  removeReaction,
  subscribeToReactions
} from '../api/reactions';

// Common emoji reactions
const EMOJI_PICKER = [
  '👍', '❤️', '🎉', '😂', '😮', '😢', '🔥', '✨',
  '👏', '💯', '🚀', '💡', '🙌', '💪', '🎯', '⭐'
];

/**
 * ReactionBar Component
 * @param {string} contentType - Type of content ('post', 'news', 'comment', 'event', 'wiki', 'message', 'dm')
 * @param {string} contentId - ID of the content
 * @param {number} initialCount - Initial reaction count (optional, for display only)
 * @param {string} size - Size variant ('xsmall', 'small', 'medium', 'large')
 */
const ReactionBar = ({ contentType, contentId, initialCount = 0, size = 'medium' }) => {
  const theme = useTheme();
  const { activeProfile } = useProfile();

  const [reactions, setReactions] = useState({});
  const [userReaction, setUserReaction] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [tooltipAnchor, setTooltipAnchor] = useState(null);
  const [tooltipContent, setTooltipContent] = useState({ emoji: '', names: [] });
  const [loading, setLoading] = useState(false);
  const [networkFeaturesConfig, setNetworkFeaturesConfig] = useState(null);

  const profileId = activeProfile?.id;
  const networkId = activeProfile?.network_id;

  // Fetch network features config if we have a networkId but no NetworkProvider
  useEffect(() => {
    if (!networkId) return;

    const fetchNetworkConfig = async () => {
      try {
        const { data, error } = await supabase
          .from('networks')
          .select('features_config')
          .eq('id', networkId)
          .single();

        if (!error && data) {
          setNetworkFeaturesConfig(data.features_config);
        }
      } catch (err) {
        console.error('Error fetching network features config:', err);
      }
    };

    fetchNetworkConfig();
  }, [networkId]);

  // Check if reactions are enabled for this network
  const reactionsEnabled = React.useMemo(() => {
    if (!networkFeaturesConfig) return true; // Default to enabled if no config
    try {
      const config = typeof networkFeaturesConfig === 'string'
        ? JSON.parse(networkFeaturesConfig)
        : networkFeaturesConfig;
      return config.reactions !== false;
    } catch (e) {
      console.error('Error parsing features_config:', e);
      return true; // Default to enabled on error
    }
  }, [networkFeaturesConfig]);

  console.log('ReactionBar: activeProfile', { activeProfile, profileId, networkId });

  // Fetch reactions on mount
  useEffect(() => {
    if (!contentType || !contentId) return;
    loadReactions();
  }, [contentType, contentId]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!contentType || !contentId || !supabase) return;

    const subscription = subscribeToReactions(
      supabase,
      contentType,
      contentId,
      () => {
        loadReactions();
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [contentType, contentId, supabase]);

  const loadReactions = async () => {
    console.log('ReactionBar: Loading reactions for', { contentType, contentId });
    const { data, error } = await fetchReactionSummary(supabase, contentType, contentId);
    console.log('ReactionBar: fetchReactionSummary result', { data, error });

    if (!error && data) {
      setReactions(data);
      console.log('ReactionBar: Set reactions', data);

      // Check if user has reacted
      if (profileId) {
        const userEmoji = Object.keys(data).find(emoji =>
          data[emoji].profileIds.includes(profileId)
        );
        setUserReaction(userEmoji || null);
        console.log('ReactionBar: User reaction', userEmoji);
      }
    } else if (error) {
      console.error('ReactionBar: Error loading reactions', error);
    }
  };

  const handleReactionClick = async (emoji) => {
    console.log('ReactionBar: handleReactionClick', { emoji, profileId, networkId });

    if (!profileId || !networkId) {
      console.warn('ReactionBar: Missing profileId or networkId', { profileId, networkId });
      return;
    }

    setLoading(true);
    handleClose();

    try {
      if (userReaction === emoji) {
        // Remove reaction if clicking same emoji
        console.log('ReactionBar: Removing reaction');
        const result = await removeReaction(supabase, profileId, contentType, contentId);
        console.log('ReactionBar: Remove result', result);
        setUserReaction(null);
      } else {
        // Add or change reaction
        console.log('ReactionBar: Adding reaction');
        const result = await addReaction(supabase, profileId, networkId, contentType, contentId, emoji);
        console.log('ReactionBar: Add result', result);
        setUserReaction(emoji);
      }

      // Reload reactions
      console.log('ReactionBar: Reloading reactions after action');
      await loadReactions();
    } catch (error) {
      console.error('ReactionBar: Error handling reaction:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleReactionHover = async (event, emoji) => {
    if (!reactions[emoji]) return;

    setTooltipAnchor(event.currentTarget);

    // Fetch profile names for this reaction
    const profileIds = reactions[emoji].profileIds;

    // For now, just show count. In future, fetch names
    setTooltipContent({
      emoji,
      names: [`${profileIds.length} ${profileIds.length === 1 ? 'person' : 'people'}`]
    });
  };

  const handleReactionLeave = () => {
    setTooltipAnchor(null);
  };

  const open = Boolean(anchorEl);
  const tooltipOpen = Boolean(tooltipAnchor);

  // Calculate sizing based on size prop
  const sizeConfig = {
    xsmall: { chipHeight: 20, fontSize: '0.65rem', iconSize: 'small', emojiSize: '1.2rem', emojiButtonSize: 32 },
    small: { chipHeight: 24, fontSize: '0.75rem', iconSize: 'small', emojiSize: '1.5rem', emojiButtonSize: 40 },
    medium: { chipHeight: 32, fontSize: '0.875rem', iconSize: 'medium', emojiSize: '1.5rem', emojiButtonSize: 40 },
    large: { chipHeight: 40, fontSize: '1rem', iconSize: 'large', emojiSize: '1.5rem', emojiButtonSize: 40 }
  };
  const config = sizeConfig[size] || sizeConfig.medium;

  const totalReactions = Object.values(reactions).reduce((sum, r) => sum + r.count, 0);

  // Don't render if reactions are disabled for this network
  if (!reactionsEnabled) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
      {/* Display existing reactions */}
      {Object.entries(reactions).map(([emoji, { count }]) => (
        <Chip
          key={emoji}
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <span style={{ fontSize: config.fontSize }}>{emoji}</span>
              <Typography variant="caption" sx={{ fontSize: config.fontSize }}>
                {count}
              </Typography>
            </Box>
          }
          size={size}
          onClick={() => handleReactionClick(emoji)}
          onMouseEnter={(e) => handleReactionHover(e, emoji)}
          onMouseLeave={handleReactionLeave}
          disabled={loading}
          sx={{
            height: config.chipHeight,
            backgroundColor: userReaction === emoji
              ? alpha(theme.palette.primary.main, 0.15)
              : alpha(theme.palette.action.hover, 0.08),
            border: userReaction === emoji
              ? `1px solid ${theme.palette.primary.main}`
              : '1px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': {
              backgroundColor: userReaction === emoji
                ? alpha(theme.palette.primary.main, 0.25)
                : alpha(theme.palette.action.hover, 0.15),
              transform: 'scale(1.05)'
            }
          }}
        />
      ))}

      {/* Add reaction button */}
      <Tooltip title="Add reaction">
        <IconButton
          size={config.iconSize}
          onClick={handleOpen}
          disabled={loading}
          sx={{
            opacity: 0.7,
            '&:hover': {
              opacity: 1,
              backgroundColor: alpha(theme.palette.action.hover, 0.08)
            }
          }}
        >
          <AddReactionOutlinedIcon fontSize={config.iconSize} />
        </IconButton>
      </Tooltip>

      {/* Emoji picker popover */}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <Paper sx={{ p: 1, maxWidth: size === 'xsmall' ? 240 : 280 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 0.5 }}>
            {EMOJI_PICKER.map((emoji) => (
              <IconButton
                key={emoji}
                onClick={() => handleReactionClick(emoji)}
                disabled={loading}
                sx={{
                  fontSize: config.emojiSize,
                  width: config.emojiButtonSize,
                  height: config.emojiButtonSize,
                  backgroundColor: userReaction === emoji
                    ? alpha(theme.palette.primary.main, 0.15)
                    : 'transparent',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.action.hover, 0.15),
                    transform: 'scale(1.2)'
                  }
                }}
              >
                {emoji}
              </IconButton>
            ))}
          </Box>
        </Paper>
      </Popover>

      {/* Reaction hover tooltip */}
      <Popover
        open={tooltipOpen}
        anchorEl={tooltipAnchor}
        onClose={handleReactionLeave}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        sx={{
          pointerEvents: 'none',
        }}
        disableRestoreFocus
      >
        <Paper sx={{ p: 1, maxWidth: 200 }}>
          <Typography variant="body2">
            {tooltipContent.emoji} {tooltipContent.names.join(', ')}
          </Typography>
        </Paper>
      </Popover>
    </Box>
  );
};

export default ReactionBar;
