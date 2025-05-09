import React, { useState, useEffect } from 'react';
import { Box, Typography, Skeleton, Badge, Button } from '@mui/material';
import { Logout as LogoutIcon, Person as PersonIcon } from '@mui/icons-material';
import MailIcon from '@mui/icons-material/Mail';
import BusinessIcon from '@mui/icons-material/Business'; // Icon for network
import { useAuth } from '../context/authcontext';
import { supabase } from '../supabaseclient';
import { Link } from 'react-router-dom';
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
  const [networkInfo, setNetworkInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  function getNetworkIdFromUrl() {
    const urlParts = window.location.pathname.split('/');
    const networkPartIndex = urlParts.indexOf('network');
    if (networkPartIndex !== -1 && urlParts[networkPartIndex + 1]) {
      return urlParts[networkPartIndex + 1];
    }
    return null;
  }
  const networkIdFromUrl = getNetworkIdFromUrl();
  
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
      
      {user && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button 
            component={Link} 
            to={`/profile/${user?.id}`}
            startIcon={<PersonIcon />}
            color="inherit"
            size="small"
          >
            Profile
          </Button>
          
          <Button 
            component={Link} 
            to={networkId ? `/network/${networkId}` : '/dashboard'}
            startIcon={<BusinessIcon />}
            color="inherit"
            size="small"
          >
            Network
          </Button>
          
          <Button 
            component={Link} 
            to="/messages"
            startIcon={<MessageBadge />}
            color="inherit"
            size="small"
          >
            Messages
          </Button>
          
          <Button 
            onClick={logout}
            startIcon={<LogoutIcon />}
            color="inherit"
            size="small"
          >
            Logout
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default NetworkHeader;