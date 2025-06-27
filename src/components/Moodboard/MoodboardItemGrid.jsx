import React from 'react';
import { Box, Paper } from '@mui/material';
import MoodboardItem from './MoodboardItem';

const MoodboardItemGrid = ({ item }) => {
  // Create a modified item for grid display (fixed size and position)
  const gridItem = {
    ...item,
    x: 0, // Reset position for grid
    y: 0,
    width: 280, // Fixed width for grid
    height: 280, // Fixed height for grid
  };

  // No-op handlers for read-only display
  const handleSelect = () => {};
  const handleMove = () => {};
  const handleResize = () => {};
  const handleEdit = () => {};
  const handleDelete = () => {};

  return (
    <Paper
      elevation={2}
      sx={{
        overflow: 'hidden',
        borderRadius: 2,
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
        },
        position: 'relative',
        height: 300,
      }}
    >
      <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
        <MoodboardItem
          item={gridItem}
          selected={false}
          onSelect={handleSelect}
          onMove={handleMove}
          onResize={handleResize}
          onEdit={handleEdit}
          onDelete={handleDelete}
          scale={1}
          isEditable={false}
        />
      </Box>
    </Paper>
  );
};

export default MoodboardItemGrid;