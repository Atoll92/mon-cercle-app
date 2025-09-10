import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
} from '@mui/material';
import Spinner from '../Spinner';
import {
  PictureAsPdf as PdfIcon
} from '@mui/icons-material';
import LinkPreview from '../LinkPreview';
import MediaPlayer from '../MediaPlayer';
import PDFPreviewEnhanced from '../PDFPreviewEnhanced';
import UserContent from '../UserContent';

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
  // Removed showControls state - no longer needed
  const itemRef = useRef(null);

  useEffect(() => {
    // Update size if item changes
    setSize({ width: item.width, height: item.height });
  }, [item.width, item.height]);

  // Removed controls visibility effect - no longer needed

  const handleMouseDown = (e) => {
    if (!isEditable) return;
    
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
                <Spinner size={48} />
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
            <PDFPreviewEnhanced
              url={item.content}
              fileName={item.title || 'PDF Document'}
              title={item.title || 'PDF Document'}
              height="100%"
              showFileName={false}
              borderRadius={0}
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
          <Box 
            sx={{ 
              width: '100%', 
              height: '100%', 
              pointerEvents: 'none',
              p: 2,
              overflow: 'hidden', // No scrollbars
              backgroundColor: item.backgroundColor || 'transparent',
              display: 'flex',
              alignItems: item.text_align === 'center' ? 'center' : 'flex-start',
              justifyContent: item.text_align === 'center' ? 'center' : 'flex-start'
            }}
          >
            <UserContent
              content={item.content || ''}
              html={false}
              component="div"
              sx={{ 
                width: '100%',
                color: item.textColor || '#000000',
                fontFamily: item.font_family || 'inherit',
                fontSize: item.font_size || 'inherit',
                fontWeight: item.font_weight || 'normal',
                lineHeight: item.line_height || 'normal',
                textAlign: item.text_align || 'left',
                pointerEvents: 'none',
                wordBreak: 'break-word',
                overflowWrap: 'break-word'
              }}
            />
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

  // Calculate shadow opacity based on background transparency and item opacity
  const hasTransparentBg = !item.backgroundColor || item.backgroundColor === 'transparent';
  const itemOpacity = item.opacity !== undefined ? item.opacity : 1;
  const shadowOpacity = hasTransparentBg ? 0 : itemOpacity;
  
  // Calculate elevation-based shadow with opacity
  const getBoxShadow = (elevation) => {
    if (shadowOpacity === 0) return 'none';
    const baseAlpha = elevation === 8 ? 0.2 : 0.1;
    const alpha = baseAlpha * shadowOpacity;
    return `0 ${elevation}px ${elevation * 2}px rgba(0, 0, 0, ${alpha})`;
  };

  return (
    <Paper
      ref={itemRef}
      elevation={0} // Disable MUI's default shadow, we'll handle it manually
      sx={{
        position: 'absolute',
        left: `${item.x}px`,
        top: `${item.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        overflow: 'hidden',
        cursor: isEditable ? 'move' : 'default',
        border: selected ? '2px solid #2196f3' : 'none',
        boxShadow: getBoxShadow(selected ? 8 : 1),
        transition: isDragging || isResizing ? 'none' : 'box-shadow 0.2s ease, opacity 0.2s ease',
        zIndex: selected ? 100 : item.zIndex || 1,
        opacity: item.opacity !== undefined ? item.opacity : 1,
        backgroundColor: item.backgroundColor || 'transparent',
        borderRadius: `${item.border_radius || 0}px`,
        transform: `rotate(${item.rotation || 0}deg)`,
        '&:hover': {
          boxShadow: isEditable && shadowOpacity > 0 ? `0 6px 12px rgba(0, 0, 0, ${0.15 * shadowOpacity})` : 'none'
        }
      }}
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        if (isEditable) {
          e.stopPropagation();
          onSelect(item.id);
        }
      }}
    >
      {renderContent()}
      
      {/* Resize handle - only visible when selected */}
      {selected && isEditable && (
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
      )}
    </Paper>
  );
};

export default MoodboardItem;