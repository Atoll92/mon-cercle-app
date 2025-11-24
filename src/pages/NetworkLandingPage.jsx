import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams, useParams } from 'react-router-dom';
import { useAuth } from '../context/authcontext';
import { useProfile } from '../context/profileContext';
import { useTheme } from '../components/ThemeProvider';
import { useNetwork, NetworkProvider, NetworkProviderWithParams } from '../context/networkContext';
import { useTranslation } from '../hooks/useTranslation';
import { useApp } from '../context/appContext';
import { supabase } from '../supabaseclient';
import { getCourses } from '../api/courses';
import { useFadeIn } from '../hooks/useAnimation';
import { useIsMobile } from '../hooks/useIsMobile';
import { GridSkeleton } from '../components/LoadingSkeleton';
import NetworkHeader from '../components/NetworkHeader';
import { Campaign as AnnouncementIcon } from '@mui/icons-material';
import ChatIcon from '@mui/icons-material/Chat';
import TimelineIcon from '@mui/icons-material/Timeline';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AttachmentIcon from '@mui/icons-material/Attachment';
import SchoolIcon from '@mui/icons-material/School';
import FavoriteIcon from '@mui/icons-material/Favorite';

import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  Tabs,
  Tab,
  Tooltip,
  alpha,
  useTheme as useMuiTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Fade,
  Backdrop
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Groups as GroupsIcon,
  Info as InfoIcon,
  Event as EventIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

// Import the tab components
import MembersTab from '../components/MembersTab';
import EventsTab from '../components/EventsTab';
import NewsTab from '../components/NewsTab';
import ChatTab from '../components/ChatTab';
import SocialWallTab from '../components/SocialWallTab';
import WikiTab from '../components/WikiTab';
import CoursesTab from '../components/CoursesTab';
import AboutTab from '../components/AboutTab';
import MemberDetailsModal from '../components/MembersDetailModal';
import FilesTab from '../components/FilesTab';
import DonationTab from '../components/DonationTab';
import OnboardingGuide from '../components/OnboardingGuide';
import WelcomeMessage from '../components/WelcomeMessage';
import { getTabDescription } from '../utils/tabDescriptions';

// Simplified wrapper component that uses App context
const NetworkLandingPageWrapper = () => {
  const { networkId } = useParams();
  const { userNetworkId, fetchingNetwork } = useApp();
  const { t } = useTranslation();

  // Show loading while fetching user's network
  if (!networkId && fetchingNetwork) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <GridSkeleton items={6} columns={3} />
      </Container>
    );
  }

  // Determine which network ID to use
  const effectiveNetworkId = networkId || userNetworkId;

  if (!effectiveNetworkId) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">
          {t('dashboard.network.noNetworkFound')}
        </Alert>
      </Container>
    );
  }

  // Use the appropriate provider based on whether we have a URL param
  if (networkId) {
    // Public access with URL param - use existing NetworkProviderWithParams
    return (
      <NetworkProviderWithParams>
        <NetworkLandingPage />
      </NetworkProviderWithParams>
    );
  } else {
    // Authenticated access without URL param - use NetworkProvider directly
    return (
      <NetworkProvider networkId={effectiveNetworkId}>
        <NetworkLandingPage />
      </NetworkProvider>
    );
  }
};

function NetworkLandingPage() {
  const { t, language } = useTranslation();
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  const { darkMode } = useTheme();
  const muiTheme = useMuiTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Use the network context instead of local state and API calls
  const {
    network,
    members: networkMembers,
    events,
    news: networkNews,
    files,
    loading,
    error,
    userRole,
    isAdmin: isUserAdmin,
    enabledTabs,
    setEvents
  } = useNetwork();
  
  // Initialize activeTab state (will be updated based on URL params after visibleTabs is computed)
  const [activeTab, setActiveTab] = useState(0);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [memberCount, setMemberCount] = useState(0);
  
  // Update member count when networkMembers changes
  useEffect(() => {
    if (networkMembers && networkMembers.length > 0) {
      setMemberCount(networkMembers.length);
    }
  }, [networkMembers]);

  // Check for published courses when network changes
  useEffect(() => {
    const checkPublishedCourses = async () => {
      if (!network?.id) return;

      try {
        const result = await getCourses(supabase, network.id, { status: 'published' });
        console.log('Courses check result:', result);
        if (!result.error && result.data && result.data.length > 0) {
          console.log('Found published courses:', result.data.length);
          setHasPublishedCourses(true);
        } else {
          console.log('No published courses found or error:', result.error);
          setHasPublishedCourses(false);
        }
      } catch (err) {
        console.error('Error checking published courses:', err);
        setHasPublishedCourses(false);
      } finally {
        setCoursesChecked(true);
      }
    };

    checkPublishedCourses();
  }, [network?.id]);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isTabsFixed, setIsTabsFixed] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [tabsTransition, setTabsTransition] = useState('none'); // 'none', 'fixing', 'unfixing'
  const [smoothTransitionProgress, setSmoothTransitionProgress] = useState(0);
  const [networkDescriptionModalOpen, setNetworkDescriptionModalOpen] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [hasPublishedCourses, setHasPublishedCourses] = useState(false);
  const [coursesChecked, setCoursesChecked] = useState(false);

  // Animation setup - must be at top level, not conditional
  // Disable animation on mobile to prevent content vanishing during scroll
  const isMobile = useIsMobile();
  const contentRef = useFadeIn(isMobile ? 0 : 200);

  // Define all available tabs with their properties (matching admin panel IDs)
  const allTabs = [
    { id: 'news', icon: <AnnouncementIcon />, label: t('dashboard.tabs.news') },
    { id: 'members', icon: <GroupsIcon />, label: t('dashboard.tabs.members') },
    { id: 'events', icon: <EventIcon />, label: t('dashboard.tabs.events') },
    { id: 'chat', icon: <ChatIcon />, label: t('dashboard.tabs.chat') },
    { id: 'files', icon: <AttachmentIcon />, label: t('dashboard.tabs.files') },
    { id: 'wiki', icon: <MenuBookIcon />, label: t('dashboard.tabs.wiki') },
    { id: 'courses', icon: <SchoolIcon />, label: t('dashboard.tabs.courses') },
    { id: 'social', icon: <TimelineIcon />, label: t('dashboard.tabs.social') },
    { id: 'donation', icon: <FavoriteIcon />, label: t('dashboard.tabs.donation') },
    // Always show About tab regardless of config
    { id: 'about', icon: <InfoIcon />, label: t('dashboard.tabs.about') }
  ];

  // Filter tabs based on network configuration, preserving order from enabledTabs
  const visibleTabs = React.useMemo(() => {
    // Use enabledTabs from context, with fallback
    let tabsToUse = enabledTabs && enabledTabs.length > 0 ? enabledTabs : ['news', 'members', 'events', 'chat', 'files', 'wiki', 'social'];

    // Auto-add courses tab if there are published courses and it's not already in the list
    if (hasPublishedCourses && !tabsToUse.includes('courses')) {
      // Insert courses tab after wiki if wiki exists, otherwise at the end
      const wikiIndex = tabsToUse.indexOf('wiki');
      if (wikiIndex !== -1) {
        tabsToUse = [...tabsToUse.slice(0, wikiIndex + 1), 'courses', ...tabsToUse.slice(wikiIndex + 1)];
      } else {
        tabsToUse = [...tabsToUse, 'courses'];
      }
    }

    // Create tabs in the order specified by enabledTabs, then add About at the end
    const orderedTabs = tabsToUse
      .map(tabId => allTabs.find(tab => tab.id === tabId))
      .filter(tab => {
        if (!tab) return false;
        // Special handling for donation tab - only show if HelloAsso URL is configured
        if (tab.id === 'donation') {
          return !!network?.helloasso_url;
        }
        // Special handling for courses tab - only show if there are published courses
        if (tab.id === 'courses') {
          return hasPublishedCourses;
        }
        return true;
      });

    // Always add About tab at the end
    const aboutTab = allTabs.find(tab => tab.id === 'about');
    if (aboutTab && !orderedTabs.some(tab => tab.id === 'about')) {
      orderedTabs.push(aboutTab);
    }

    return orderedTabs.length > 0 ? orderedTabs : allTabs;
  }, [enabledTabs, allTabs, network?.helloasso_url, hasPublishedCourses]);
  
  // Helper function to get tab index from tab id within visible tabs
  const getTabIndexFromId = React.useCallback((tabId) => {
    const index = visibleTabs.findIndex(tab => tab.id === tabId);
    return index >= 0 ? index : 0;
  }, [visibleTabs]);
  
  // Set initial tab from URL when visibleTabs is ready
  React.useEffect(() => {
    if (visibleTabs.length > 0) {
      const tabParam = searchParams.get('tab');
      if (tabParam) {
        const index = getTabIndexFromId(tabParam);
        setActiveTab(index);
      }
    }
  }, [visibleTabs.length, searchParams, getTabIndexFromId]);
  
  // Update active tab based on URL params and visible tabs (for browser navigation)
  React.useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      const newIndex = getTabIndexFromId(tabParam);
      if (newIndex !== activeTab) {
        setActiveTab(newIndex);
      }
    }
  }, [searchParams, getTabIndexFromId, activeTab]);
  
  // Use the global darkMode state for members tab
  const membersTabDarkMode = darkMode;
  
  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue);
    // Update URL with the tab name
    const tabId = visibleTabs[newValue]?.id;
    if (tabId) {
      setSearchParams({ tab: tabId });
    }
  };
  
  // Get the current tab ID based on the active tab index
  const currentTabId = visibleTabs[activeTab]?.id || 'members';
  
  const isUserMember = user && network && userRole !== null;
  
  const handleMemberSelect = (member) => {
    setSelectedMember(member);
    setShowMemberModal(true);
  };
  


  // Check if user just joined the network or came from invitation
  useEffect(() => {
    if (!user || !network || !activeProfile) {
      return;
    }
    
    const checkNewMember = async () => {
      // Check if we came from an invitation link first
      const searchParams = new URLSearchParams(location.search);
      const fromInvite = searchParams.get('from_invite') === 'true';

      // If coming from invite, show welcome immediately (but only once)
      if (fromInvite) {
        const welcomeShownKey = `welcome_shown_${network.id}_${activeProfile.id}`;
        const hasShownWelcome = localStorage.getItem(welcomeShownKey);

        // Only show welcome if it hasn't been shown before
        if (!hasShownWelcome) {
          // Add a small delay to ensure page is fully loaded
          setTimeout(() => {
            setShowWelcomeMessage(true);
            localStorage.setItem(welcomeShownKey, 'true');
          }, 1500);
        }
        
        // Clear the from_invite parameter from URL
        searchParams.delete('from_invite');
        const newUrl = `${location.pathname}${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
        window.history.replaceState({}, '', newUrl);
        return;
      }
      
      // Check if admin just created this network
      if (isUserAdmin) {
        // Check if onboarding has been dismissed for this network
        const onboardingDismissedKey = `onboarding-dismissed-${network.id}`;
        const isOnboardingDismissed = localStorage.getItem(onboardingDismissedKey);
        
        if (!isOnboardingDismissed) {
          const showOnboardingKey = `show_admin_onboarding_${network.id}_${activeProfile.id}`;
          const shouldShowOnboarding = sessionStorage.getItem(showOnboardingKey) === 'true';
          
          if (shouldShowOnboarding) {
            setTimeout(() => {
              setShowOnboarding(true);
            }, 2000);
            
            // Clear the flag
            sessionStorage.removeItem(showOnboardingKey);
          } else if (network.created_at) {
            // Fallback: Check if this is a new network (created recently by admin)
            const createdAt = new Date(network.created_at);
            const now = new Date();
            const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
            
            if (createdAt > tenMinutesAgo && networkMembers.length <= 2) {
              setTimeout(() => {
                setShowOnboarding(true);
              }, 3000);
            }
          }
        }
      }
      
      // For regular members, check if they recently joined
      if (!isUserAdmin) {
        // Check if we've already shown the welcome message
        const welcomeShownKey = `welcome_shown_${network.id}_${activeProfile.id}`;
        const hasShownWelcome = localStorage.getItem(welcomeShownKey);
        
        if (!hasShownWelcome) {
          // Check session storage for recent join flag (profile-specific)
          const recentJoinKey = `recent_join_${network.id}_${activeProfile.id}`;
          const isRecentJoin = sessionStorage.getItem(recentJoinKey) === 'true';
          
          // Check for user+network based flag (more robust)
          const userNetworkJoinKey = `recent_join_user_${user.id}_network_${network.id}`;
          const isRecentJoinUserNetwork = sessionStorage.getItem(userNetworkJoinKey) === 'true';
          
          // Also check for a timestamp-based fallback for recently created profiles
          const profileCreatedKey = `profile_created_${network.id}_${activeProfile.id}`;
          const profileCreatedFlag = localStorage.getItem(profileCreatedKey) === 'true';
          
          // Check user+network created flag
          const userNetworkCreatedKey = `profile_created_user_${user.id}_network_${network.id}`;
          const userNetworkCreatedFlag = localStorage.getItem(userNetworkCreatedKey) === 'true';

          if (isRecentJoin || isRecentJoinUserNetwork || profileCreatedFlag || userNetworkCreatedFlag) {
            setTimeout(() => {
              setShowWelcomeMessage(true);
              localStorage.setItem(welcomeShownKey, 'true');
            }, 1500);
            
            // Clear all the flags
            sessionStorage.removeItem(recentJoinKey);
            sessionStorage.removeItem(userNetworkJoinKey);
            localStorage.removeItem(profileCreatedKey);
            localStorage.removeItem(userNetworkCreatedKey);
          }
        }
      }
    };
    
    // Run check after a delay to ensure data is loaded
    const timer = setTimeout(checkNewMember, 500);
    return () => clearTimeout(timer);
  }, [user, network, networkMembers, activeProfile, isUserAdmin, location]);




  // Handle scroll to make tabs sticky with ultra smooth transition
  useEffect(() => {
    // Check if mobile
    const isMobile = window.innerWidth < 600; // Material-UI's sm breakpoint
    
    if (isMobile) {
      // Always fixed on mobile
      setIsTabsFixed(true);
      setSmoothTransitionProgress(1);
      return;
    }
    
    let transitionTimeout;
    let animationFrame;
    let ticking = false;
    
    // Calculate the fixed trigger point based on background height
    const backgroundHeight = 220; // From minHeight in background Box
    const headerHeight = 80; // NetworkHeader height
    const triggerPoint = backgroundHeight + headerHeight - 40; // 40px before tabs would go above header
    
    const updateScrollState = () => {
      try {
        const scrollY = window.scrollY || window.pageYOffset || 0;
        
        // Calculate scroll progress for smooth transitions with extended range
        const maxScroll = 400;
        const progress = Math.min(Math.max(scrollY / maxScroll, 0), 1);
        setScrollProgress(progress);
        
        // Calculate smooth transition progress based on scroll position relative to trigger
        const distanceToTrigger = Math.max(triggerPoint - scrollY, 0);
        const transitionRange = 100;
        const smoothProgress = Math.min(Math.max(1 - (distanceToTrigger / transitionRange), 0), 1);
        setSmoothTransitionProgress(smoothProgress);
        
        // More robust trigger logic using scroll position instead of element position
        // Add small hysteresis to prevent jitter
        const hysteresis = isTabsFixed ? -10 : 10;
        const shouldBeFixed = scrollY >= (triggerPoint + hysteresis);
        
        if (shouldBeFixed && !isTabsFixed) {
          // Switching to fixed
          clearTimeout(transitionTimeout);
          setTabsTransition('fixing');
          setIsTabsFixed(true);
          
          // Reset transition state after animation completes
          transitionTimeout = setTimeout(() => {
            setTabsTransition('none');
          }, 500);
        } else if (!shouldBeFixed && isTabsFixed) {
          // Switching back to original position
          clearTimeout(transitionTimeout);
          setTabsTransition('unfixing');
          setIsTabsFixed(false);
          
          // Reset transition state after animation completes
          transitionTimeout = setTimeout(() => {
            setTabsTransition('none');
          }, 500);
        }
        
        // Reset throttling flag
        ticking = false;
      } catch (error) {
        ticking = false;
      }
    };

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateScrollState);
        ticking = true;
      }
    };

    // Initial call to set correct state
    handleScroll();

    const handleResize = () => {
      const newIsMobile = window.innerWidth < 600;
      if (newIsMobile) {
        setIsTabsFixed(true);
        setSmoothTransitionProgress(1);
      } else {
        // Recalculate on desktop resize
        handleScroll();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      clearTimeout(transitionTimeout);
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [isTabsFixed]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <GridSkeleton items={6} columns={3} />
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Button 
            variant="contained" 
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/dashboard')}
          >
            {t('dashboard.network.backToDashboard')}
          </Button>
        </Box>
      </Container>
    );
  }
  
  if (!network) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper 
          sx={{ 
            p: 3, 
            textAlign: 'center',
            bgcolor: muiTheme.palette.background.paper,
            color: muiTheme.palette.custom.lightText
          }}
        >
          <Typography variant="h5" component="h1" gutterBottom>
            {t('dashboard.network.networkNotFound')}
          </Typography>
          <Typography variant="body1" gutterBottom>
            {t('dashboard.network.noPermission')}
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/dashboard')}
          >
            {t('dashboard.network.backToDashboard')}
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh' }}>
      {/* Network Header */}
      <NetworkHeader />
      
      {/* Compact Background Header */}
      {network && (
        <Box sx={{
          position: 'relative',
          width: '100%',
          minHeight: { xs: '180px', sm: '220px' }, // Significantly reduced height
          mt: 0, // No need for margin with sticky header
          pb: '60px', // Add padding at bottom to allow tabs to extend below
          backgroundImage: network.background_image_url 
            ? `url(${network.background_image_url})` 
            : 'linear-gradient(135deg, #4568dc 0%, #b06ab3 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          overflow: 'visible', // Allow tabs to extend beyond
          boxShadow: darkMode
            ? 'inset 0 -40px 60px -20px rgba(0, 0, 0, 0.4)'
            : 'inset 0 -40px 60px -20px rgba(0, 0, 0, 0.2)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: darkMode 
              ? 'linear-gradient(180deg, rgba(0, 0, 0, 0.05) 0%, rgba(0, 0, 0, 0.1) 70%, rgba(0, 0, 0, 0.15) 100%)'
              : 'linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.1) 70%, rgba(255, 255, 255, 0.05) 100%)',
            zIndex: 1
          }
        }}>
          {/* Container for tabs */}
          <Box
            sx={{
              position: 'relative',
              zIndex: 2,
              maxWidth: 'lg',
              width: '100%',
              mx: 'auto',
              px: { xs: 2, sm: 6 },
              pt: { xs: 2, sm: 3 }, // Reduced top padding
              pb: 4,
              display: 'flex',
              alignItems: 'flex-end', // Align to bottom for cleaner tab positioning
              minHeight: { xs: '120px', sm: '160px' }, // Ensure proper spacing for tabs
            }}
          >
            
            {/* Tabs section - positioned in the middle of background */}
            <Box
              id="tabs-original-position"
              sx={{
                position: 'absolute',
                top: '50%', // Position tabs in the middle of the background
                left: 0,
                right: 0,
                transform: `translateY(-50%) translateY(${smoothTransitionProgress * -20}px) scale(${1 - (smoothTransitionProgress * 0.01)})`, // Center vertically with smoother scroll effects
                display: { xs: 'none', sm: 'block' }, // Hide on mobile
                opacity: 1 - (smoothTransitionProgress * 0.8), // Gradual fade based on proximity
                transition: tabsTransition !== 'none' 
                  ? 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1), transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)' 
                  : 'opacity 0.2s ease-out, transform 0.2s ease-out',
                pointerEvents: isTabsFixed ? 'none' : 'auto',
                willChange: 'opacity, transform',
              }}
            >
          <Paper 
            elevation={0}
            sx={{ 
              borderRadius: '12px',
              overflow: 'hidden',
              position: 'relative',
              // Strong background for better contrast
              backgroundColor: darkMode 
                ? alpha('#000000', 0.9 + (scrollProgress * 0.05)) 
                : alpha('#ffffff', 0.95 + (scrollProgress * 0.03)),
              backdropFilter: `blur(${20 + (scrollProgress * 8)}px) saturate(150%)`,
              WebkitBackdropFilter: `blur(${20 + (scrollProgress * 8)}px) saturate(150%)`,
              border: `1px solid ${darkMode 
                ? alpha('#ffffff', 0.15) 
                : alpha('#000000', 0.08)}`,
              boxShadow: darkMode 
                ? `0 16px 40px ${alpha('#000000', 0.7)}, 0 0 0 1px ${alpha('#ffffff', 0.05)}, inset 0 1px 0 ${alpha('#ffffff', 0.1)}` 
                : `0 16px 40px ${alpha('#000000', 0.12)}, 0 0 0 1px ${alpha('#000000', 0.04)}, inset 0 1px 0 ${alpha('#ffffff', 0.9)}`,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              // Add strong overlay for image protection
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: darkMode
                  ? `linear-gradient(135deg, ${alpha('#0a0a0a', 0.3)} 0%, ${alpha('#1a1a1a', 0.2)} 50%, ${alpha('#0a0a0a', 0.1)} 100%)`
                  : `linear-gradient(135deg, ${alpha('#ffffff', 0.6)} 0%, ${alpha('#f8f9fa', 0.4)} 50%, ${alpha('#ffffff', 0.2)} 100%)`,
                pointerEvents: 'none',
                zIndex: 1,
                borderRadius: '12px',
              },
            }}
          >
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              sx={{
                position: 'relative',
                zIndex: 2,
                px: 2,
                py: 1,
                '& .MuiTab-root': {
                  // High contrast text for readability
                  color: darkMode 
                    ? alpha('#ffffff', 0.9)
                    : alpha('#000000', 0.85),
                  fontWeight: 500,
                  fontSize: '0.9rem',
                  letterSpacing: '0.02em',
                  textTransform: 'none',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  borderRadius: '10px',
                  mx: 0.5,
                  my: 0.5,
                  minHeight: 48,
                  minWidth: 'auto',
                  padding: '8px 16px',
                  // Clean, minimal style without individual borders
                  background: 'transparent',
                  border: 'none',
                  boxShadow: 'none',
                  // Remove text shadow for cleaner look
                  textShadow: 'none',
                  // Icon and text styling
                  '& .MuiTab-iconWrapper': {
                    marginBottom: '2px',
                    fontSize: '1.1rem',
                  },
                  '&:hover': {
                    color: darkMode 
                      ? '#ffffff'
                      : '#000000',
                    // Subtle hover background
                    background: darkMode 
                      ? alpha('#ffffff', 0.08)
                      : alpha('#000000', 0.06),
                    transform: 'translateY(-1px)',
                    // Clean hover shadow
                    boxShadow: darkMode
                      ? `0 4px 12px ${alpha('#000000', 0.3)}`
                      : `0 4px 12px ${alpha('#000000', 0.1)}`,
                  },
                  '&.Mui-selected': {
                    color: darkMode 
                      ? '#ffffff'
                      : '#000000',
                    fontWeight: 600,
                    // Clean selected background with high contrast
                    background: darkMode 
                      ? alpha('#ffffff', 0.12)
                      : alpha('#000000', 0.08),
                    // Clean selected shadow
                    boxShadow: darkMode
                      ? `0 2px 8px ${alpha('#000000', 0.4)}, inset 0 1px 0 ${alpha('#ffffff', 0.15)}`
                      : `0 2px 8px ${alpha('#000000', 0.15)}, inset 0 1px 0 ${alpha('#ffffff', 0.8)}`,
                  },
                  // Responsive design
                  [muiTheme.breakpoints.up('md')]: {
                    minWidth: 0,
                    flex: 1,
                    fontSize: '0.95rem',
                  },
                },
                // Clean, prominent indicator
                '& .MuiTabs-indicator': {
                  backgroundColor: darkMode 
                    ? '#90caf9' 
                    : muiTheme.palette.primary.main,
                  height: 4,
                  borderRadius: '4px 4px 0 0',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  // Add subtle glow for better visibility
                  boxShadow: darkMode
                    ? `0 0 8px ${alpha('#90caf9', 0.6)}`
                    : `0 0 8px ${alpha(muiTheme.palette.primary.main, 0.4)}`,
                },
                '& .MuiTabs-scroller': {
                  // Hide scrollbar but keep functionality
                  '&::-webkit-scrollbar': {
                    display: 'none',
                  },
                  msOverflowStyle: 'none',
                  scrollbarWidth: 'none',
                  // Better responsive handling
                  [muiTheme.breakpoints.up('md')]: {
                    '& .MuiTabs-flexContainer': {
                      width: '100%',
                    },
                  },
                },
                '& .MuiTabs-scrollButtons': {
                  // Style scroll buttons for mobile
                  color: darkMode 
                    ? alpha('#ffffff', 0.7)
                    : alpha('#000000', 0.6),
                  '&.Mui-disabled': {
                    opacity: 0.3,
                  },
                  '&:hover': {
                    backgroundColor: darkMode 
                      ? alpha('#ffffff', 0.08)
                      : alpha('#000000', 0.04),
                  },
                  [muiTheme.breakpoints.up('md')]: {
                    display: 'none',
                  },
                },
              }}
            >
              {visibleTabs.map((tab) => (
                <Tab key={tab.id} icon={tab.icon} label={tab.label} />
              ))}
            </Tabs>
          </Paper>
            </Box>
          </Box>
        </Box>
      )}

      {/* Fixed tabs section - appears when scrolled (hidden on mobile, using MobileMenu instead) */}
      <Box
        sx={{
          display: { xs: 'none', sm: 'block' }, // Hide on mobile - using MobileMenu instead
          position: 'fixed',
          top: '80px',
          left: 0,
          right: 0,
          zIndex: 1200,
          width: '100%',
          backgroundImage: network?.background_image_url
            ? `url(${network.background_image_url})`
            : 'linear-gradient(135deg, #4568dc 0%, #b06ab3 100%)',
          backgroundColor: 'transparent',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderBottom: `1px solid ${darkMode
            ? alpha('#ffffff', 0.12)
            : alpha('#000000', 0.12)}`,
          boxShadow: darkMode
            ? `0 4px 12px ${alpha('#000000', 0.4)}`
            : `0 4px 12px ${alpha('#000000', 0.15)}`,
          transform: tabsTransition === 'unfixing'
            ? `translateY(-100%) scale(0.95)`
            : tabsTransition === 'fixing'
            ? `translateY(${-10 + (smoothTransitionProgress * 10)}px) scale(${0.95 + (smoothTransitionProgress * 0.05)})`
            : isTabsFixed
            ? 'translateY(0) scale(1)'
            : `translateY(${smoothTransitionProgress * -10}px) scale(${0.95 + (smoothTransitionProgress * 0.05)})`,
          opacity: tabsTransition === 'unfixing'
            ? Math.max(1 - smoothTransitionProgress, 0)
            : tabsTransition === 'fixing'
            ? Math.min(smoothTransitionProgress + 0.3, 1)
            : isTabsFixed
            ? 1
            : Math.max(smoothTransitionProgress, 0),
          visibility: (isTabsFixed || tabsTransition !== 'none' || smoothTransitionProgress > 0.05) ? 'visible' : 'hidden',
          transition: tabsTransition !== 'none'
            ? 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
            : 'opacity 0.2s ease-out, transform 0.2s ease-out',
          pointerEvents: isTabsFixed && tabsTransition !== 'unfixing' ? 'auto' : 'none',
          willChange: 'opacity, transform',
        }}
      >
        <Box sx={{
          maxWidth: 'lg',
          mx: 'auto',
          px: 3
        }}>
            <Paper
              ref={contentRef}
              elevation={0}
              sx={{
                width: '100%',
                borderRadius: '8px',
                overflow: 'visible',
                position: 'relative',
                zIndex: 10,
                backgroundColor: darkMode
                  ? alpha('#000000', 0.9 + (scrollProgress * 0.05))
                  : alpha('#ffffff', 0.95 + (scrollProgress * 0.03)),
                backdropFilter: `blur(${20 + (scrollProgress * 8)}px) saturate(150%)`,
                WebkitBackdropFilter: `blur(${20 + (scrollProgress * 8)}px) saturate(150%)`,
                border: `1px solid ${darkMode
                  ? alpha('#ffffff', 0.15)
                  : alpha('#000000', 0.08)}`,
                boxShadow: darkMode
                  ? `0 16px 40px ${alpha('#000000', 0.7)}, 0 0 0 1px ${alpha('#ffffff', 0.05)}, inset 0 1px 0 ${alpha('#ffffff', 0.1)}`
                  : `0 16px 40px ${alpha('#000000', 0.12)}, 0 0 0 1px ${alpha('#000000', 0.04)}, inset 0 1px 0 ${alpha('#ffffff', 0.9)}`,
                minHeight: '60px',
                display: 'flex',
                alignItems: 'center',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: darkMode
                    ? `linear-gradient(135deg, ${alpha('#0a0a0a', 0.3)} 0%, ${alpha('#1a1a1a', 0.2)} 50%, ${alpha('#0a0a0a', 0.1)} 100%)`
                    : `linear-gradient(135deg, ${alpha('#ffffff', 0.6)} 0%, ${alpha('#f8f9fa', 0.4)} 50%, ${alpha('#ffffff', 0.2)} 100%)`,
                  pointerEvents: 'none',
                  zIndex: 1,
                  borderRadius: '8px',
                },
              }}
            >
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
                sx={{
                  position: 'relative',
                  zIndex: 2,
                  width: '100%',
                  px: 2,
                  py: 0.5,
                  minHeight: 56,
                  '& .MuiTab-root': {
                    color: darkMode ? '#ffffff' : '#000000',
                    fontWeight: 500,
                    fontSize: '0.9rem',
                    letterSpacing: '0.02em',
                    textTransform: 'none',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    borderRadius: '10px',
                    mx: 0.5,
                    my: 0.5,
                    minHeight: 48,
                    minWidth: 'auto',
                    padding: '8px 16px',
                    background: 'transparent',
                    border: 'none',
                    boxShadow: 'none',
                    textShadow: 'none',
                    '& .MuiTab-iconWrapper': {
                      marginBottom: '0px',
                      marginRight: '8px',
                      fontSize: '1.1rem',
                    },
                    '&:hover': {
                      color: darkMode ? '#ffffff' : '#000000',
                      background: darkMode ? alpha('#ffffff', 0.15) : alpha('#000000', 0.08),
                      transform: 'translateY(-1px)',
                      boxShadow: `0 4px 12px ${alpha('#000000', 0.3)}`,
                    },
                    '&.Mui-selected': {
                      color: darkMode ? '#ffffff' : '#000000',
                      fontWeight: 600,
                      background: darkMode ? alpha('#ffffff', 0.2) : alpha('#000000', 0.12),
                      boxShadow: `0 2px 8px ${alpha('#000000', 0.4)}, inset 0 1px 0 ${alpha('#ffffff', 0.2)}`,
                    },
                    [muiTheme.breakpoints.up('md')]: {
                      minWidth: 0,
                      flex: 1,
                      fontSize: '0.95rem',
                    },
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: darkMode ? '#90caf9' : muiTheme.palette.primary.main,
                    height: 4,
                    borderRadius: '4px 4px 0 0',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    // Add subtle glow for better visibility
                    boxShadow: {
                      xs: darkMode 
                        ? `0 0 8px ${alpha('#90caf9', 0.6)}` 
                        : `0 0 8px ${alpha(muiTheme.palette.primary.main, 0.4)}`,
                      sm: darkMode 
                        ? `0 0 8px ${alpha('#90caf9', 0.6)}` 
                        : `0 0 8px ${alpha(muiTheme.palette.primary.main, 0.4)}`
                    },
                  },
                  '& .MuiTabs-scroller': {
                    // Hide scrollbar but keep functionality
                    '&::-webkit-scrollbar': {
                      display: 'none',
                    },
                    msOverflowStyle: 'none',
                    scrollbarWidth: 'none',
                    // Better responsive handling
                    [muiTheme.breakpoints.up('md')]: {
                      '& .MuiTabs-flexContainer': {
                        width: '100%',
                      },
                    },
                  },
                  '& .MuiTabs-scrollButtons': {
                    // Style scroll buttons for mobile with proper theme support
                    color: {
                      xs: darkMode ? alpha('#ffffff', 0.7) : alpha('#000000', 0.6),
                      sm: darkMode ? alpha('#ffffff', 0.7) : alpha('#000000', 0.6) // Theme-aware colors on desktop
                    },
                    '&.Mui-disabled': {
                      opacity: 0.3,
                    },
                    '&:hover': {
                      backgroundColor: {
                        xs: darkMode 
                          ? alpha('#ffffff', 0.08)
                          : alpha('#000000', 0.04),
                        sm: darkMode 
                          ? alpha('#ffffff', 0.08)
                          : alpha('#000000', 0.04)
                      },
                    },
                    [muiTheme.breakpoints.up('md')]: {
                      display: 'none',
                    },
                  },
                }}
              >
                {visibleTabs.map((tab) => (
                  <Tab key={tab.id} icon={tab.icon} label={tab.label} />
                ))}
              </Tabs>
            </Paper>
          </Box>
        </Box>


      {/* Main content container - positioned to straddle the border */}
      <Container maxWidth="lg" sx={{ 
        mb: 4, 
        position: 'relative', 
        zIndex: 1050,
        mt: { xs: '-180px', sm: '-80px' }, // Pull container up to straddle the border for headers
        px: { xs: 0, sm: 2}
      }}>        
        {/* Content area with integrated tab header */}
        <Box
          sx={{
            p: { xs: '2 0', sm: 3 },
            pt: {
              xs: '30px', // Mobile: normal padding with sticky header
              sm: isTabsFixed ? '30px' : '30px' // Desktop: consistent padding
            },
            minHeight: '600px', // Ensure enough content to scroll and test sticky behavior
            // Only apply animation on desktop (sm and up)
            animation: { xs: 'none', sm: 'fadeInContent 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.1s both' },
            '@keyframes fadeInContent': {
              '0%': {
                opacity: 0,
                transform: 'translateY(10px)',
              },
              '100%': {
                opacity: 1,
                transform: 'translateY(0)',
              },
            },
          }}
        >
          {/* Modern Tab Header - more compact and streamlined */}
          {currentTabId && (
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2.5, sm: 3 }, // Reduced padding
                mb: 0, // No spacing between header and content
                backgroundColor: darkMode 
                  ? alpha('#000000', 0.95)
                  : alpha('#ffffff', 0.98),
                backdropFilter: 'blur(20px) saturate(160%)',
                WebkitBackdropFilter: 'blur(20px) saturate(160%)',
                border: `1px solid ${darkMode 
                  ? alpha('#ffffff', 0.15)
                  : alpha('#000000', 0.08)}`,
                borderRadius: { xs: 2, sm: 2.5 }, // Slightly smaller radius for modern look
                boxShadow: darkMode
                  ? '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1)'
                  : '0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.05)',
                // Disable animation on mobile to prevent content vanishing
                animation: { xs: 'none', sm: 'fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1)' },
                '@keyframes fadeInUp': {
                  '0%': {
                    opacity: 0,
                    transform: 'translateY(20px)',
                  },
                  '100%': {
                    opacity: 1,
                    transform: 'translateY(0)',
                  },
                },
                position: 'relative', // For the ::before pseudo-element
              }}
            >
              {/* Title section with network info */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                {visibleTabs[activeTab]?.icon && (
                  <Box 
                    sx={{ 
                      color: darkMode 
                        ? alpha('#90caf9', 0.9)
                        : alpha('#1976d2', 0.8),
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '1.2rem',
                    }} 
                  >
                    {visibleTabs[activeTab].icon}
                  </Box>
                )}
                <Typography
                  variant="h6"
                  sx={{
                    color: darkMode 
                      ? alpha('#ffffff', 0.95)
                      : alpha('#000000', 0.9),
                    fontSize: { xs: '1.1rem', lg: '1.25rem' },
                    fontWeight: 600,
                    flex: 1,
                  }}
                >
                  {visibleTabs[activeTab]?.label}
                </Typography>
                
                {/* Network Description Button - compact and modern */}
                {network.description && (
                  <Tooltip 
                    title={network.description.length > 50 ? network.description.substring(0, 50) + '...' : network.description}
                    placement="bottom-end"
                    arrow
                  >
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setNetworkDescriptionModalOpen(true)}
                      sx={{
                        minWidth: 'auto',
                        px: 2,
                        py: 0.5,
                        borderRadius: 2,
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        textTransform: 'none',
                        borderColor: darkMode 
                          ? alpha('#90caf9', 0.5)
                          : alpha('#1976d2', 0.5),
                        color: darkMode 
                          ? alpha('#90caf9', 0.9)
                          : alpha('#1976d2', 0.8),
                        backgroundColor: 'transparent',
                        backdropFilter: 'blur(8px)',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: darkMode ? '#90caf9' : '#1976d2',
                          backgroundColor: darkMode 
                            ? alpha('#90caf9', 0.08)
                            : alpha('#1976d2', 0.08),
                          transform: 'translateY(-1px)',
                        }
                      }}
                      startIcon={<InfoIcon sx={{ fontSize: '0.9rem' }} />}
                    >
                      {t('dashboard.network.aboutNetwork')}
                    </Button>
                  </Tooltip>
                )}
              </Box>

              {/* Description section */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <Tooltip 
                  title={t('dashboard.network.informationAboutTab', { tabName: visibleTabs[activeTab]?.label })}
                  placement="top"
                  arrow
                >
                  <InfoIcon 
                    sx={{ 
                      color: darkMode 
                        ? alpha('#90caf9', 0.8)
                        : alpha('#1976d2', 0.7),
                      fontSize: '1.1rem',
                      mt: 0.1, // Slight vertical alignment with text
                      flexShrink: 0, // Prevent icon from shrinking
                      cursor: 'help',
                      transition: 'color 0.2s ease',
                      '&:hover': {
                        color: darkMode 
                          ? '#90caf9'
                          : '#1976d2',
                      }
                    }} 
                  />
                </Tooltip>
                <Typography
                  variant="body2"
                  sx={{
                    color: darkMode
                      ? alpha('#ffffff', 0.9)
                      : alpha('#000000', 0.8),
                    fontSize: { xs: '0.875rem', lg: '1rem' },
                    lineHeight: 1.6,
                    fontWeight: { xs: 400, lg: 500 },
                    flex: 1, // Take remaining space
                  }}
                >
                  {getTabDescription(currentTabId, network?.tab_descriptions, language)}
                </Typography>
              </Box>
            </Paper>
          )}

          {/* Tab Content Section - no spacing from header */}
          <Box>
            {/* Conditionally render the appropriate tab component */}
            {currentTabId === 'members' && (
              <MembersTab 
                networkMembers={networkMembers}
                user={user}
                activeProfile={activeProfile}
                isUserAdmin={isUserAdmin}
                networkId={network.id}
                loading={loading}
                darkMode={membersTabDarkMode}
                onMemberSelect={handleMemberSelect}
                onMemberCountChange={setMemberCount}
              />
            )}

            {currentTabId === 'events' && (
              <EventsTab
                events={events}
                user={user}
                isUserAdmin={isUserAdmin}
                network={network}
                darkMode={darkMode} // Pass dark mode to events tab
                activeProfile={activeProfile}
                setEvents={setEvents}
              />
            )}

            {currentTabId === 'news' && (
              <NewsTab
                networkNews={networkNews}
                networkMembers={networkMembers}
                darkMode={darkMode} // Pass dark mode to news tab
              />
            )}

            {currentTabId === 'chat' && (
              <ChatTab
                networkId={network.id}
                isUserMember={isUserMember}
                darkMode={darkMode} // Pass dark mode to chat tab
              />
            )}

            {currentTabId === 'social' && (
              <SocialWallTab
                darkMode={darkMode} // Pass dark mode to social wall tab
                isAdmin={isUserAdmin}
                networkId={network.id}
              />
            )}

            {currentTabId === 'wiki' && (
              <WikiTab
                networkId={network.id}
                isUserMember={isUserMember}
                darkMode={darkMode} // Pass dark mode to wiki tab
              />
            )}

            {currentTabId === 'courses' && (
              <CoursesTab
                networkId={network.id}
                isUserMember={isUserMember}
                darkMode={darkMode} // Pass dark mode to courses tab
              />
            )}

            {currentTabId === 'about' && (
              <AboutTab
                network={network}
                networkMembers={networkMembers}
                isUserAdmin={isUserAdmin}
                darkMode={darkMode} // Pass dark mode to about tab
              />
            )}

            {currentTabId === 'files' && (
              <FilesTab
                networkId={network.id}
                isUserMember={isUserMember}
                darkMode={darkMode} // Pass dark mode to files tab
                files={files}
              />
            )}

            {currentTabId === 'donation' && (
              <DonationTab
                helloAssoUrl={network?.helloasso_url}
                darkMode={darkMode} // Pass dark mode to donation tab
              />
            )}
          </Box>
        </Box>
      
      {/* Member details modal */}
      <MemberDetailsModal
        open={showMemberModal}
        onClose={() => setShowMemberModal(false)}
        member={selectedMember}
        posts={[]} // Modal can fetch its own posts if needed
        darkMode={membersTabDarkMode}
      />
      
      {!isUserMember && user && (
        <Paper 
          sx={{ 
            p: 3, 
            mt: 3, 
            backgroundColor: darkMode ? alpha('#1976d2', 0.2) : 'primary.light', 
            color: muiTheme.palette.custom.lightText,
            border: darkMode ? `1px solid ${alpha('#1976d2', 0.5)}` : 'none',
          }}
        >
          <Typography variant="h6" gutterBottom>
            {t('dashboard.network.notMember')}
          </Typography>
          <Typography variant="body1" gutterBottom>
            {t('dashboard.network.contactAdmin')}
          </Typography>
        </Paper>
      )}
      
      {/* Welcome Message Dialog */}
      <WelcomeMessage
        open={showWelcomeMessage}
        onClose={() => setShowWelcomeMessage(false)}
        network={network}
        user={user}
        onStartTour={() => {
          setShowWelcomeMessage(false);
          setShowOnboarding(true);
        }}
      />

      {/* Onboarding Guide */}
      <OnboardingGuide
        networkId={network?.id}
        isNetworkAdmin={isUserAdmin}
        memberCount={memberCount}
        currentPage="network"
        forceShow={showOnboarding}
        onComplete={() => setShowOnboarding(false)}
      />
      
      {/* Debug button for testing - remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <Box sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999 }}>
          {/* Toggle button */}
          <Button
            variant="contained"
            size="small"
            onClick={() => setShowDebugPanel(!showDebugPanel)}
            sx={{
              mb: 1,
              display: 'block',
              backgroundColor: showDebugPanel ? 'error.main' : 'primary.main',
              '&:hover': {
                backgroundColor: showDebugPanel ? 'error.dark' : 'primary.dark',
              }
            }}
          >
            {showDebugPanel ? 'Hide Debug' : 'Show Debug'}
          </Button>

          {/* Debug panel - only show when toggled */}
          {showDebugPanel && (
            <>
              <Button
                variant="contained"
                size="small"
                onClick={() => {
                  // Clear welcome shown flag
                  const welcomeShownKey = `welcome_shown_${network?.id}_${user?.id}`;
                  localStorage.removeItem(welcomeShownKey);
                  localStorage.removeItem(`onboarding-dismissed-${network?.id}`);
                  window.location.reload();
                }}
                sx={{ mb: 1, display: 'block' }}
              >
                {t('dashboard.debug.resetWelcome')}
              </Button>
              <Button
                variant="contained"
                size="small"
                color="secondary"
                onClick={() => {
                  setShowWelcomeMessage(true);
                }}
                sx={{ mb: 1, display: 'block' }}
              >
                {t('dashboard.debug.showWelcome')}
              </Button>
              <Button
                variant="contained"
                size="small"
                color="info"
                onClick={() => {
                  localStorage.setItem(`profile_created_${network?.id}_${activeProfile?.id}`, 'true');
                  window.location.reload();
                }}
                sx={{ mb: 1, display: 'block' }}
              >
                {t('dashboard.debug.testNewMember')}
              </Button>
              <Button
                variant="contained"
                size="small"
                color="warning"
                onClick={() => {
                  window.location.href = window.location.pathname + '?from_invite=true';
                }}
              >
                {t('dashboard.debug.testFromInvite')}
              </Button>
            </>
          )}
        </Box>
      )}
      </Container>

      {/* Network Description Modal */}
      <Dialog
        open={networkDescriptionModalOpen}
        onClose={() => setNetworkDescriptionModalOpen(false)}
        slots={{
          backdrop: Backdrop,
        }}
        slotProps={{
          backdrop: {
            sx: {
              backgroundColor: darkMode 
                ? 'rgba(0, 0, 0, 0.8)' 
                : 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(12px)',
            }
          },
          paper: {
            sx: {
              maxWidth: '700px',
              borderRadius: 3,
              backgroundColor: darkMode 
                ? alpha('#000000', 0.95)
                : '#ffffff',
              backgroundImage: darkMode
                ? 'none'
                : 'linear-gradient(to bottom right, #ffffff, #f8f9fa)',
              border: darkMode 
                ? `1px solid ${alpha('#ffffff', 0.2)}`
                : 'none',
              boxShadow: darkMode
                ? '0 24px 48px rgba(0, 0, 0, 0.8)'
                : '0 24px 48px rgba(0, 0, 0, 0.2)',
            }
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            borderBottom: `1px solid ${darkMode 
              ? alpha('#ffffff', 0.1)
              : alpha('#000000', 0.08)}`,
            pb: 2,
            position: 'relative',
            pr: 6,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box 
              sx={{ 
                width: 48,
                height: 48,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                background: network?.background_image_url 
                  ? `url(${network.background_image_url})` 
                  : 'linear-gradient(135deg, #4568dc 0%, #b06ab3 100%)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                color: '#ffffff',
                fontWeight: 700,
                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
              }} 
            >
              {!network?.background_image_url && network?.name?.charAt(0)?.toUpperCase()}
            </Box>
            <Box>
              <Typography 
                variant="h5" 
                component="h2"
                sx={{
                  fontWeight: 600,
                  color: darkMode 
                    ? alpha('#ffffff', 0.95)
                    : alpha('#000000', 0.9),
                  mb: 0.5,
                }}
              >
                {network?.name}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: darkMode 
                    ? alpha('#ffffff', 0.6)
                    : alpha('#000000', 0.6),
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontWeight: 500,
                }}
              >
                {t('dashboard.network.networkDescription')}
              </Typography>
            </Box>
          </Box>
          <IconButton
            aria-label="close"
            onClick={() => setNetworkDescriptionModalOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: darkMode 
                ? alpha('#ffffff', 0.6)
                : alpha('#000000', 0.5),
              '&:hover': {
                backgroundColor: darkMode 
                  ? alpha('#ffffff', 0.08)
                  : alpha('#000000', 0.04),
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3, pb: 2 }}>
          <Typography
            variant="body1"
            sx={{
              color: darkMode 
                ? alpha('#ffffff', 0.9)
                : alpha('#000000', 0.87),
              lineHeight: 1.8,
              fontSize: '1.1rem',
              whiteSpace: 'pre-wrap',
              mb: 3,
            }}
          >
            {network?.description}
          </Typography>

          {/* Network info section */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              backgroundColor: darkMode 
                ? alpha('#4568dc', 0.08)
                : alpha('#4568dc', 0.06),
              borderRadius: 2,
              border: `1px solid ${darkMode 
                ? alpha('#4568dc', 0.2)
                : alpha('#4568dc', 0.15)}`,
            }}
          >
            <Typography 
              variant="subtitle2" 
              sx={{ 
                color: darkMode 
                  ? '#90caf9'
                  : '#4568dc',
                fontWeight: 600,
                mb: 1,
              }}
            >
              {t('dashboard.network.networkInformation')}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: darkMode 
                  ? alpha('#ffffff', 0.8)
                  : alpha('#000000', 0.7),
                lineHeight: 1.6,
              }}
            >
              {t('dashboard.network.networkInfoText', { networkName: network?.name })}
            </Typography>
          </Paper>
        </DialogContent>
        
        <DialogActions 
          sx={{ 
            px: 3, 
            py: 2,
            borderTop: `1px solid ${darkMode 
              ? alpha('#ffffff', 0.1)
              : alpha('#000000', 0.08)}`,
          }}
        >
          <Button 
            onClick={() => setNetworkDescriptionModalOpen(false)}
            variant="contained"
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              px: 3,
              backgroundColor: darkMode 
                ? alpha('#90caf9', 0.9)
                : undefined,
              '&:hover': {
                backgroundColor: darkMode 
                  ? '#90caf9'
                  : undefined,
              }
            }}
          >
            {t('dashboard.network.gotIt')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// Export the wrapper component instead of the base component
export default NetworkLandingPageWrapper;