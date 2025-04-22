// src/components/NetworkLogoHeader.jsx - Using context properly
import React, { useState, useEffect } from 'react';
import { Box, Typography, Skeleton, IconButton } from '@mui/material';
import { useTheme } from './ThemeProvider';
import { useAuth } from '../context/authcontext';
import { supabase } from '../supabaseclient';
import { Link } from 'react-router-dom';
import Badge from '@mui/material/Badge';
import MailIcon from '@mui/icons-material/Mail';
import { useDirectMessages } from '../context/directMessagesContext';

const NetworkLogoHeader = ({ networkName: propNetworkName }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { unreadTotal } = useDirectMessages();
  const [networkInfo, setNetworkInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  // If no networkName is provided as a prop, fetch it
  useEffect(() => {
    const fetchNetworkInfo = async () => {
      if (!user || propNetworkName) return;
      
      try {
        setLoading(true);
        // Get user's profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('network_id')
          .eq('id', user.id)
          .single();
          
        if (profileError || !profileData?.network_id) return;
        
        // Get network details
        const { data: networkData, error: networkError } = await supabase
          .from('networks')
          .select('id, name, logo_url')
          .eq('id', profileData.network_id)
          .single();
          
        if (networkError) return;
        
        setNetworkInfo(networkData);
      } catch (error) {
        console.error('Error fetching network info:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNetworkInfo();
  }, [user, propNetworkName]);

  if (!user) return null;
  
  const displayedNetworkName = propNetworkName || networkInfo?.name;
  const displayedLogoUrl = theme?.logoUrl || networkInfo?.logo_url;
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
      
      <IconButton component={Link} to="/messages" color="inherit">
        <Badge badgeContent={unreadTotal} color="error">
          <MailIcon />
        </Badge>
      </IconButton>
    </Box>
  );
};

export default NetworkLogoHeader;