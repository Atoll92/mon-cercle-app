import React from 'react';
import { Box, Fade } from '@mui/material';
import WikiContent from './WikiContent';

const WikiTab = ({ networkId }) => {
  return (
    <Fade in={true} timeout={300}>
      <Box
        sx={{ 
          p: 4,
          borderRadius: 2,
          background: (theme) => theme.palette.mode === 'dark' 
            ? 'linear-gradient(145deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.05) 100%)'
            : 'linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,1) 100%)'
        }}
      >
        <WikiContent networkId={networkId} showBreadcrumbs={false} />
      </Box>
    </Fade>
  );
};

export default WikiTab;