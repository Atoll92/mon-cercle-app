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
  CircularProgress
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { updateNetworkDetails } from '../../api/networks';

const NetworkSettingsTab = ({ network, onNetworkUpdate }) => {
  const [networkName, setNetworkName] = useState(network ? network.name : '');
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
    
    const result = await updateNetworkDetails(network.id, { name: networkName });
    
    if (result.success) {
      onNetworkUpdate({ ...network, name: networkName });
      setMessage('Network updated successfully!');
    } else {
      setError(result.message || 'Failed to update network. Please try again.');
    }
    
    setUpdating(false);
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom>
          Network Settings
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
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Network Name"
              value={networkName}
              onChange={(e) => setNetworkName(e.target.value)}
              required
              variant="outlined"
            />
          </Box>
          <Button 
            type="submit" 
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            disabled={updating}
          >
            {updating ? 'Updating...' : 'Update Network'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default NetworkSettingsTab;