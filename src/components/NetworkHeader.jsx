import React, { useState, useEffect } from 'react';
import { Box, Typography, Skeleton, Badge, IconButton, Tooltip, Switch, alpha, Divider } from '@mui/material';
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
import { supabase } from '../supabaseclient';
import { Link, useLocation } from 'react-router-dom';
import { useDirectMessages } from '../context/directMessagesContext';
import { fetchNetworkDetails } from '../api/networks';
import { logout } from '../api/auth';

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

  function getNetworkIdFromUrl(pathname) {
    const urlParts = pathname.split('/');
    const networkPartIndex = urlParts.indexOf('network');
    if (networkPartIndex !== -1 && urlParts[networkPartIndex + 1]) {
      return urlParts[networkPartIndex + 1];
    }
    return null;
  }
  
  useEffect(() => {
    const getNetworkInfo = async () => {
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

        // Get user's profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('network_id')
          .eq('id', user.id)
          .single();
          
        if (profileError || !profileData?.network_id) return;
        
        // Get network details
        const networkData = await fetchNetworkDetails(profileData.network_id);
        if (!networkData) return;
        setNetworkInfo(networkData);
      } catch (error) {
        console.error('Error fetching network info:', error);
      } finally {
        setLoading(false);
      }
    };
    
    getNetworkInfo();
  }, [user, location.pathname]);
  
  if (!networkInfo) return null;
  
  const displayedNetworkName = networkInfo?.name;
  const displayedLogoUrl = networkInfo?.logo_url;
  const networkId = networkInfo?.id;
  
  // Simplified icon button style with consistent transitions
  const iconButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
    minWidth: '40px',
    height: '40px',
    borderRadius: '4px',
    padding: '8px',
    color: 'inherit',
    textDecoration: 'none',
    transition: 'background-color 0.3s ease-in-out',
    '&:hover': {
      backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.04)',
      '& .buttonText': {
        width: '80px',
        opacity: 1,
        marginLeft: '8px',
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
  };
  
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 2,
        minHeight: '80px', // Set a consistent minimum height
        backgroundColor: darkMode ? '#1e1e1e' : '#ffffff', // Apply dark/light mode
        borderBottom: `1px solid ${darkMode ? '#333333' : '#eeeeee'}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        color: darkMode ? '#ffffff' : 'inherit', // Apply dark/light mode to text color
        position: 'relative',
        zIndex: 1200 // Ensure header is above other content
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {displayedLogoUrl ? (
          <Link to={networkId ? `/network/${networkId}` : '/dashboard'}>
            <img
              src={displayedLogoUrl}
              alt={displayedNetworkName || "Network Logo"}
              style={{
                maxHeight: '60px',
                maxWidth: '200px',
                objectFit: 'contain',
                marginRight: displayedNetworkName ? '16px' : 0
              }}
            />
          </Link>
        ) : null}
        
        {loading ? (
          <Skeleton width={150} height={40} />
        ) : displayedNetworkName ? (
          <Typography
            variant="h6"
            component={networkId ? Link : 'div'}
            to={networkId ? `/network/${networkId}` : undefined}
            sx={{
              fontWeight: displayedLogoUrl ? 700 : 900,
              color: darkMode ? '#ffffff' : '#333333', // Apply dark/light mode
              textDecoration: 'none',
              '&:hover': {
                textDecoration: networkId ? 'underline' : 'none',
              }
            }}
          >
            {displayedNetworkName}
          </Typography>
        ) : null}
      </Box>
      
      {user && (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
            to={networkId ? `/network/${networkId}` : '/dashboard'}
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
  );
};

export default NetworkHeader;