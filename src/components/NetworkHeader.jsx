import React, { useState, useEffect, memo } from 'react';
import { Box, Typography, Skeleton, IconButton, Badge, Button, Menu, MenuItem, Avatar } from '@mui/material';
import { Logout as LogoutIcon, Person as PersonIcon } from '@mui/icons-material';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import { useAuth } from '../context/authcontext';
import { supabase } from '../supabaseclient';
import { Link } from 'react-router-dom';
import MailIcon from '@mui/icons-material/Mail';
import { useDirectMessages } from '../context/directMessagesContext';
import { fetchNetworkDetails } from '../api/networks';
import { logout } from '../api/auth';

// Separate MessageBadge component to focus on unread notifications
const MessageBadge = memo(() => {
  const { unreadTotal, refreshConversations } = useDirectMessages();
  
  // Refresh conversations when the component mounts to ensure we have the latest count
  useEffect(() => {
    refreshConversations();
    
    // Set up a polling interval to periodically check for new messages
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
        mr: 1,
      }}
    >
      <MailIcon />
    </Badge>
  );
});

// User Profile Menu component
const UserProfileMenu = () => {
  const { user } = useAuth();
  const { unreadTotal } = useDirectMessages();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  return (
    <div>
      <IconButton
        onClick={handleClick}
        size="medium"
        aria-controls={open ? 'profile-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
      >
        <Badge 
          badgeContent={unreadTotal} 
          color="error"
          overlap="circular"
          invisible={unreadTotal === 0}
          max={99}
          sx={{
            '& .MuiBadge-badge': {
              fontSize: '0.7rem',
              height: '20px',
              minWidth: '20px',
              fontWeight: 'bold'
            }
          }}
        >
          <AccountCircleOutlinedIcon style={{ fontSize: 30 }} />
        </Badge>
      </IconButton>
      <Menu
        id="profile-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem component={Link} to={`/profile/${user?.id}`} onClick={handleClose}>
          <PersonIcon sx={{ mr: 1 }} />
          My Profile
        </MenuItem>
        <MenuItem component={Link} to="/messages" onClick={handleClose}>
          <MessageBadge />
          Messages
        </MenuItem>
        <MenuItem onClick={() => { handleClose(); logout(); }}>
          <LogoutIcon sx={{ mr: 1 }} />
          Logout
        </MenuItem>
      </Menu>
    </div>
  );
};

const NetworkHeader = () => {
  const { user } = useAuth();
  const [networkInfo, setNetworkInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  function getNetworkIdFromUrl() {
    // try to get the network id from the url (network/:id)
    const urlParts = window.location.pathname.split('/');
    const networkPartIndex = urlParts.indexOf('network');
    if (networkPartIndex !== -1 && urlParts[networkPartIndex + 1]) {
      return urlParts[networkPartIndex + 1];
    }
    return null;
  }
  const networkIdFromUrl = getNetworkIdFromUrl();
  
  // If no networkName is provided as a prop, fetch it
  useEffect(() => {
    const getNetworkInfo = async () => {
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
  }, [user]);
  
  if (!networkInfo) return null;
  
  const displayedNetworkName = networkInfo?.name;
  const displayedLogoUrl = networkInfo?.logo_url;
  const networkId = networkInfo?.id;
  
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 2,
        backgroundColor: 'white',
        borderBottom: '1px solid #eee',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
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
              color: '#333',
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
      
      {user && <UserProfileMenu />}
    </Box>
  );
};

export default NetworkHeader;