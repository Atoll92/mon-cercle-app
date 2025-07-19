import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Skeleton, Badge, Tooltip, alpha, Divider, Paper } from '@mui/material';
import { 
  Logout as LogoutIcon, 
  Person as PersonIcon,
  WbSunny as SunIcon,
  NightsStay as MoonIcon
} from '@mui/icons-material';
import MailIcon from '@mui/icons-material/Mail';
import BusinessIcon from '@mui/icons-material/Business'; // Icon for network
import { useAuth } from '../context/authcontext';
import { useTheme } from '../components/ThemeProvider'; // Import directly from ThemeProvider
import { Link, useLocation } from 'react-router-dom';
import { useDirectMessages } from '../context/directMessagesContext';
import { fetchNetworkDetails } from '../api/networks';
import { logout } from '../api/auth';
import { useProfile } from '../context/profileContext';
import { useNetworkRefresh } from '../hooks/useNetworkRefresh';
import { useNetwork } from '../context/networkContext';

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
  const [networkInfo, setNetworkInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const { hasMultipleProfiles, activeProfile } = useProfile();
  

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

  // Subscribe to network refresh events
  useNetworkRefresh(networkInfo?.id, getNetworkInfo);
  
  
  if (!networkInfo) return null;
  
  const displayedNetworkName = networkInfo?.name;
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
  
  return (
    <>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'stretch', // Changed from 'center' to 'stretch' to allow full height
          justifyContent: 'space-between',
          padding: '0,2',
          minHeight: '80px', // Set a consistent minimum height
          backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
          color: darkMode ? '#ffffff' : 'inherit',
          borderBottom: `1px solid ${darkMode ? '#333333' : '#eeeeee'}`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          position: 'relative',
          zIndex: 1200, // Ensure header is above other content
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
      
      {/* Buttons Block */}
      {user && (
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
        </Box>
      )}
      </Box>
      
    </>
  );
};

export default NetworkHeader;