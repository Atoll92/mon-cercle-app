// In your NetworkLogoHeader component
import React from 'react';
import { Box, Typography } from '@mui/material';
import { useTheme } from './ThemeProvider';
import { useAuth } from '../context/authcontext';

const NetworkLogoHeader = ({ networkName }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  
  if (!user) return null;

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2,
        backgroundColor: 'white',
        borderBottom: '1px solid #eee',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}
    >
      {theme?.logoUrl ? (
        <img 
          src={theme.logoUrl} 
          alt={networkName || "Network Logo"} 
          style={{ 
            maxHeight: '60px', 
            maxWidth: '200px',
            objectFit: 'contain',
            marginRight: networkName ? '16px' : 0
          }} 
        />
      ) : null}
      
      {networkName && (
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            fontWeight: theme?.logoUrl ? 400 : 600,
            color: '#333'
          }}
        >
          {networkName}
        </Typography>
      )}
    </Box>
  );
};

export default NetworkLogoHeader;