import React, { useState, useEffect, memo } from 'react';
import { Box, Typography, Skeleton, IconButton, Badge, Button } from '@mui/material';
import { Logout as LogoutIcon } from '@mui/icons-material';
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
  
  console.log('Rendering MessageBadge with unread count:', unreadTotal);
  
  return (
    <IconButton component={Link} to="/messages" color="inherit" aria-label={`${unreadTotal} unread messages`}>
      <Badge 
        badgeContent={unreadTotal} 
        color="error"
        max={99}
        overlap="circular"
        sx={{
          '& .MuiBadge-badge': {
            fontSize: '0.7rem',
            height: '20px',
            minWidth: '20px',
            fontWeight: 'bold'
          }
        }}
      >
        <MailIcon />
      </Badge>
    </IconButton>
  );
});

const NetworkLogoHeader = () => {
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
      
      {user && 
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <MessageBadge />
          <Button 
              variant="contained" 
              color="error" 
              onClick={logout}
              startIcon={<LogoutIcon />}
            >
              Logout
            </Button>
          </Box>
      }
    </Box>
  );
};

export default NetworkLogoHeader;