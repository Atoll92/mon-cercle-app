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
  
  // Animation setup - must be at top level, not conditional
  const headerRef = useFadeIn(0);
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
    <>
      {/* Network Header */}
      <NetworkHeader />
      
      {/* Full-width Background Header */}
      {network && (
        <Box sx={{
          width: '100%',
          minHeight: '200px',
          backgroundImage: network.background_image_url 
            ? `url(${network.background_image_url})` 
            : 'linear-gradient(135deg, #4568dc 0%, #b06ab3 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.7)',
            zIndex: 1
          },
          '& > *': {
            position: 'relative',
            zIndex: 2
          }
        }}>
          {network.description && (
            <Typography 
              variant="h5" 
              sx={{ 
                color: darkMode ? '#ffffff' : '#333333',
                textShadow: darkMode ? '0px 2px 4px rgba(0,0,0,0.8)' : '0px 2px 4px rgba(255,255,255,0.8)',
                fontSize: { xs: '1rem', sm: '1.2rem' },
                lineHeight: 1.4,
                maxWidth: '800px',
                textAlign: 'center',
                px: 3,
                fontWeight: 400
              }}
            >
              {network.description}
            </Typography>
          )}
        </Box>
      )}
      
      <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
      
      <Paper 
        ref={contentRef}
        sx={{ 
          width: '100%', 
          mb: 3, 
          // Adjust background color based on dark mode
          backgroundColor: muiTheme.palette.background.paper,
          // Add a subtle border in dark mode to improve visibility
          border: `1px solid ${muiTheme.palette.custom.border}`,
          // Add shadow for better separation in dark mode
          boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          // Adjust text color for better contrast in dark mode
          textColor={darkMode ? "secondary" : "primary"}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            // Add custom styles for dark mode
            '& .MuiTab-root': {
              color: muiTheme.palette.custom.fadedText,
              '&.Mui-selected': {
                color: muiTheme.palette.custom.lightText,
              },
              // Make tabs take full width on desktop
              [muiTheme.breakpoints.up('md')]: {
                minWidth: 0,
                flex: 1,
              },
            },
            // Make the indicator more visible in dark mode
            '& .MuiTabs-indicator': {
              backgroundColor: darkMode ? '#90caf9' : undefined,
              height: darkMode ? 3 : undefined,
            },
            // Hide scrollbar while allowing scrolling on mobile
            '& .MuiTabs-scroller': {
              '&::-webkit-scrollbar': {
                display: 'none',
              },
              '-ms-overflow-style': 'none',
              'scrollbar-width': 'none',
              // On desktop, make tabs fill width
              [muiTheme.breakpoints.up('md')]: {
                '& .MuiTabs-flexContainer': {
                  width: '100%',
                },
              },
            },
            // Hide scroll buttons on desktop
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
    </>
  );
}

// Export the wrapper component instead of the base component
export default NetworkLandingPageWrapper;