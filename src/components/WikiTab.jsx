import React from 'react';
import { Link } from 'react-router-dom';
import {
  Typography,
  Paper,
  Divider,
  Box,
  Button
} from '@mui/material';

const WikiTab = ({ networkId, isUserMember }) => {
  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Network Wiki
        </Typography>
        
        <Button
          variant="contained"
          color="primary"
          component={Link}
          to={`/network/${networkId}/wiki`}
        >
          Go to Wiki
        </Button>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      <Box sx={{ textAlign: 'center', py: 3 }}>
        <Typography variant="body1" paragraph>
          The network wiki is a collaborative knowledge base where members can share information,
          documentation, and resources related to this network.
        </Typography>
        
        <Button
          variant="contained"
          color="primary"
          component={Link}
          to={`/network/${networkId}/wiki`}
          sx={{ mt: 2 }}
        >
          Browse Wiki Pages
        </Button>
        
        {isUserMember && (
          <Button
            variant="outlined"
            component={Link}
            to={`/network/${networkId}/wiki/new`}
            sx={{ mt: 2, ml: 2 }}
          >
            Create New Page
          </Button>
        )}
      </Box>
    </Paper>
  );
};

export default WikiTab;