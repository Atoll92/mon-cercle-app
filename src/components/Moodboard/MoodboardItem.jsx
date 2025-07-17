import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  PictureAsPdf as PdfIcon
} from '@mui/icons-material';
import LinkPreview from '../LinkPreview';
import MediaPlayer from '../MediaPlayer';
import SimplePDFViewer from '../SimplePDFViewer';

const MoodboardItem = ({ 
  item, 
  selected, 
  onSelect, 
  onMove, 
  onResize, 
  onEdit, 
  onDelete, 
  scale, 
  isEditable 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: item.width, height: item.height });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showControls, setShowControls] = useState(selected);
  const itemRef = useRef(null);

  useEffect(() => {
    // Update size if item changes
    setSize({ width: item.width, height: item.height });
  }, [item.width, item.height]);

  // Update controls visibility when selected state changes
  useEffect(() => {
    setShowControls(selected);
  }, [selected]);

  const handleMouseDown = (e) => {
    if (!isEditable) return;
    
    // Skip if clicking on edit/delete buttons or resize handle
    if (e.target.closest('.MuiIconButton-root') || 
        e.target.classList.contains('resize-handle') ||
        e.target.closest('.resize-handle')) {
      e.stopPropagation();
      return;
    }
    
    e.stopPropagation();
    e.preventDefault(); // Prevent default behavior
    onSelect(item.id);
    
    setIsDragging(true);
    setStartPos({ x: e.clientX, y: e.clientY });
    
    // Calculate click position relative to item for natural dragging
    if (itemRef.current) {
      const rect = itemRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseMove = useCallback((e) => {
    if (isDragging) {
      const dx = (e.clientX - startPos.x) / scale;
      const dy = (e.clientY - startPos.y) / scale;
      
      onMove(item.id, {
        x: item.x + dx,
        y: item.y + dy
      });
      
      setStartPos({ x: e.clientX, y: e.clientY });
    } else if (isResizing) {
      const dx = (e.clientX - startPos.x) / scale;
      const dy = (e.clientY - startPos.y) / scale;
      
      const newWidth = Math.max(50, size.width + dx);
      const newHeight = Math.max(50, size.height + dy);
      
      setSize({ width: newWidth, height: newHeight });
      setStartPos({ x: e.clientX, y: e.clientY });
    }
  }, [isDragging, isResizing, item, onMove, scale, size, startPos]);

  const handleMouseUp = useCallback(() => {
    if (isResizing) {
      onResize(item.id, size);
    }
    setIsDragging(false);
    setIsResizing(false);
  }, [isResizing, item.id, onResize, size]);

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  // Log image loading status
  useEffect(() => {
    if (item.type === 'image' && item.content) {
      const img = new Image();
      img.onload = () => {
        console.log(`Image loaded: ${item.id}`);
        setImageLoaded(true);
      };
      img.onerror = () => {
        console.error(`Image failed to load: ${item.id} - ${item.content}`);
        setImageLoaded(false);
      };
      img.src = item.content;
    }
  }, [item.type, item.content, item.id]);

  // Handle resize handle mousedown
  const handleResizeMouseDown = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    setStartPos({ x: e.clientX, y: e.clientY });
  };

  // Render different content based on item type
  const renderContent = () => {
    switch (item.type) {
      case 'image':
        return (
          <Box sx={{ 
            width: '100%', 
            height: '100%', 
            position: 'relative', 
            overflow: 'hidden',
            backgroundColor: item.backgroundColor || 'transparent',
          }}>
            {/* Loading indicator */}
            {!imageLoaded && item.content && (
              <Box 
                sx={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  right: 0, 
                  bottom: 0, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  backgroundColor: 'rgba(0,0,0,0.1)',
                }}
              >
                <CircularProgress size={24} />
              </Box>
            )}
            
            <img 
              src={item.content} 
              alt={item.title || 'Moodboard image'} 
              onLoad={() => setImageLoaded(true)}
              onError={(e) => {
                console.error('Image load error:', item.content);
              }}
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'contain',
                pointerEvents: 'none',
                opacity: imageLoaded ? 1 : 0.3,
                transition: 'opacity 0.3s ease',
              }} 
            />
          </Box>
        );
      case 'video':
        return (
          <Box sx={{ 
            width: '100%', 
            height: '100%', 
            position: 'relative', 
            overflow: 'hidden',
            backgroundColor: item.backgroundColor || 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Box 
              sx={{ 
                maxWidth: '100%',
                maxHeight: '100%',
                position: 'relative',
                display: 'flex',
                alignItems: 'stretch',
                justifyContent: 'center'
              }}
              onMouseDown={(e) => {
                // Only stop propagation if clicking on actual interactive elements
                const target = e.target;
                const isControl = target.tagName === 'BUTTON' || 
                                 target.closest('button') ||
                                 target.closest('[role="slider"]') ||
                                 target.closest('.media-controls') ||
                                 target.type === 'range';
                
                if (isControl) {
                  e.stopPropagation();
                }
              }}
            >
                <MediaPlayer
                  src={item.content}
                  type="video"
                  title={item.metadata?.fileName || item.title || 'Video'}
                  compact={false}
                  darkMode={true}
                />
            </Box>
          </Box>
        );
      case 'audio':
        return (
          <Box sx={{ 
            width: '100%', 
            height: '100%', 
            position: 'relative', 
            overflow: 'hidden',
            backgroundColor: item.backgroundColor || '#f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2
          }}>
            <Box 
              sx={{ 
                width: '100%', 
                height: '100%'
              }}
              onMouseDown={(e) => {
                // Only stop propagation if clicking on actual interactive elements
                const target = e.target;
                const isControl = target.tagName === 'BUTTON' || 
                                 target.closest('button') ||
                                 target.closest('[role="slider"]') ||
                                 target.closest('.media-controls') ||
                                 target.type === 'range';
                
                if (isControl) {
                  e.stopPropagation();
                }
              }}
            >
              <MediaPlayer
                src={item.content}
                type="audio"
                title={item.metadata?.fileName || item.title || 'Audio'}
                compact={true}
                darkMode={false}
              />
            </Box>
          </Box>
        );
      case 'pdf':
        return (
          <Box sx={{ 
            width: '100%', 
            height: '100%', 
            position: 'relative', 
            overflow: 'hidden',
            backgroundColor: item.backgroundColor || '#f8f9fa',
          }}>
            <SimplePDFViewer
              url={item.content}
              pageNumber={1}
              width="100%"
              height="100%"
              showControls={false}
              backgroundColor={item.backgroundColor || 'white'}
            />
            
            {/* PDF info footer */}
            <Box sx={{ 
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              bgcolor: 'rgba(0,0,0,0.7)',
              color: 'white',
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1
            }}>
              <PdfIcon fontSize="small" />
              <Typography variant="caption" fontWeight="medium" noWrap>
                {item.title || 'PDF Document'}
              </Typography>
            </Box>
            
            {/* For view mode, we add a clickable overlay to open the PDF */}
            {!isEditable && (
              <Box 
                component="a"
                href={item.content}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ 
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'transparent',
                  '&:hover': {
                    bgcolor: 'rgba(0,0,0,0.04)',
                    '& .view-pdf-overlay': {
                      opacity: 1
                    }
                  }
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <Box 
                  className="view-pdf-overlay"
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.9)',
                    borderRadius: 1,
                    px: 2,
                    py: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    boxShadow: 2,
                    opacity: 0,
                    transition: 'opacity 0.2s'
                  }}
                >
                  <PdfIcon color="primary" />
                  <Typography color="primary" fontWeight="medium">
                    View PDF
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        );
      case 'text':
        return (
          <Box sx={{ width: '100%', height: '100%', pointerEvents: 'none' }}>
            <Typography 
              variant="body1" 
              component="div" 
              sx={{ 
                p: 2, 
                overflow: 'auto',
                width: '100%',
                height: '100%',
                color: item.textColor || '#000000',
                backgroundColor: item.backgroundColor || 'transparent',
                fontFamily: item.font_family || 'inherit',
                fontSize: item.font_size || 'inherit',
                fontWeight: item.font_weight || 'normal',
                lineHeight: item.line_height || 'normal',
                textAlign: item.text_align || 'left',
                pointerEvents: 'none'
              }}
            >
              {item.content}
            </Typography>
          </Box>
        );
      case 'link':
        return (
          <Box 
            sx={{ 
              width: '100%', 
              height: '100%',
              overflow: 'hidden',
              borderRadius: item.border_radius || 1,
              backgroundColor: item.backgroundColor || 'transparent',
            }}
          >
            <LinkPreview 
              url={item.content} 
              height="100%" 
              isEditable={!isEditable}
            />
          </Box>
        );
      default:
        return (
          <Box sx={{ p: 2, pointerEvents: 'none' }}>
            <Typography variant="body2" color="text.secondary">
              Unknown item type
            </Typography>
          </Box>
        );
    }
  };

  return (
    <Paper
      ref={itemRef}
      elevation={selected ? 8 : 1}
      sx={{
        position: 'absolute',
        left: `${item.x}px`,
        top: `${item.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        overflow: 'hidden',
        cursor: isEditable ? 'move' : 'default',
        border: selected ? '2px solid #2196f3' : 'none',
        transition: isDragging || isResizing ? 'none' : 'box-shadow 0.2s ease',
        zIndex: selected ? 100 : item.zIndex || 1,
        opacity: item.opacity !== undefined ? item.opacity : 1,
        backgroundColor: item.backgroundColor || 'transparent',
        borderRadius: `${item.border_radius || 0}px`,
        transform: `rotate(${item.rotation || 0}deg)`,
        '&:hover': {
          boxShadow: isEditable ? '0 6px 12px rgba(0,0,0,0.15)' : 'none'
        }
      }}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => isEditable && setShowControls(true)}
      onMouseLeave={() => isEditable && !selected && setShowControls(false)}
    >
      {renderContent()}
      
      {/* Controls - visible when selected or hovered */}
      {(selected || showControls) && isEditable && (
        <>
          <Box 
            className="resize-handle"
            sx={{
              position: 'absolute',
              right: 0,
              bottom: 0,
              width: 24,
              height: 24,
              cursor: 'nwse-resize',
              zIndex: 101,
              backgroundColor: 'rgba(255,255,255,0.7)',
              '&::after': {
                content: '""',
                position: 'absolute',
                right: 3,
                bottom: 3,
                width: 14,
                height: 14,
                borderRight: '3px solid #2196f3',
                borderBottom: '3px solid #2196f3'
              }
            }}
            onMouseDown={handleResizeMouseDown}
          />
          
          <Box 
            sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              display: 'flex',
              gap: 0.5,
              p: 0.5,
              bgcolor: 'rgba(255,255,255,0.95)',
              borderRadius: '0 0 0 8px',
              zIndex: 101,
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <IconButton 
              size="small" 
              color="primary" 
              onClick={(e) => {
                e.stopPropagation(); 
                e.preventDefault();
                onEdit(item);
              }}
              sx={{
                '&:hover': {
                  bgcolor: 'rgba(33, 150, 243, 0.1)'
                }
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton 
              size="small" 
              color="error" 
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onDelete(item.id);
              }}
              sx={{
                '&:hover': {
                  bgcolor: 'rgba(244, 67, 54, 0.1)'
                }
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default MoodboardItem;