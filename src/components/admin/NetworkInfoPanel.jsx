// File: src/components/admin/NetworkInfoPanel.jsx
import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Divider,
  alpha,
  Chip,
  useTheme as useMuiTheme,
  LinearProgress,
  Button,
  Alert
} from '@mui/material';
import Spinner from '../Spinner';
import {
  People as PeopleIcon,
  AdminPanelSettings as AdminIcon,
  CalendarToday as CalendarIcon,
  FingerprintOutlined as IdIcon,
  Storage as StorageIcon,
  TrendingUp as UpgradeIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { getNetworkStorageInfo } from '../../api/networks';
import { useNavigate } from 'react-router-dom';

const NetworkInfoPanel = ({ network, members, darkMode }) => {
  const muiTheme = useMuiTheme();
  const navigate = useNavigate();
  const [storageInfo, setStorageInfo] = useState(null);
  const [storageLoading, setStorageLoading] = useState(true);
  
  // Calculate creation date in a more user-friendly format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  // Format storage size
  const formatStorageSize = (mb) => {
    if (mb >= 1024 * 1024) {
      return `${(mb / (1024 * 1024)).toFixed(1)}TB`;
    } else if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)}GB`;
    }
    return `${mb}MB`;
  };
  
  // Load storage info
  useEffect(() => {
    const loadStorageInfo = async () => {
      if (!network?.id) return;
      
      try {
        setStorageLoading(true);
        const info = await getNetworkStorageInfo(network.id);
        setStorageInfo(info);
      } catch (error) {
        console.error('Error loading storage info:', error);
      } finally {
        setStorageLoading(false);
      }
    };
    
    loadStorageInfo();
  }, [network?.id]);
  
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
          
          <Divider sx={{ my: 1 }} />
          
          {/* Storage Usage Section */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
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
              <StorageIcon color="primary" />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Storage Usage
              </Typography>
              
              {storageLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  <Spinner size={16} />
                  <Typography variant="body2">Calculating...</Typography>
                </Box>
              ) : storageInfo ? (
                <Box sx={{ mt: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="body1">
                      {formatStorageSize(storageInfo.usageMB)} / {storageInfo.isUnlimited ? 'Unlimited' : formatStorageSize(storageInfo.limitMB)}
                    </Typography>
                    {!storageInfo.isUnlimited && (
                      <Typography variant="body2" color={storageInfo.percentageUsed >= 90 ? 'error' : 'text.secondary'}>
                        {storageInfo.percentageUsed}%
                      </Typography>
                    )}
                  </Box>
                  
                  {!storageInfo.isUnlimited && (
                    <LinearProgress 
                      variant="determinate" 
                      value={Math.min(storageInfo.percentageUsed, 100)}
                      color={storageInfo.percentageUsed >= 100 ? 'error' : storageInfo.percentageUsed >= 90 ? 'warning' : 'primary'}
                      sx={{ height: 8, borderRadius: 1, mb: 1 }}
                    />
                  )}
                  
                  <Chip 
                    label={storageInfo.plan.charAt(0).toUpperCase() + storageInfo.plan.slice(1) + ' Plan'}
                    size="small"
                    color="default"
                    sx={{ fontWeight: 'medium' }}
                  />
                  
                  {/* Show upgrade prompt if at or near limit */}
                  {storageInfo.isAtLimit && (
                    <Alert 
                      severity="error" 
                      sx={{ mt: 2 }}
                      action={
                        <Button 
                          color="inherit" 
                          size="small"
                          startIcon={<UpgradeIcon />}
                          onClick={() => navigate('/pricing')}
                        >
                          Upgrade
                        </Button>
                      }
                    >
                      <Typography variant="body2">
                        <strong>Storage limit reached!</strong> Upgrade your plan to continue uploading files.
                      </Typography>
                    </Alert>
                  )}
                  
                  {!storageInfo.isAtLimit && storageInfo.percentageUsed >= 90 && (
                    <Alert 
                      severity="warning" 
                      sx={{ mt: 2 }}
                      icon={<WarningIcon />}
                      action={
                        <Button 
                          color="inherit" 
                          size="small"
                          onClick={() => navigate('/pricing')}
                        >
                          View Plans
                        </Button>
                      }
                    >
                      <Typography variant="body2">
                        You're using {storageInfo.percentageUsed}% of your storage.
                      </Typography>
                    </Alert>
                  )}
                </Box>
              ) : (
                <Typography variant="body2" color="error">
                  Unable to load storage info
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default NetworkInfoPanel;