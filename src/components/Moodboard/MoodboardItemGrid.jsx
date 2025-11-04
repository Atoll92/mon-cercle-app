import React from 'react';
import { Box } from '@mui/material';
import MoodboardItemSimple from './MoodboardItemSimple';

const MoodboardItemGrid = ({ item, mediaOnly = true }) => {
  return (
    <Box
      sx={{
        width: '100%',
        height: 300,
        position: 'relative',
      }}
    >
      <MoodboardItemSimple
        item={item}
        mediaOnly={mediaOnly}
        style={{
          height: '100%',
          '&:hover': {
            transform: 'translateY(-8px)',
            boxShadow: 8,
          },
        }}
      />
    </Box>
  );
};

export default MoodboardItemGrid;