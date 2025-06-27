import React from 'react';
import { Box } from '@mui/material';

/**
 * Reusable moodboard canvas container component
 * Provides the infinite canvas structure with background and transform logic
 */
const MoodboardCanvas = ({
  backgroundColor = '#f5f5f5',
  scale = 1,
  position = { x: 0, y: 0 },
  isDraggingCanvas = false,
  canvasRef,
  onCanvasClick,
  onCanvasMouseDown,
  onCanvasMouseMove,
  onCanvasMouseUp,
  onCanvasMouseLeave,
  showGrid = true,
  gridColor = '#ddd',
  gridSize = '20px',
  height = 'calc(100vh - 80px)',
  children
}) => {
  return (
    <Box
      ref={canvasRef}
      sx={{ 
        flexGrow: 1, 
        position: 'relative', 
        overflow: 'hidden',
        bgcolor: backgroundColor,
        cursor: isDraggingCanvas ? 'grabbing' : 'default',
        height
      }}
      onClick={onCanvasClick}
      onMouseDown={onCanvasMouseDown}
      onMouseMove={onCanvasMouseMove}
      onMouseUp={onCanvasMouseUp}
      onMouseLeave={onCanvasMouseLeave}
    >
      {/* The infinite canvas */}
      <Box
        sx={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          minWidth: '100vw',
          minHeight: '100vh',
          transformOrigin: '0 0',
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transition: isDraggingCanvas ? 'none' : 'transform 0.1s ease',
          zIndex: 1
        }}
      >
        {/* Background grid - Show within reasonable bounds */}
        {showGrid && !backgroundColor && (
          <Box 
            sx={{ 
              position: 'absolute',
              left: '-2000px',
              top: '-2000px',
              width: '4000px',
              height: '4000px',
              backgroundImage: `linear-gradient(${gridColor} 1px, transparent 1px), 
                              linear-gradient(90deg, ${gridColor} 1px, transparent 1px)`,
              backgroundSize: `${gridSize} ${gridSize}`,
              zIndex: 0
            }} 
          />
        )}
        
        {/* Render children (moodboard items) */}
        {children}
      </Box>
    </Box>
  );
};

export default MoodboardCanvas;