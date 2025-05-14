import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Divider,
  Alert,
  CircularProgress,
  alpha,
  useTheme as useMuiTheme
} from '@mui/material';
import { 
  Save as SaveIcon,
  Settings as SettingsIcon,
  Description as DescriptionIcon,
  Title as TitleIcon
} from '@mui/icons-material';
import { updateNetworkDetails } from '../../api/networks';

const NetworkSettingsTab = ({ network, onNetworkUpdate, darkMode }) => {
  const muiTheme = useMuiTheme();
  const [networkName, setNetworkName] = useState(network ? network.name : '');
  const [networkDescription, setNetworkDescription] = useState(network ? network.description || '' : '');
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

  const handleUpdateNetwork = async (e) => {
    e.preventDefault();
    
    if (!networkName.trim()) {
      setError('Network name cannot be empty.');
      return;
    }
    
    setUpdating(true);
    setError(null);
    setMessage('');
    
    const updates = { 
      name: networkName,
      description: networkDescription 
    };
    
    const result = await updateNetworkDetails(network.id, updates);
    
    if (result.success) {
      onNetworkUpdate({ ...network, ...updates });
      setMessage('Network settings updated successfully!');
    } else {
      setError(result.message || 'Failed to update network. Please try again.');
    }
    
    setUpdating(false);
  };

  return (
    <Card 
      elevation={0} 
      sx={{ 
        mb: 3,
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
          <SettingsIcon sx={{ mr: 1 }} />
          Basic Settings
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        {message && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setMessage('')}>
            {message}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        <form onSubmit={handleUpdateNetwork}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <Typography 
                variant="subtitle1" 
                gutterBottom 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  fontWeight: 'medium'
                }}
              >
                <TitleIcon fontSize="small" sx={{ mr: 1 }} />
                Network Name
              </Typography>
              <TextField 
                fullWidth
                variant="outlined"
                value={networkName}
                onChange={(e) => setNetworkName(e.target.value)}
                placeholder="Enter network name"
                size="medium"
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: darkMode ? alpha(muiTheme.palette.background.paper, 0.6) : alpha(muiTheme.palette.background.default, 0.6),
                  }
                }}
              />
            </Box>
            
            <Box>
              <Typography 
                variant="subtitle1" 
                gutterBottom 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  fontWeight: 'medium'
                }}
              >
                <DescriptionIcon fontSize="small" sx={{ mr: 1 }} />
                Network Description
              </Typography>
              <TextField 
                fullWidth
                variant="outlined"
                value={networkDescription}
                onChange={(e) => setNetworkDescription(e.target.value)}
                placeholder="Enter network description (optional)"
                multiline
                rows={4}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: darkMode ? alpha(muiTheme.palette.background.paper, 0.6) : alpha(muiTheme.palette.background.default, 0.6),
                  }
                }}
              />
            </Box>
            
            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={updating ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                disabled={updating}
                type="submit"
                size="large"
                sx={{ 
                  fontWeight: 'medium',
                  px: 3,
                  py: 1,
                  boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.2)' : '0 2px 6px rgba(0,0,0,0.1)',
                  '&:hover': {
                    boxShadow: darkMode ? '0 6px 16px rgba(0,0,0,0.3)' : '0 4px 10px rgba(0,0,0,0.15)',
                  }
                }}
              >
                {updating ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </Box>
        </form>
      </CardContent>
    </Card>
  );
};

export default NetworkSettingsTab;