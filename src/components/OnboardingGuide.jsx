// src/components/OnboardingGuide.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Tooltip,
  Zoom,
  Chip,
  alpha,
  keyframes,
  useTheme,
  Button,
  Typography,
  Stack,
  Fade
} from '@mui/material';
import {
  ArrowForward as ArrowIcon,
  GroupAdd as GroupAddIcon,
  AdminPanelSettings as AdminIcon,
  NavigateNext as NextIcon,
  Groups as MembersIcon,
  Close as CloseIcon
} from '@mui/icons-material';

// Gentle pulse animation for highlighting
const gentlePulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(25, 118, 210, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(25, 118, 210, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(25, 118, 210, 0);
  }
`;

// Subtle glow animation
const subtleGlow = keyframes`
  0%, 100% {
    box-shadow: 0 0 5px rgba(25, 118, 210, 0.3);
  }
  50% {
    box-shadow: 0 0 20px rgba(25, 118, 210, 0.6);
  }
`;

// Gentle bounce animation for arrows
const gentleBounce = keyframes`
  0%, 20%, 50%, 80%, 100% {
    transform: translateX(0);
  }
  40% {
    transform: translateX(5px);
  }
  60% {
    transform: translateX(3px);
  }
`;

const ONBOARDING_STEPS = {
  NETWORK_LANDING: 0,    // Show guide to go to admin panel
  ADMIN_PANEL: 1,        // Show guide to go to members tab
  MEMBERS_TAB: 2,        // Show guide to invite members
  COMPLETED: 3
};

const OnboardingGuide = ({ 
  networkId, 
  isNetworkAdmin, 
  memberCount, 
  currentPage = 'network', // 'network', 'admin', 'members'
  currentAdminTab = null,   // admin tab index
  onGuideComplete,
  forceShow = false,      // Force show the guide
  onComplete             // Callback when guide is completed or dismissed
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [showGuide, setShowGuide] = useState(false);
  const [currentStep, setCurrentStep] = useState(ONBOARDING_STEPS.NETWORK_LANDING);
  const [guideDismissed, setGuideDismissed] = useState(false);

  // Check if this is a new network that needs onboarding
  useEffect(() => {
    console.log('[OnboardingGuide] Checking conditions:', {
      forceShow,
      isNetworkAdmin,
      memberCount,
      guideDismissed,
      showGuide
    });
    
    // Show guide if forced
    if (forceShow) {
      console.log('[OnboardingGuide] Force showing guide');
      setShowGuide(true);
      setGuideDismissed(false); // Reset dismissed state when forced
      return;
    }
    
    // Only show guide if:
    // 1. User is admin
    // 2. Network has very few members (1-2, likely just the creator)
    // 3. Guide hasn't been dismissed
    if (isNetworkAdmin && memberCount <= 2 && !guideDismissed) {
      // Wait 5 seconds before showing the guide
      const timer = setTimeout(() => {
        console.log('[OnboardingGuide] Auto-showing guide for admin');
        setShowGuide(true);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isNetworkAdmin, memberCount, guideDismissed, forceShow]);

  // Update step based on current page
  useEffect(() => {
    if (!showGuide || guideDismissed) return;

    if (currentPage === 'network') {
      setCurrentStep(ONBOARDING_STEPS.NETWORK_LANDING);
    } else if (currentPage === 'admin' && currentAdminTab !== 1) {
      setCurrentStep(ONBOARDING_STEPS.ADMIN_PANEL);
    } else if (currentPage === 'admin' && currentAdminTab === 1) {
      setCurrentStep(ONBOARDING_STEPS.MEMBERS_TAB);
    }
  }, [currentPage, currentAdminTab, showGuide, guideDismissed]);

  // Store dismissal in localStorage to persist across sessions
  useEffect(() => {
    const dismissed = localStorage.getItem(`onboarding-dismissed-${networkId}`);
    if (dismissed) {
      setGuideDismissed(true);
    }
  }, [networkId]);

  const handleDismissGuide = () => {
    setGuideDismissed(true);
    setShowGuide(false);
    localStorage.setItem(`onboarding-dismissed-${networkId}`, 'true');
    if (onGuideComplete) {
      onGuideComplete();
    }
    if (onComplete) {
      onComplete();
    }
  };

  const handleNextStep = () => {
    if (currentStep === ONBOARDING_STEPS.NETWORK_LANDING) {
      // Navigate to admin panel
      navigate(`/admin/${networkId}`);
    } else if (currentStep === ONBOARDING_STEPS.ADMIN_PANEL) {
      // User should click on Members tab (we'll detect this via currentAdminTab prop)
      // This step will be handled by the parent component updating currentAdminTab
    } else if (currentStep === ONBOARDING_STEPS.MEMBERS_TAB) {
      // User should find the invite button - we'll highlight it
      handleDismissGuide();
    }
  };

  // Auto-dismiss after 45 seconds if user doesn't interact
  useEffect(() => {
    if (showGuide) {
      const autoTimer = setTimeout(() => {
        handleDismissGuide();
      }, 45000);

      return () => clearTimeout(autoTimer);
    }
  }, [showGuide]);

  if (!showGuide || guideDismissed) {
    return null;
  }

  const getStepContent = () => {
    switch (currentStep) {
      case ONBOARDING_STEPS.NETWORK_LANDING:
        return {
          icon: <AdminIcon sx={{ color: 'primary.main' }} />,
          title: "Welcome to your network!",
          description: "Let's get your community started by inviting some members.",
          action: "Go to Admin Panel",
          actionIcon: <NextIcon />,
          pointer: "Click the admin button in the top navigation"
        };
      
      case ONBOARDING_STEPS.ADMIN_PANEL:
        return {
          icon: <MembersIcon sx={{ color: 'primary.main' }} />,
          title: "Almost there!",
          description: "Now let's manage your network members.",
          action: "Go to Members Tab",
          actionIcon: <NextIcon />,
          pointer: "Click on the 'Members' tab"
        };
      
      case ONBOARDING_STEPS.MEMBERS_TAB:
        return {
          icon: <GroupAddIcon sx={{ color: 'primary.main' }} />,
          title: "Perfect!",
          description: "Now you can invite people to join your network.",
          action: "Got it!",
          actionIcon: <GroupAddIcon />,
          pointer: "Look for the 'Invite Members' button"
        };
      
      default:
        return null;
    }
  };

  const stepContent = getStepContent();
  if (!stepContent) return null;

  return (
    <>
      {/* Subtle background overlay */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1200,
          pointerEvents: 'none',
          background: `linear-gradient(
            135deg, 
            ${alpha(theme.palette.primary.main, 0.02)} 0%, 
            ${alpha(theme.palette.secondary.main, 0.01)} 100%
          )`,
        }}
      />

      {/* Floating guide tooltip */}
      <Zoom in={showGuide}>
        <Box
          sx={{
            position: 'fixed',
            top: '50%',
            right: 24,
            transform: 'translateY(-50%)',
            zIndex: 1300,
            maxWidth: 350,
            p: 3,
            background: `linear-gradient(
              135deg, 
              ${theme.palette.background.paper} 0%, 
              ${alpha(theme.palette.primary.main, 0.05)} 100%
            )`,
            borderRadius: 3,
            boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.15)}`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            animation: `${gentlePulse} 3s infinite`,
          }}
        >
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {stepContent.icon}
              <Chip 
                label={`Step ${currentStep + 1} of 3`}
                size="small" 
                color="primary" 
                variant="outlined"
                sx={{ ml: 1 }}
              />
            </Box>
            <Button
              size="small"
              onClick={handleDismissGuide}
              sx={{ minWidth: 'auto', p: 0.5 }}
            >
              <CloseIcon fontSize="small" />
            </Button>
          </Box>

          {/* Content */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: theme.palette.text.primary }}>
              {stepContent.title}
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, lineHeight: 1.6, mb: 2 }}>
              {stepContent.description}
            </Typography>
            
            {/* Pointer text with animated arrow */}
            <Box sx={{ display: 'flex', alignItems: 'center', p: 2, backgroundColor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2 }}>
              <ArrowIcon 
                sx={{ 
                  color: 'primary.main', 
                  mr: 1,
                  animation: `${gentleBounce} 2s infinite`,
                }} 
              />
              <Typography variant="body2" sx={{ fontWeight: 500, color: theme.palette.primary.main }}>
                {stepContent.pointer}
              </Typography>
            </Box>
          </Box>

          {/* Action button */}
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button
              variant="text"
              size="small"
              onClick={handleDismissGuide}
              sx={{ color: theme.palette.text.secondary }}
            >
              Skip tour
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={handleNextStep}
              endIcon={stepContent.actionIcon}
              sx={{
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                '&:hover': {
                  background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                }
              }}
            >
              {stepContent.action}
            </Button>
          </Box>

          {/* Progress indicators */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, mt: 2 }}>
            {[0, 1, 2].map((step) => (
              <Box
                key={step}
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: step <= currentStep 
                    ? theme.palette.primary.main 
                    : alpha(theme.palette.primary.main, 0.2),
                  transition: 'background-color 0.3s ease',
                }}
              />
            ))}
          </Box>
        </Box>
      </Zoom>
    </>
  );
};

// Higher-order component to highlight elements during onboarding
export const WithOnboardingHighlight = ({ 
  children, 
  shouldHighlight = false, 
  highlightType = 'glow' // 'glow', 'pulse', 'border'
}) => {
  const theme = useTheme();

  if (!shouldHighlight) {
    return children;
  }

  const getHighlightStyles = () => {
    switch (highlightType) {
      case 'pulse':
        return {
          animation: `${gentlePulse} 2s infinite`,
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: -2,
            left: -2,
            right: -2,
            bottom: -2,
            background: `linear-gradient(45deg, 
              ${alpha(theme.palette.primary.main, 0.3)} 0%, 
              ${alpha(theme.palette.secondary.main, 0.2)} 100%
            )`,
            borderRadius: 'inherit',
            zIndex: -1,
          }
        };
      
      case 'border':
        return {
          border: `2px solid ${theme.palette.primary.main}`,
          borderRadius: 1,
          animation: `${subtleGlow} 2s infinite`,
        };
      
      case 'glow':
      default:
        return {
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: -3,
            left: -3,
            right: -3,
            bottom: -3,
            background: `linear-gradient(45deg, 
              ${alpha(theme.palette.warning.main, 0.2)} 0%, 
              ${alpha(theme.palette.primary.main, 0.2)} 100%
            )`,
            borderRadius: 'inherit',
            zIndex: -1,
            animation: `${subtleGlow} 1.5s ease-in-out infinite`,
          }
        };
    }
  };

  return (
    <Box sx={getHighlightStyles()}>
      {children}
    </Box>
  );
};

export default OnboardingGuide;