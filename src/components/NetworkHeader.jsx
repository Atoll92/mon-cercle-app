import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Skeleton, Badge, Tooltip, alpha, Divider, Paper, Button } from '@mui/material';
import {
  Logout as LogoutIcon,
  Person as PersonIcon,
  WbSunny as SunIcon,
  NightsStay as MoonIcon,
  Campaign as AnnouncementIcon,
  Groups as GroupsIcon,
  Event as EventIcon,
  Chat as ChatIcon,
  Attachment as AttachmentIcon,
  MenuBook as MenuBookIcon,
  School as SchoolIcon,
  Timeline as TimelineIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import MailIcon from '@mui/icons-material/Mail';
import BusinessIcon from '@mui/icons-material/Business'; // Icon for network
import { useAuth } from '../context/authcontext';
import { useTheme } from '../components/ThemeProvider'; // Import directly from ThemeProvider
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDirectMessages } from '../context/directMessagesContext';
import { fetchNetworkDetails } from '../api/networks';
import { logout } from '../api/auth';
import { useProfile } from '../context/profileContext';
import { useNetworkRefresh } from '../hooks/useNetworkRefresh';
import { useNetwork } from '../context/networkContext';
import MobileMenu from './MobileMenu';

// Simple badge component for unread messages
const MessageBadge = React.memo(() => {
  const { unreadTotal, refreshConversations } = useDirectMessages();
  
  useEffect(() => {
    refreshConversations();
    
    const intervalId = setInterval(() => {
      refreshConversations();
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [refreshConversations]);
  
  return (
    <Badge 
      badgeContent={unreadTotal} 
      color="error"
      max={99}
      invisible={unreadTotal === 0}
      sx={{
        '& .MuiBadge-badge': {
          fontSize: '0.7rem',
          height: '20px',
          minWidth: '20px',
          fontWeight: 'bold',
        },
      }}
    >
      <MailIcon />
    </Badge>
  );
});

const NetworkHeader = () => {
  const { user } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme(); // Get theme context
  const location = useLocation();
  const navigate = useNavigate();
  const [networkInfo, setNetworkInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const { hasMultipleProfiles, activeProfile } = useProfile();
  const headerRef = React.useRef(null);
  

  function getNetworkIdFromUrl(pathname) {
    const urlParts = pathname.split('/');
    const networkPartIndex = urlParts.indexOf('network');
    if (networkPartIndex !== -1 && urlParts[networkPartIndex + 1]) {
      return urlParts[networkPartIndex + 1];
    }
    return null;
  }
  
  const getNetworkInfo = useCallback(async () => {
    const networkIdFromUrl = getNetworkIdFromUrl(location.pathname);
    if (!user && !networkIdFromUrl) return;
    
    try {
      setLoading(true);

      if (networkIdFromUrl) {
        const networkData = await fetchNetworkDetails(networkIdFromUrl);
        if (!networkData) return;
        setNetworkInfo(networkData);
        return;
      }
      if (!user) return;

      // For profile-aware system, use active profile's network
      if (activeProfile?.network_id) {
        // Get network details from active profile
        const networkData = await fetchNetworkDetails(activeProfile.network_id);
        if (!networkData) return;
        setNetworkInfo(networkData);
      }
    } catch (error) {
      console.error('Error fetching network info:', error);
    } finally {
      setLoading(false);
    }
  }, [user, location.pathname, activeProfile]);

  useEffect(() => {
    getNetworkInfo();
  }, [getNetworkInfo]);

  // Set CSS variable for header height
  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        const height = headerRef.current.getBoundingClientRect().height;
        document.documentElement.style.setProperty('--network-header-height', `${height}px`);
      }
    };

    // Use ResizeObserver to track all size changes (including content changes)
    let resizeObserver;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        // ResizeObserver callback fires for all size changes
        updateHeaderHeight();
      });
      
      if (headerRef.current) {
        resizeObserver.observe(headerRef.current);
      }
    }

    // Also use MutationObserver to catch DOM changes that might affect height
    let mutationObserver;
    if (typeof MutationObserver !== 'undefined' && headerRef.current) {
      mutationObserver = new MutationObserver(() => {
        updateHeaderHeight();
      });
      
      mutationObserver.observe(headerRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
      });
    }

    // Initial measurement after a small delay to ensure content is loaded
    setTimeout(updateHeaderHeight, 0);
    
    // Also update when images load
    const images = headerRef.current?.querySelectorAll('img');
    images?.forEach(img => {
      if (img.complete) {
        updateHeaderHeight();
      } else {
        img.addEventListener('load', updateHeaderHeight);
        img.addEventListener('error', updateHeaderHeight);
      }
    });

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (mutationObserver) {
        mutationObserver.disconnect();
      }
      images?.forEach(img => {
        img.removeEventListener('load', updateHeaderHeight);
        img.removeEventListener('error', updateHeaderHeight);
      });
    };
  }, [networkInfo]); // Re-run when network info changes (which might change the logo)

  // Subscribe to network refresh events
  useNetworkRefresh(networkInfo?.id, getNetworkInfo);
  
  // Default values for non-logged-in users
  const defaultNetworkName = "Conclav";
  const showDefaultHeader = !user && !networkInfo;
  
  const displayedNetworkName = showDefaultHeader ? defaultNetworkName : networkInfo?.name;
  const displayedLogoUrl = networkInfo?.logo_url;
  const networkId = networkInfo?.id;
  
  // Simplified icon button style with consistent transitions
  const iconButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
    minWidth: { xs: '36px', sm: '40px' },
    height: { xs: '36px', sm: '40px' },
    borderRadius: '4px',
    padding: { xs: '6px', sm: '8px' },
    color: 'inherit',
    textDecoration: 'none',
    transition: 'background-color 0.3s ease-in-out',
    '&:hover': {
      backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.04)',
      '& .buttonText': {
        width: { xs: '0px', sm: '80px' },
        opacity: { xs: 0, sm: 1 },
        marginLeft: { xs: '0px', sm: '8px' },
      }
    }
  };

  // Simplified text style with consistent transitions
  const buttonTextStyle = {
    width: '0px',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    opacity: 0,
    marginLeft: '0px',
    transition: 'width 0.3s ease-in-out, opacity 0.3s ease-in-out, margin-left 0.3s ease-in-out',
    display: { xs: 'none', sm: 'block' }
  };

  // Get visible tabs from network context for mobile menu
  const { enabledTabs = [] } = useNetwork() || {};

  // Define all available tabs (matching NetworkLandingPage)
  const allTabs = [
    { id: 'news', icon: <AnnouncementIcon />, label: 'News' },
    { id: 'members', icon: <GroupsIcon />, label: 'Members' },
    { id: 'events', icon: <EventIcon />, label: 'Events' },
    { id: 'chat', icon: <ChatIcon />, label: 'Chat' },
    { id: 'files', icon: <AttachmentIcon />, label: 'Files' },
    { id: 'wiki', icon: <MenuBookIcon />, label: 'Wiki' },
    { id: 'courses', icon: <SchoolIcon />, label: 'Courses' },
    { id: 'social', icon: <TimelineIcon />, label: 'Social' },
    { id: 'about', icon: <InfoIcon />, label: 'About' }
  ];

  // Filter tabs based on enabled tabs
  const visibleTabs = React.useMemo(() => {
    if (!enabledTabs || enabledTabs.length === 0) {
      return allTabs;
    }
    const orderedTabs = enabledTabs
      .map(tabId => allTabs.find(tab => tab.id === tabId))
      .filter(tab => tab);

    const aboutTab = allTabs.find(tab => tab.id === 'about');
    if (aboutTab && !orderedTabs.some(tab => tab.id === 'about')) {
      orderedTabs.push(aboutTab);
    }

    return orderedTabs.length > 0 ? orderedTabs : allTabs;
  }, [enabledTabs]);

  // Show header if user is logged in OR if we have network info OR always show for non-logged-in users
  if (!user && !networkInfo) {
    // Always show header for non-logged-in users with default content
  } else if (!networkInfo && user) {
    // Hide header only if logged-in user has no network context
    return null;
  }

  return (
    <>
      {/* Mobile Menu - only on xs */}
      <MobileMenu
        networkLogo={displayedLogoUrl}
        networkName={displayedNetworkName}
        networkId={networkId}
        user={user}
        visibleTabs={visibleTabs}
      />

      {/* Desktop Header - hidden on xs */}
      <Box
        ref={headerRef}
        sx={{
          display: { xs: 'none', sm: 'flex' }, // Hide on mobile, show on desktop
          flexWrap: 'wrap',
          alignItems: 'stretch', // Changed from 'center' to 'stretch' to allow full height
          justifyContent: 'space-between',
          paddingX: 2,
          paddingY: { xs: 2, sm: 0 }, // Add vertical padding on mobile
          minHeight: '80px', // Set a consistent minimum height
          backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
          color: darkMode ? '#ffffff' : 'inherit',
          borderBottom: `1px solid ${darkMode ? '#333333' : '#eeeeee'}`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          position: 'sticky',
          top: 0,
          zIndex: 1300, // Sticky header above all content
          gap: { xs: 1, sm: 2 }
        }}
      >
      {/* Logo Block */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: { xs: 'center', sm: 'flex-start' },
        flexShrink: 0,
        order: { xs: 1, sm: 1 },
        minWidth: { xs: '100%', sm: 'auto' },
        alignSelf: 'center' // Override stretch for logo block
      }}>
        {displayedLogoUrl ? (
          <Link to={user && networkId ? '/network' : (networkId ? `/network/${networkId}` : '/dashboard')}>
            <img
              src={displayedLogoUrl}
              alt={displayedNetworkName || "Network Logo"}
              style={{
                maxHeight: '60px',
                maxWidth: '120px',
                objectFit: 'contain'
              }}
            />
          </Link>
        ) : showDefaultHeader ? (
          // Default Conclav logo for non-logged-in users
          <Link to="/" style={{ textDecoration: 'none' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {/* Simple Conclav logo */}
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="50" 
                height="50" 
                viewBox="-125 -125 250 250"
                style={{ marginRight: '8px' }}
              >
                <defs>
                  <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#667eea" stopOpacity="1" />
                    <stop offset="100%" stopColor="#764ba2" stopOpacity="1" />
                  </linearGradient>
                </defs>
                
                {/* Central big disk */}
                <circle cx="0" cy="0" r="35" fill="url(#logo-gradient)" />
                
                {/* Medium disks */}
                <g fill="url(#logo-gradient)" opacity="0.8">
                  <circle cx="70.00" cy="0.00" r="20" />
                  <circle cx="43.64" cy="54.72" r="20" />
                  <circle cx="-15.57" cy="68.24" r="20" />
                  <circle cx="-63.06" cy="30.37" r="20" />
                  <circle cx="-63.06" cy="-30.37" r="20" />
                  <circle cx="-15.57" cy="-68.24" r="20" />
                  <circle cx="43.64" cy="-54.72" r="20" />
                </g>
                
                {/* Small disks */}
                <g fill="#667eea" opacity="0.6">
                  <circle cx="85.59" cy="41.21" r="10" />
                  <circle cx="21.13" cy="92.61" r="10" />
                  <circle cx="-59.23" cy="74.27" r="10" />
                  <circle cx="-95.00" cy="0" r="10" />
                  <circle cx="-59.23" cy="-74.27" r="10" />
                  <circle cx="21.13" cy="-92.61" r="10" />
                  <circle cx="85.59" cy="-41.21" r="10" />
                </g>
              </svg>
            </Box>
          </Link>
        ) : null}
      </Box>
      
      {/* Network Name Block */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center',
        flexGrow: 1,
        justifyContent: { xs: 'center', sm: 'flex-start' },
        order: { xs: 2, sm: 2 },
        minWidth: { xs: '100%', sm: 'auto' },
        paddingX: { xs: 0, sm: 2 },
        alignSelf: 'center' // Override stretch for network name block
      }}>
        {loading ? (
          <Skeleton width={150} height={40} />
        ) : displayedNetworkName ? (
          <Typography
            variant="h6"
            component={networkId ? Link : 'div'}
            to={user && networkId ? '/network' : (networkId ? `/network/${networkId}` : undefined)}
            sx={{
              fontWeight: displayedLogoUrl ? 700 : 900,
              color: darkMode ? '#ffffff' : '#333333',
              textDecoration: 'none',
              textAlign: { xs: 'center', sm: 'left' },
              '&:hover': {
                textDecoration: networkId ? 'underline' : 'none',
              }
            }}
          >
            {displayedNetworkName}
          </Typography>
        ) : null}
      </Box>
      
      {/* Sign Up CTA for non-logged-in users or full buttons for logged-in users */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center',
        order: { xs: 4, sm: 4 },
        justifyContent: { xs: 'center', sm: 'flex-end' },
        minWidth: { xs: '100%', sm: 'auto' },
        flexWrap: 'wrap',
        gap: 0.5,
        alignSelf: 'center' // Override stretch for buttons block
      }}>
        {user ? (
          <>
            {/* Profile */}
            <Box 
              component={Link} 
              to={`/dashboard`}
              sx={iconButtonStyle}
            >
              <PersonIcon />
              <Typography
                className="buttonText"
                sx={buttonTextStyle}
              >
                Dashboard
              </Typography>
            </Box>
            
            {/* Network */}
            <Box 
              component={Link} 
              to={user && networkId ? '/network' : (networkId ? `/network/${networkId}` : '/dashboard')}
              sx={iconButtonStyle}
            >
              <BusinessIcon />
              <Typography
                className="buttonText"
                sx={buttonTextStyle}
              >
                Network
              </Typography>
            </Box>
            
            {/* Messages */}
            <Box 
              component={Link} 
              to="/messages"
              sx={iconButtonStyle}
            >
              <MessageBadge />
              <Typography
                className="buttonText"
                sx={buttonTextStyle}
              >
                Messages
              </Typography>
            </Box>
            
            {/* Profile Switcher - only show if user has multiple profiles */}
            {hasMultipleProfiles && (
              <>
              </>
            )}
            
            {/* Logout */}
            <Box 
              component="div"
              onClick={logout}
              sx={{
                ...iconButtonStyle,
                cursor: 'pointer',
              }}
            >
              <LogoutIcon />
              <Typography
                className="buttonText"
                sx={buttonTextStyle}
              >
                Logout
              </Typography>
            </Box>
            
            {/* Small vertical divider */}
            <Divider orientation="vertical" flexItem sx={{ 
              mx: 1, 
              height: '24px', 
              alignSelf: 'center',
              borderColor: darkMode ? alpha('#ffffff', 0.2) : alpha('#000000', 0.1)
            }} />
            
            {/* Dark Mode Toggle - Small Sun/Moon Toggle */}
            <Tooltip title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: darkMode ? alpha('#ffffff', 0.05) : alpha('#000000', 0.02),
                  borderRadius: '14px',
                  padding: '3px',
                  border: `1px solid ${darkMode ? alpha('#ffffff', 0.1) : alpha('#000000', 0.08)}`,
                  height: '28px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor: darkMode ? alpha('#ffffff', 0.1) : alpha('#000000', 0.05),
                  }
                }}
                onClick={toggleDarkMode}
              >
                <Box
                  sx={{ 
                    width: '22px',
                    position: 'relative',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  {darkMode ? (
                    <SunIcon 
                      fontSize="small" 
                      sx={{ 
                        color: '#FFA000',
                        fontSize: '16px'
                      }} 
                    />
                  ) : (
                    <MoonIcon 
                      fontSize="small"
                      sx={{ 
                        color: '#424242',
                        fontSize: '16px'
                      }} 
                    />
                  )}
                </Box>
              </Box>
            </Tooltip>
          </>
        ) : (
          // Sign Up and Login buttons for non-logged-in users
          <>
            <Button
              variant="outlined"
              onClick={() => navigate('/login')}
              sx={{
                color: darkMode ? '#ffffff' : '#667eea',
                borderColor: darkMode ? '#ffffff' : '#667eea',
                fontWeight: 'bold',
                px: 3,
                py: 1,
                borderRadius: 2,
                mr: 1,
                '&:hover': {
                  borderColor: darkMode ? '#ffffff' : '#5a6fd8',
                  backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(102, 126, 234, 0.05)',
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              Login
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate('/signup')}
              sx={{
                bgcolor: '#667eea',
                color: 'white',
                fontWeight: 'bold',
                px: 3,
                py: 1,
                borderRadius: 2,
                '&:hover': {
                  bgcolor: '#5a6fd8',
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              Sign Up
            </Button>
          </>
        )}
      </Box>
      </Box>
      
    </>
  );
};

export default NetworkHeader;