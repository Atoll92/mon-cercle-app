// File: src/components/admin/NetworkInfoPanel.jsx
import React from 'react';
import { Box, Typography, Card, CardContent, Divider } from '@mui/material';

const NetworkInfoPanel = ({ network, members }) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom>
          Network Information
        </Typography>
        <Divider sx={{ mb: 3 }} />
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Network ID: {network?.id}
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            Created At: {new Date(network?.created_at).toLocaleDateString()}
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            Total Members: {members.length}
          </Typography>
          <Typography variant="subtitle1">
            Admin Members: {members.filter(m => m.role === 'admin').length}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default NetworkInfoPanel;