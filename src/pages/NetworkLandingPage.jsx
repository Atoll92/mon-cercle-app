import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams, useParams } from 'react-router-dom';
import { useAuth } from '../context/authcontext';
import { useProfile } from '../context/profileContext';
import { useTheme } from '../components/ThemeProvider';
import { useNetwork, NetworkProvider, NetworkProviderWithParams } from '../context/networkContext';
import { useApp } from '../context/appContext';
import { supabase } from '../supabaseclient';
import { useFadeIn } from '../hooks/useAnimation';
import { GridSkeleton } from '../components/LoadingSkeleton';
import NetworkHeader from '../components/NetworkHeader';
import ArticleIcon from '@mui/icons-material/Article';
import ChatIcon from '@mui/icons-material/Chat';
import TimelineIcon from '@mui/icons-material/Timeline';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AttachmentIcon from '@mui/icons-material/Attachment';

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
  useTheme as useMuiTheme
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Groups as GroupsIcon,
  Info as InfoIcon,
  Event as EventIcon,
} from '@mui/icons-material';

// Import the tab components
import MembersTab from '../components/MembersTab';
import EventsTab from '../components/EventsTab';
import NewsTab from '../components/NewsTab';
import ChatTab from '../components/ChatTab';
import SocialWallTab from '../components/SocialWallTab';
import WikiTab from '../components/WikiTab';
import AboutTab from '../components/AboutTab';
import MemberDetailsModal from '../components/MembersDetailModal';
import FilesTab from '../components/FilesTab';
import OnboardingGuide, { WithOnboardingHighlight } from '../components/OnboardingGuide';
import WelcomeMessage from '../components/WelcomeMessage';
import { getTabDescription } from '../utils/tabDescriptions';

// Simplified wrapper component that uses App context
const NetworkLandingPageWrapper = () => {
  const { networkId } = useParams();
  const { userNetworkId, fetchingNetwork } = useApp();

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
          No network found. Please make sure you are a member of a network.
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
    isAdmin: isUserAdmin
  } = useNetwork();
  
  // Initialize activeTab state (will be updated based on URL params after visibleTabs is computed)
  const [activeTab, setActiveTab] = useState(0);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [userParticipations, setUserParticipations] = useState([]);
  const [memberCount, setMemberCount] = useState(0);
  
  // Update member count when networkMembers changes
  useEffect(() => {
    if (networkMembers && networkMembers.length > 0) {
      setMemberCount(networkMembers.length);
    }
  }, [networkMembers]);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isTabsFixed, setIsTabsFixed] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [tabsTransition, setTabsTransition] = useState('none'); // 'none', 'fixing', 'unfixing'
  const [smoothTransitionProgress, setSmoothTransitionProgress] = useState(0);
  
  // Animation setup - must be at top level, not conditional
  const contentRef = useFadeIn(200);
  
  // Parse enabled tabs from network configuration
  const enabledTabs = React.useMemo(() => {
    if (!network?.enabled_tabs) {
      return ['news', 'members', 'events', 'chat', 'files', 'wiki', 'social'];
    }
    
    try {
      // Handle both new format (array) and legacy format (stringified array)
      let tabs;
      if (Array.isArray(network.enabled_tabs)) {
        // New format: already an array
        tabs = network.enabled_tabs;
      } else if (typeof network.enabled_tabs === 'string') {
        // Legacy format: stringified array
        tabs = JSON.parse(network.enabled_tabs);
      } else {
        // Fallback
        tabs = ['news', 'members', 'events', 'chat', 'files', 'wiki', 'social'];
      }
      return Array.isArray(tabs) && tabs.length > 0 ? tabs : ['news', 'members', 'events', 'chat', 'files', 'wiki', 'social'];
    } catch (e) {
      console.error('Error parsing enabled tabs:', e);
      return ['news', 'members', 'events', 'chat', 'files', 'wiki', 'social'];
    }
  }, [network?.enabled_tabs]);

  // Define all available tabs with their properties (matching admin panel IDs)
  const allTabs = [
    { id: 'news', icon: <ArticleIcon />, label: 'News' },
    { id: 'members', icon: <GroupsIcon />, label: 'Members' },
    { id: 'events', icon: <EventIcon />, label: 'Events' },
    { id: 'chat', icon: <ChatIcon />, label: 'Chat' },
    { id: 'files', icon: <AttachmentIcon />, label: 'Files' },
    { id: 'wiki', icon: <MenuBookIcon />, label: 'Wiki' },
    { id: 'social', icon: <TimelineIcon />, label: 'Social Wall' },
    // Always show About tab regardless of config
    { id: 'about', icon: <InfoIcon />, label: 'About' }
  ];

  // Filter tabs based on network configuration, preserving order from enabledTabs
  const visibleTabs = React.useMemo(() => {
    // Create tabs in the order specified by enabledTabs, then add About at the end
    const orderedTabs = enabledTabs
      .map(tabId => allTabs.find(tab => tab.id === tabId))
      .filter(tab => tab); // Remove any undefined tabs
    
    // Always add About tab at the end
    const aboutTab = allTabs.find(tab => tab.id === 'about');
    if (aboutTab && !orderedTabs.some(tab => tab.id === 'about')) {
      orderedTabs.push(aboutTab);
    }
    
    return orderedTabs.length > 0 ? orderedTabs : allTabs;
  }, [enabledTabs, allTabs]);
  
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
  
  const handleParticipationChange = (eventId, newStatus) => {
    // Update userParticipations state when status changes
    setUserParticipations(prevParticipations => {
      const existing = prevParticipations.find(p => p.event_id === eventId);
      
      if (existing) {
        // If null (removed), filter it out
        if (newStatus === null) {
          return prevParticipations.filter(p => p.event_id !== eventId);
        }
        
        // Otherwise update it
        return prevParticipations.map(p => 
          p.event_id === eventId ? { ...p, status: newStatus } : p
        );
      } else if (newStatus) {
        // Add new participation if status isn't null
        return [...prevParticipations, { event_id: eventId, status: newStatus }];
      }
      
      return prevParticipations;
    });
  };

  // State to hold post items for all members (stored as portfolio_items in database)
  const [postItems, setPostItems] = useState([]);
  
  // Handle post deletion from social wall
  const handlePostDeleted = (postId, itemType) => {
    if (itemType === 'post') {
      setPostItems(prevItems => prevItems.filter(item => item.id !== postId));
    }
  };
  
  // Check if user just joined the network or came from invitation
  useEffect(() => {
    if (!user || !network || !activeProfile) {
      console.log('[Welcome] Waiting for user, network, and profile data');
      return;
    }
    
    const checkNewMember = async () => {
      // Check if we came from an invitation link first
      const searchParams = new URLSearchParams(location.search);
      const fromInvite = searchParams.get('from_invite') === 'true';
      
      console.log('[Welcome] Checking welcome conditions:', {
        fromInvite,
        userId: user?.id,
        activeProfileId: activeProfile?.id,
        networkId: network?.id,
        networkMembersCount: networkMembers.length
      });
      
      console.log('[Welcome] Session storage check:', {
        recentJoinKey: `recent_join_${network.id}_${activeProfile.id}`,
        hasRecentJoinFlag: sessionStorage.getItem(`recent_join_${network.id}_${activeProfile.id}`)
      });
      
      // If coming from invite, show welcome immediately (but only once)
      if (fromInvite) {
        const welcomeShownKey = `welcome_shown_${network.id}_${activeProfile.id}`;
        const hasShownWelcome = localStorage.getItem(welcomeShownKey);
        
        console.log('[Welcome] From invite - checking if already shown:', {
          welcomeShownKey,
          hasShownWelcome
        });
        
        // Only show welcome if it hasn't been shown before
        if (!hasShownWelcome) {
          console.log('[Welcome] Showing welcome message from invite!');
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
            console.log('[Welcome] Admin onboarding requested after network creation');
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
              console.log('[Welcome] New network detected, showing admin onboarding');
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
          
          console.log('[Welcome] Member join checks:', {
            isRecentJoin,
            isRecentJoinUserNetwork,
            profileCreatedFlag,
            userNetworkCreatedFlag,
            recentJoinKey,
            userNetworkJoinKey,
            profileCreatedKey,
            userNetworkCreatedKey
          });
          
          if (isRecentJoin || isRecentJoinUserNetwork || profileCreatedFlag || userNetworkCreatedFlag) {
            console.log('[Welcome] Showing welcome message for recent join!');
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

  // Fetch user's event participations on component mount
  useEffect(() => {
    const fetchUserParticipations = async () => {
      if (!user || !events || events.length === 0) {
        console.log("SKIPPING participation fetch - missing data:", { 
          user: !!user, 
          events: !!events, 
          eventsLength: events?.length || 0 
        });
        return;
      }
      
      console.log("=== START PARTICIPATION FETCH ===");
      console.log("User ID:", user.id);
      console.log("Events count:", events.length);
      console.log("Event IDs for fetch:", events.map(e => e.id));
      
      try {
        // Refactor query to always return all possible participations
        const { data, error } = await supabase
          .from('event_participations')
          .select('*')
          .eq('profile_id', activeProfile.id);
        
        if (error) {
          console.error('Error fetching user participations:', error);
          return;
        }
        
        console.log("FULL Fetched participations:", data);
        
        // Filter to just participations for events in our current view
        const relevantParticipations = data.filter(p => 
          events.some(e => e.id === p.event_id)
        );
        
        console.log("FILTERED Fetched user participations:", relevantParticipations);
        console.log("Mapped Status by Event:", relevantParticipations.map(p => ({
          event_id: p.event_id,
          event_title: events.find(e => e.id === p.event_id)?.title || 'Unknown',
          status: p.status
        })));
        
        // Always set the state, even if empty
        setUserParticipations(relevantParticipations);
        
        console.log("=== END PARTICIPATION FETCH ===");
      } catch (err) {
        console.error('Error in fetchUserParticipations:', err);
      }
    };
    
    fetchUserParticipations();
  }, [user, events]);

  // Fetch post items for all network members (stored as portfolio_items in database)
  useEffect(() => {
    const fetchPostItems = async () => {
      if (!networkMembers || !Array.isArray(networkMembers) || networkMembers.length === 0) {
        console.log("Skipping post fetch - networkMembers not ready:", networkMembers);
        return;
      }
      
      try {
        console.log("Fetching posts (stored as portfolio_items in the database)");
        // Fetch all portfolio items from the database (will display as posts in UI)
        const { data, error } = await supabase
          .from('portfolio_items')
          .select('*')
          .in('profile_id', networkMembers.map(m => m.id));
          
        if (error) throw error;
        
        console.log('Fetched posts from database:', data); // Debug log
        
        // Add member info to each post item
        const itemsWithMemberInfo = (data || []).map(item => {
          const member = Array.isArray(networkMembers) ? networkMembers.find(m => m.id === item.profile_id) : null;
          return {
            ...item,
            itemType: 'post', // Item from portfolio_items table displayed as post
            createdAt: item.created_at,
            memberName: member?.full_name || 'Network Member',
            memberAvatar: member?.profile_picture_url || '',
            memberId: member?.id,
            // Preserve all media fields from the database
            media_url: item.media_url,
            media_type: item.media_type,
            media_metadata: item.media_metadata,
            // Ensure image_url is properly used - database field is still image_url
            image_url: item.image_url || item.file_url || ''
          };
        });
        
        console.log('Portfolio items transformed to posts with member info:', itemsWithMemberInfo); // Debug log
        setPostItems(itemsWithMemberInfo);
      } catch (err) {
        console.error('Error fetching post items:', err);
      }
    };
    
    fetchPostItems();
  }, [networkMembers]);

  // Store initial order of items to prevent reordering after load
  const [initialItemOrder, setInitialItemOrder] = useState(null);
  
  // Prepare social wall items
  const socialWallItems = React.useMemo(() => {
    // Create arrays for news and post items
    const newsItems = networkNews ? networkNews.map(item => ({
      ...item,
      itemType: 'news',
      createdAt: item.created_at,
      stableId: `news-${item.id}` // Add stable ID
    })) : [];
    
    // Log the post items before combining
    console.log('Using post items in socialWallItems:', postItems);
    
    // Add stable IDs to post items
    const postItemsWithIds = postItems.map(item => ({
      ...item,
      stableId: `post-${item.id}` // Add stable ID
    }));
    
    // Combine news and post items
    let combinedFeed = [...newsItems, ...postItemsWithIds];
    
    // If we have an initial order, use it to maintain stable ordering
    if (initialItemOrder && initialItemOrder.length > 0) {
      // Create a map for quick lookup
      const itemMap = new Map();
      combinedFeed.forEach(item => {
        itemMap.set(item.stableId, item);
      });
      
      // First, add items in their original order
      const orderedItems = [];
      initialItemOrder.forEach(stableId => {
        const item = itemMap.get(stableId);
        if (item) {
          orderedItems.push(item);
          itemMap.delete(stableId); // Remove from map to track what's left
        }
      });
      
      // Then add any new items at the beginning (they'll be the newest)
      const newItems = Array.from(itemMap.values());
      newItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      combinedFeed = [...newItems, ...orderedItems];
    } else {
      // Initial sort by creation date
      combinedFeed.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      // Store the initial order
      if (combinedFeed.length > 0) {
        const order = combinedFeed.map(item => item.stableId);
        setInitialItemOrder(order);
      }
    }
    
    // Log the final combined feed
    console.log('Final social wall items:', combinedFeed);
    
    return combinedFeed;
  }, [networkNews, postItems, initialItemOrder]);

  // Handle scroll to make tabs sticky with ultra smooth transition
  useEffect(() => {
    let transitionTimeout;
    let animationFrame;
    
    const handleScroll = () => {
      const tabsContainer = document.getElementById('tabs-original-position');
      if (tabsContainer) {
        const rect = tabsContainer.getBoundingClientRect();
        const headerHeight = 80; // NetworkHeader height
        const scrollY = window.scrollY;
        
        // Calculate scroll progress for smooth transitions with extended range
        const maxScroll = 400; // Extended for more gradual transition
        const progress = Math.min(Math.max(scrollY / maxScroll, 0), 1);
        setScrollProgress(progress);
        
        // Calculate smooth transition progress based on distance to trigger point
        const distanceToTrigger = Math.max(rect.top - headerHeight, 0);
        const transitionRange = 60; // Pixels over which to smooth the transition
        const smoothProgress = Math.min(Math.max(1 - (distanceToTrigger / transitionRange), 0), 1);
        setSmoothTransitionProgress(smoothProgress);
        
        // Use requestAnimationFrame for smoother state updates
        if (animationFrame) cancelAnimationFrame(animationFrame);
        animationFrame = requestAnimationFrame(() => {
          // If the tabs would go above the header, make them fixed
          if (rect.top <= headerHeight && !isTabsFixed) {
            clearTimeout(transitionTimeout);
            setTabsTransition('fixing');
            setIsTabsFixed(true);
            
            // Reset transition state after animation completes
            transitionTimeout = setTimeout(() => {
              setTabsTransition('none');
            }, 400); // Increased duration for smoother animation
          } else if (rect.top > headerHeight + 20 && isTabsFixed) { // Add hysteresis
            clearTimeout(transitionTimeout);
            setTabsTransition('unfixing');
            setIsTabsFixed(false);
            
            // Reset transition state after animation completes
            transitionTimeout = setTimeout(() => {
              setTabsTransition('none');
            }, 400);
          }
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
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
            Back to Dashboard
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
            Network Not Found
          </Typography>
          <Typography variant="body1" gutterBottom>
            The network you're looking for doesn't exist or you don't have permission to view it.
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh' }}>
      {/* Network Header */}
      <NetworkHeader />
      
      {/* Full-width Background Header - Extended to include tabs area */}
      {network && (
        <Box sx={{
          position: 'fixed',
          width: '100%',
          minHeight: '390px', // Increased height to accommodate tabs overlay
          paddingTop: '80px', // Account for fixed header
          paddingBottom: '60px', // Space for tabs overlay
          backgroundImage: network.background_image_url 
            ? `url(${network.background_image_url})` 
            : 'linear-gradient(135deg, #4568dc 0%, #b06ab3 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
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
          },
          '& > *': {
            position: 'relative',
            zIndex: 2
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '30px',
            background: 'linear-gradient(to top, rgba(0, 0, 0, 0.1) 0%, transparent 100%)',
            zIndex: 3,
            pointerEvents: 'none'
          }
        }}>
        </Box>
      )}
      
      {/* Original tabs section - normal position overlaying background */}
      <Box
        id="tabs-original-position"
        maxWidth="lg"
        sx={{
          mt: 40,
          mx: 'auto',
          px: 6
        }}
      >
        <Container maxWidth="lg" sx={{
          borderRadius: 2,
          width: 'auto',
          mx: 'auto',
          marginTop: '-60px', // Negative margin to overlay the background image
          position: 'relative',
          zIndex: 100, // Above background image
          opacity: 1 - (smoothTransitionProgress * 0.8), // Gradual fade based on proximity
          transform: `translateY(${smoothTransitionProgress * -30}px) scale(${1 - (smoothTransitionProgress * 0.02)})`,
          transition: tabsTransition !== 'none' 
            ? 'opacity 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)' 
            : 'opacity 0.1s ease-out, transform 0.1s ease-out',
          pointerEvents: isTabsFixed ? 'none' : 'auto',
          willChange: 'opacity, transform',
          backgroundColor: darkMode 
            ? alpha('#121212', 0.65 + (scrollProgress * 0.25) + (smoothTransitionProgress * 0.1)) 
            : alpha('#ffffff', 0.65 + (scrollProgress * 0.25) + (smoothTransitionProgress * 0.1)),
          backdropFilter: `blur(${25 + (scrollProgress * 15) + (smoothTransitionProgress * 10)}px) saturate(${180 + (scrollProgress * 40) + (smoothTransitionProgress * 20)}%)`,
          WebkitBackdropFilter: `blur(${25 + (scrollProgress * 15) + (smoothTransitionProgress * 10)}px) saturate(${180 + (scrollProgress * 40) + (smoothTransitionProgress * 20)}%)`,
          borderBottom: `1px solid ${darkMode 
            ? alpha('#ffffff', 0.08) 
            : alpha('#000000', 0.05)}`,
          boxShadow: darkMode 
            ? `0 12px 40px ${alpha('#000000', 0.5)}, inset 0 1px 0 ${alpha('#ffffff', 0.06)}` 
            : `0 8px 32px ${alpha('#000000', 0.1)}, inset 0 1px 0 ${alpha('#ffffff', 0.8)}`,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: darkMode
              ? `radial-gradient(ellipse at top, ${alpha('#2196f3', 0.08)} 0%, transparent 70%)`
              : `radial-gradient(ellipse at top, ${alpha('#2196f3', 0.04)} 0%, transparent 70%)`,
            pointerEvents: 'none',
          },
        }}>
          <Paper 
            elevation={0}
            sx={{ 
              borderRadius: 0,
              overflow: 'hidden',
              background: 'transparent',
              backdropFilter: 'none',
              border: 'none',
              boxShadow: 'none',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              sx={{
                '& .MuiTab-root': {
                  color: muiTheme.palette.custom.fadedText,
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  letterSpacing: '0.01em',
                  textTransform: 'none',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  borderRadius: '8px',
                  mx: 0.5,
                  minHeight: 52,
                  '&:hover': {
                    color: muiTheme.palette.custom.lightText,
                    background: darkMode 
                      ? alpha('#ffffff', 0.06)
                      : alpha('#000000', 0.04),
                    transform: 'translateY(-1px)',
                  },
                  '&.Mui-selected': {
                    color: muiTheme.palette.custom.lightText,
                    fontWeight: 600,
                    background: darkMode 
                      ? alpha('#90caf9', 0.12)
                      : alpha(muiTheme.palette.primary.main, 0.08),
                  },
                  // Make tabs take full width on desktop
                  [muiTheme.breakpoints.up('md')]: {
                    minWidth: 0,
                    flex: 1,
                  },
                },
                // Enhanced indicator styling
                '& .MuiTabs-indicator': {
                  backgroundColor: darkMode ? '#90caf9' : muiTheme.palette.primary.main,
                  height: 3,
                  borderRadius: '2px 2px 0 0',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                },
                '& .MuiTabs-scroller': {
                  '&::-webkit-scrollbar': {
                    display: 'none',
                  },
                  '-ms-overflow-style': 'none',
                  'scrollbar-width': 'none',
                  px: 1,
                  [muiTheme.breakpoints.up('md')]: {
                    '& .MuiTabs-flexContainer': {
                      width: '100%',
                    },
                  },
                },
                '& .MuiTabs-scrollButtons': {
                  '&.Mui-disabled': {
                    opacity: 0.3,
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
        </Container>
      </Box>

      {/* Fixed tabs section - appears when scrolled */}
      <Box
        sx={{
          position: 'fixed',
          top: '80px',
          left: 0,
          right: 0,
          zIndex: 1250,
          backgroundColor: darkMode 
            ? alpha('#121212', 0.8 + (smoothTransitionProgress * 0.05)) 
            : alpha('#ffffff', 0.8 + (smoothTransitionProgress * 0.05)),
          backdropFilter: `blur(${30 + (smoothTransitionProgress * 10)}px) saturate(${220 + (smoothTransitionProgress * 30)}%)`,
          WebkitBackdropFilter: `blur(${30 + (smoothTransitionProgress * 10)}px) saturate(${220 + (smoothTransitionProgress * 30)}%)`,
          borderBottom: `1px solid ${darkMode 
            ? alpha('#ffffff', 0.12 + (smoothTransitionProgress * 0.03)) 
            : alpha('#000000', 0.08 + (smoothTransitionProgress * 0.02))}`,
          boxShadow: darkMode 
            ? `0 ${8 + (smoothTransitionProgress * 4)}px ${32 + (smoothTransitionProgress * 8)}px ${alpha('#000000', 0.4 + (smoothTransitionProgress * 0.1))}, inset 0 1px 0 ${alpha('#ffffff', 0.08 + (smoothTransitionProgress * 0.02))}` 
            : `0 ${8 + (smoothTransitionProgress * 4)}px ${32 + (smoothTransitionProgress * 8)}px ${alpha('#000000', 0.12 + (smoothTransitionProgress * 0.03))}, inset 0 1px 0 ${alpha('#ffffff', 0.9)}`,
          transform: tabsTransition === 'unfixing' 
            ? 'translateY(-120%) scale(0.98)' 
            : `translateY(${smoothTransitionProgress * -5}px) scale(${0.98 + (smoothTransitionProgress * 0.02)})`,
          opacity: tabsTransition === 'unfixing' 
            ? 0 
            : Math.max(smoothTransitionProgress, isTabsFixed ? 1 : 0),
          visibility: isTabsFixed || tabsTransition === 'unfixing' || smoothTransitionProgress > 0.1 ? 'visible' : 'hidden',
          transition: tabsTransition !== 'none' 
            ? 'all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)' 
            : 'opacity 0.1s ease-out, transform 0.1s ease-out, backdrop-filter 0.1s ease-out',
          pointerEvents: isTabsFixed && tabsTransition !== 'unfixing' ? 'auto' : 'none',
          willChange: 'opacity, transform, backdrop-filter',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: darkMode
                ? `linear-gradient(180deg, ${alpha('#1e1e1e', 0.2)} 0%, transparent 100%)`
                : `linear-gradient(180deg, ${alpha('#ffffff', 0.3)} 0%, transparent 100%)`,
              pointerEvents: 'none',
              zIndex: -1,
            },
        }}
      >
        <Container maxWidth="lg" sx={{ px: 0 }}>
            <Paper 
              ref={contentRef}
              elevation={0}
              sx={{ 
                width: '100%', 
                borderRadius: 0,
                overflow: 'hidden',
                background: 'transparent',
                backdropFilter: 'none',
                border: 'none',
                boxShadow: 'none',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
                sx={{
                  '& .MuiTab-root': {
                    color: muiTheme.palette.custom.fadedText,
                    fontWeight: 500,
                    fontSize: '0.875rem',
                    letterSpacing: '0.01em',
                    textTransform: 'none',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    borderRadius: '8px',
                    mx: 0.5,
                    minHeight: 52,
                    '&:hover': {
                      color: muiTheme.palette.custom.lightText,
                      background: darkMode 
                        ? alpha('#ffffff', 0.06)
                        : alpha('#000000', 0.04),
                      transform: 'translateY(-1px)',
                    },
                    '&.Mui-selected': {
                      color: muiTheme.palette.custom.lightText,
                      fontWeight: 600,
                      background: darkMode 
                        ? alpha('#90caf9', 0.12)
                        : alpha(muiTheme.palette.primary.main, 0.08),
                    },
                    // Make tabs take full width on desktop
                    [muiTheme.breakpoints.up('md')]: {
                      minWidth: 0,
                      flex: 1,
                    },
                  },
                  // Enhanced indicator styling
                  '& .MuiTabs-indicator': {
                    backgroundColor: darkMode ? '#90caf9' : muiTheme.palette.primary.main,
                    height: 3,
                    borderRadius: '2px 2px 0 0',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  },
                  '& .MuiTabs-scroller': {
                    '&::-webkit-scrollbar': {
                      display: 'none',
                    },
                    '-ms-overflow-style': 'none',
                    'scrollbar-width': 'none',
                    px: 1,
                    [muiTheme.breakpoints.up('md')]: {
                      '& .MuiTabs-flexContainer': {
                        width: '100%',
                      },
                    },
                  },
                  '& .MuiTabs-scrollButtons': {
                    '&.Mui-disabled': {
                      opacity: 0.3,
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
          </Container>
        </Box>


      {/* Main content container */}
      <Container maxWidth="lg" sx={{ mb: 4, position: 'relative', zIndex: 1050 }}>        
        {/* Content area with subtle animation */}
        <Box
          sx={{
            p: { xs: 2, sm: 3 },
            pt: isTabsFixed ? '80px' : { xs: 3, sm: 3 }, // Consistent top padding
            minHeight: '600px', // Ensure enough content to scroll and test sticky behavior
            animation: 'fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
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
          }}
        >
          {/* Tab description - inline below tabs, same width as content */}
          {currentTabId && (
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                mb: 3, // Same margin bottom as top padding creates even spacing
                backgroundColor: darkMode 
                  ? alpha('#000000', 0.4)
                  : alpha('#ffffff', 0.7),
                backdropFilter: 'blur(8px)',
                border: `1px solid ${darkMode 
                  ? alpha('#ffffff', 0.1)
                  : alpha('#000000', 0.1)}`,
                borderRadius: 2,
                boxShadow: darkMode
                  ? '0 4px 20px rgba(0,0,0,0.3)'
                  : '0 2px 8px rgba(0,0,0,0.06)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <Tooltip 
                  title={`Information about the ${visibleTabs[activeTab]?.label} tab`}
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
                  {getTabDescription(currentTabId, network?.tab_descriptions)}
                </Typography>
              </Box>
            </Paper>
          )}

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
          userParticipations={userParticipations}
          onParticipationChange={handleParticipationChange}
          network={network}
          darkMode={darkMode} // Pass dark mode to events tab
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
          socialWallItems={socialWallItems}
          networkMembers={networkMembers}
          darkMode={darkMode} // Pass dark mode to social wall tab
          isAdmin={isUserAdmin}
          networkId={network.id}
          onPostDeleted={handlePostDeleted}
        />
      )}

      {currentTabId === 'wiki' && (
        <WikiTab
          networkId={network.id}
          isUserMember={isUserMember}
          darkMode={darkMode} // Pass dark mode to wiki tab
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
        </Box>
      
      {/* Member details modal */}
      <MemberDetailsModal
        open={showMemberModal}
        onClose={() => setShowMemberModal(false)}
        member={selectedMember}
        posts={selectedMember ? postItems.filter(item => item.profile_id === selectedMember.id) : []}
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
            You're not a member of this network
          </Typography>
          <Typography variant="body1" gutterBottom>
            Contact a network administrator to request joining this network.
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
          <Button
            variant="contained"
            size="small"
            onClick={() => {
              // Clear welcome shown flag
              const welcomeShownKey = `welcome_shown_${network?.id}_${user?.id}`;
              localStorage.removeItem(welcomeShownKey);
              localStorage.removeItem(`onboarding-dismissed-${network?.id}`);
              console.log('[Debug] Cleared welcome flags, reloading...');
              window.location.reload();
            }}
            sx={{ mb: 1, display: 'block' }}
          >
            Reset Welcome
          </Button>
          <Button
            variant="contained"
            size="small"
            color="secondary"
            onClick={() => {
              console.log('[Debug] Manually showing welcome message');
              setShowWelcomeMessage(true);
            }}
            sx={{ mb: 1, display: 'block' }}
          >
            Show Welcome
          </Button>
          <Button
            variant="contained"
            size="small"
            color="info"
            onClick={() => {
              console.log('[Debug] Setting profile created flag for testing');
              localStorage.setItem(`profile_created_${network?.id}_${activeProfile?.id}`, 'true');
              console.log('[Debug] Flag set, reloading...');
              window.location.reload();
            }}
            sx={{ mb: 1, display: 'block' }}
          >
            Test New Member
          </Button>
          <Button
            variant="contained"
            size="small"
            color="warning"
            onClick={() => {
              console.log('[Debug] Simulating from_invite URL parameter');
              window.location.href = window.location.pathname + '?from_invite=true';
            }}
          >
            Test from_invite
          </Button>
        </Box>
      )}
      </Container>
    </Box>
  );
}

// Export the wrapper component instead of the base component
export default NetworkLandingPageWrapper;