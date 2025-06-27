import React from 'react';
import { Box, IconButton, Button, Typography } from '@mui/material';
import { ZoomIn as ZoomInIcon, ZoomOut as ZoomOutIcon } from '@mui/icons-material';

/**
 * Reusable zoom controls component for moodboard interfaces
 */
const ZoomControls = ({
  scale = 1,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  size = 'small',
  showReset = true,
  showPercentage = true
}) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <IconButton onClick={onZoomOut} size={size}>
        <ZoomOutIcon />
      </IconButton>
      
      {showPercentage && (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          minWidth: 60,
          mx: 0.5
        }}>
          <Typography variant="body2" align="center" sx={{ width: '100%' }}>
            {Math.round(scale * 100)}%
          </Typography>
        </Box>
      )}
      
      <IconButton onClick={onZoomIn} size={size}>
        <ZoomInIcon />
      </IconButton>
      
      {showReset && (
        <Button 
          size={size} 
          variant="outlined" 
          onClick={onZoomReset}
          sx={{ ml: 1, display: { xs: 'none', sm: 'inline-flex' } }}
        >
          Reset View
        </Button>
      )}
    </Box>
  );
};

export default ZoomControls;