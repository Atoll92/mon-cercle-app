// File: src/components/admin/NetworkInfoPanel.jsx
import React from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Divider,
  alpha,
  Chip,
  useTheme as useMuiTheme 
} from '@mui/material';
import {
  People as PeopleIcon,
  AdminPanelSettings as AdminIcon,
  CalendarToday as CalendarIcon,
  FingerprintOutlined as IdIcon
} from '@mui/icons-material';

const NetworkInfoPanel = ({ network, members, darkMode }) => {
  const muiTheme = useMuiTheme();
  
  // Calculate creation date in a more user-friendly format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  return (
    <Card 
      elevation={0}
      sx={{ 
        border: `1px solid ${muiTheme.palette.custom.border}`,
        bgcolor: darkMode ? alpha(muiTheme.palette.background.default, 0.4) : alpha(muiTheme.palette.background.paper, 0.8),
        borderRadius: 2
      }}
    >
      <CardContent>
        <Typography 
          variant="h6" 
          component="h2" 
          gutterBottom 
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            color: muiTheme.palette.primary.main,
            fontWeight: 'medium'
          }}
        >
          <IdIcon sx={{ mr: 1 }} />
          Network Information
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box 
              sx={{ 
                width: 40, 
                height: 40, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                bgcolor: alpha(muiTheme.palette.primary.main, 0.1),
                borderRadius: 1,
                mr: 2
              }}
            >
              <IdIcon color="primary" />
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Network ID
              </Typography>
              <Typography variant="body1" sx={{ fontFamily: 'monospace', letterSpacing: 0.5 }}>
                {network?.id || 'N/A'}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box 
              sx={{ 
                width: 40, 
                height: 40, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                bgcolor: alpha(muiTheme.palette.primary.main, 0.1),
                borderRadius: 1,
                mr: 2
              }}
            >
              <CalendarIcon color="primary" />
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Created On
              </Typography>
              <Typography variant="body1">
                {network?.created_at ? formatDate(network.created_at) : 'N/A'}
              </Typography>
            </Box>
          </Box>
          
          <Divider sx={{ my: 1 }} />
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box 
              sx={{ 
                width: 40, 
                height: 40, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                bgcolor: alpha(muiTheme.palette.primary.main, 0.1),
                borderRadius: 1,
                mr: 2
              }}
            >
              <PeopleIcon color="primary" />
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Members
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                <Chip 
                  label={`${members.length} Total`}
                  size="small"
                  color="default"
                  sx={{ fontWeight: 'medium' }}
                />
                <Chip 
                  label={`${members.filter(m => m.role === 'admin').length} Admins`}
                  size="small"
                  color="primary"
                  icon={<AdminIcon sx={{ fontSize: '1rem !important' }} />}
                  sx={{ fontWeight: 'medium' }}
                />
              </Box>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default NetworkInfoPanel;