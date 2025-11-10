/**
 * OnboardingChecklist Component
 * Displays new member onboarding checklist
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  LinearProgress,
  IconButton,
  Button,
  Collapse,
  Chip,
  alpha,
  useTheme,
  Tooltip
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as UncheckedIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Close as CloseIcon,
  EmojiEvents as TrophyIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseclient';
import { useAuth } from '../context/authcontext';
import { useNetwork } from '../context/networkContext';
import {
  fetchOnboardingProgress,
  dismissOnboarding,
  getChecklistItems,
  markChecklistItemComplete
} from '../api/onboarding';
import confetti from 'canvas-confetti';

/**
 * OnboardingChecklist Component
 * @param {boolean} compact - Compact view (default: false)
 */
const OnboardingChecklist = ({ compact = false }) => {
  const theme = useTheme();
  // Using global supabase client
  const navigate = useNavigate();
  const { activeProfile } = useAuth();
  const { currentNetwork } = useNetwork();

  const [progress, setProgress] = useState(null);
  const [checklistItems, setChecklistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (activeProfile?.id && currentNetwork?.id) {
      loadProgress();
    }
  }, [activeProfile?.id, currentNetwork?.id]);

  const loadProgress = async () => {
    if (!activeProfile?.id || !currentNetwork?.id) return;

    setLoading(true);
    const { data, error } = await fetchOnboardingProgress(
      supabase,
      activeProfile.id,
      currentNetwork.id
    );

    if (!error && data) {
      setProgress(data);
      setChecklistItems(getChecklistItems(data));

      // Check if just completed
      if (data.is_completed && !showCelebration) {
        triggerCelebration();
      }
    }

    setLoading(false);
  };

  const triggerCelebration = () => {
    setShowCelebration(true);
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const handleDismiss = async () => {
    if (!activeProfile?.id || !currentNetwork?.id) return;

    await dismissOnboarding(supabase, activeProfile.id, currentNetwork.id);
    setProgress(prev => ({ ...prev, is_dismissed: true }));
  };

  const handleItemClick = (item) => {
    if (!item.completed && item.route) {
      navigate(item.route);
    }
  };

  const handleManualComplete = async (itemId) => {
    if (!activeProfile?.id || !currentNetwork?.id) return;

    await markChecklistItemComplete(supabase, activeProfile.id, currentNetwork.id, itemId);
    await loadProgress();
  };

  // Don't show if dismissed or completed
  if (!progress || progress.is_dismissed || loading) {
    return null;
  }

  const completedCount = checklistItems.filter(item => item.completed).length;
  const totalCount = checklistItems.length;
  const progressPercentage = progress.progress_percentage || 0;

  return (
    <Card
      sx={{
        border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
        boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.1)}`
      }}
    >
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main
              }}
            >
              {progress.is_completed ? (
                <TrophyIcon />
              ) : (
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {completedCount}
                </Typography>
              )}
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {progress.is_completed ? '🎉 Onboarding Complete!' : 'Getting Started'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {progress.is_completed
                  ? "You're all set! Welcome to the network."
                  : `${completedCount} of ${totalCount} tasks completed`}
              </Typography>
            </Box>
          </Box>
          <Box>
            {!compact && (
              <IconButton
                size="small"
                onClick={() => setExpanded(!expanded)}
                sx={{ mr: 1 }}
              >
                {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            )}
            <IconButton size="small" onClick={handleDismiss}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* Progress Bar */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Progress
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
              {progressPercentage}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progressPercentage}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                backgroundColor: theme.palette.primary.main,
                transition: 'transform 0.4s ease'
              }
            }}
          />
        </Box>

        {/* Checklist Items */}
        <Collapse in={expanded} timeout="auto">
          <List sx={{ p: 0 }}>
            {checklistItems.map((item, index) => (
              <ListItem
                key={item.id}
                disablePadding
                sx={{
                  mb: 1,
                  borderRadius: 1,
                  overflow: 'hidden',
                  backgroundColor: item.completed
                    ? alpha(theme.palette.success.main, 0.05)
                    : 'transparent',
                  border: `1px solid ${
                    item.completed
                      ? alpha(theme.palette.success.main, 0.2)
                      : alpha(theme.palette.divider, 0.1)
                  }`
                }}
              >
                <ListItemButton
                  onClick={() => handleItemClick(item)}
                  disabled={item.completed}
                  sx={{
                    py: compact ? 1 : 1.5,
                    '&:hover': {
                      backgroundColor: !item.completed
                        ? alpha(theme.palette.primary.main, 0.05)
                        : undefined
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {item.completed ? (
                      <CheckCircleIcon sx={{ color: theme.palette.success.main }} />
                    ) : (
                      <UncheckedIcon sx={{ color: theme.palette.action.disabled }} />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: item.completed ? 400 : 500,
                          textDecoration: item.completed ? 'line-through' : 'none',
                          color: item.completed
                            ? theme.palette.text.secondary
                            : theme.palette.text.primary
                        }}
                      >
                        {item.label}
                      </Typography>
                    }
                    secondary={
                      !compact && (
                        <Typography variant="caption" color="text.secondary">
                          {item.description}
                        </Typography>
                      )
                    }
                  />
                  {!item.completed && !compact && (
                    <Chip
                      label={item.action}
                      size="small"
                      sx={{
                        height: 24,
                        fontSize: '0.75rem',
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        color: theme.palette.primary.main,
                        fontWeight: 600
                      }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            ))}
          </List>

          {/* Completed Message */}
          {progress.is_completed && (
            <Box
              sx={{
                mt: 2,
                p: 2,
                borderRadius: 2,
                backgroundColor: alpha(theme.palette.success.main, 0.1),
                border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
                textAlign: 'center'
              }}
            >
              <TrophyIcon
                sx={{
                  fontSize: 48,
                  color: theme.palette.warning.main,
                  mb: 1
                }}
              />
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                Congratulations!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You've completed all onboarding tasks. You're now fully integrated into the network!
              </Typography>
            </Box>
          )}
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default OnboardingChecklist;
